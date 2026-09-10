# Helix Shared - queue - SQS

The default AWS SQS `QueueBackend` for `@adobe/helix-shared-queue` — a behavior-preserving port of `BatchedQueueClient` (`@adobe/helix-admin-support`) onto the pluggable queue interface.

## Installation

```bash
npm install @adobe/helix-shared-queue @adobe/helix-shared-queue-sqs
```

## Basic Usage

`QueueServiceSqs` is a `QueueService` subclass pre-wired with the default SQS backend, so existing `BatchedQueueClient` consumers migrate with a one-line import change:

```js
import { QueueServiceSqs as QueueService } from '@adobe/helix-shared-queue-sqs';

export async function main(req, context) {
  const service = QueueService.fromContext(context);
  const queue = service.queue('my-queue-name');

  const { messageIds } = await queue.send([{ body: JSON.stringify({ hello: 'world' }) }]);

  return new Response(JSON.stringify({ messageIds }));
}
```

`queue('my-queue-name')` takes a logical queue name, never a queue URL — the actual SQS queue URL is resolved (via `GetQueueUrlCommand`) and cached internally, per queue, the first time it's needed.

## Batching Limits

`sendBatch`/`deleteBatch` respect SQS's own limits (at most 10 entries and 256KB total per `SendMessageBatchCommand`/`DeleteMessageBatchCommand` call), chunking transparently. A single message too large to fit in a batch on its own is spilled to blob storage — see below — instead of failing outright.

Per-entry failures reported by SQS (e.g. a single malformed message in an otherwise successful batch) are logged and skipped rather than thrown: `send()`'s returned `messageIds` may contain fewer entries than the input array in that case. A failure of the underlying `SendMessageBatchCommand`/`DeleteMessageBatchCommand`/`ReceiveMessageCommand` call itself (network, permissions, ...) is thrown as a `QueueError`.

## Oversized-Message Spillover

Unlike `BatchedQueueClient` (which hardcoded S3 for this), spillover here is done through an injected `Bucket` from `@adobe/helix-shared-storage`, so it tracks whatever storage backend the host service already configured:

```js
import { QueueServiceSqs as QueueService } from '@adobe/helix-shared-queue-sqs';
import { StorageS3 as Storage } from '@adobe/helix-shared-storage-s3';

const bucket = Storage.fromContext(context).contentBus();
const service = QueueService.fromContext(context, { bucket });
```

`bucket` (and `swapPrefix`, defaulting to `'default/sqs-swap'`) can also be set per queue: `service.queue('my-queue-name', { bucket, swapPrefix })`. Without a configured bucket, attempting to send a message too large for SQS on its own throws.

Spillover is fully transparent on the receive side too: `queue.receive()` automatically detects a swapped-out message, fetches the real body from `bucket`, and returns it in place of the pointer — callers never see a swap pointer. The swapped body is cleaned up from `bucket` once the message is acknowledged via `queue.delete()` (not eagerly on receive, so a message that's redelivered before being successfully processed can still find its swapped body); cleanup failures are logged and otherwise ignored.

### Wire Compatibility with `BatchedQueueClient` (`legacySwapFormat`)

By default, spilled messages use this package's own pointer shape (`{swapBucket, swapKey}`). If the same queue is also read by consumers that haven't migrated off `BatchedQueueClient` yet (e.g. `helix-indexer`'s `extractBody()`, which looks for a `swapS3Url` field), set `legacySwapFormat: true` to emit the exact wire format `BatchedQueueClient.serialize()` used instead: `{owner, repo, key, swapS3Url: 's3://bucket/key'}`.

```js
const service = QueueService.fromContext(context, { bucket, legacySwapFormat: true });
```

Notes:
- The spilled message body must already contain `owner`/`repo` fields (or an explicit `key`) — `sendBatch()` throws if neither is present when a message needs spilling.
- `bucket` must be backed by real AWS S3 (e.g. `@adobe/helix-shared-storage-s3`) in this mode — the emitted `swapS3Url` is a literal `s3://` URI that non-abstracted legacy consumers parse and fetch directly, bypassing this package's storage abstraction entirely.
- `legacySwapFormat` can also be set per queue: `service.queue('my-queue-name', { legacySwapFormat: true })`.

### Using Outside `receive()`/`delete()` (e.g. a Lambda SQS Event Source Mapping)

`queue.receive()`'s transparent dereferencing only helps consumers that actually call it. A very common alternative — e.g. `helix-indexer`'s [`extractBody()`](https://github.com/adobe/helix-indexer/blob/main/src/index.js#L150) — is an AWS Lambda triggered directly by an SQS event source mapping: AWS itself does the "receive" and hands `event.Records[].body` straight to the handler, so this package's `receiveBatch()` is never involved at all.

For exactly that case, the same dereferencing logic is available standalone, with no `Queue`/`SqsBackend` instance required — just a `Bucket`:

```js
import { dereferenceMessageBody } from '@adobe/helix-shared-queue-sqs';

export async function handler(event, context) {
  for (const record of event.Records) {
    const { body, cleanup } = await dereferenceMessageBody(record.body, {
      bucket, legacySwapFormat: true, log: context.log,
    });
    await process(JSON.parse(body));
    await cleanup(); // only after successful, durable processing
  }
}
```

`cleanup()` is always a function (a no-op when nothing was swapped), so it's safe to call unconditionally, and it never throws — a failure to delete the swapped body is logged and otherwise ignored. `SqsBackend` uses this same function internally for `receiveBatch()`/`deleteBatch()`.

## Long-Polling

`queue.receive({ minTime, maxTime, maxMessages })` generalizes `BatchedQueueClient.receive()`'s long-poll loop — see `@adobe/helix-shared-queue`'s README for the semantics. Each individual `ReceiveMessageCommand` call is capped at SQS's own per-call limits (10 messages, 20s wait), looped transparently.

## Environment Variables

`createDefaultBackendFactory(env, opts)` (used internally by `QueueServiceSqs.fromContext()`) reads:

- `AWS_REGION` — SQS is region-specific (unlike S3), so this must match the queue's actual region.
- `HELIX_HTTP_CONNECTION_TIMEOUT` / `HELIX_HTTP_SOCKET_TIMEOUT` — connection/socket timeouts in ms (defaults: 5000/15000).
- `HELIX_HTTP_SQS_KEEP_ALIVE` — `'true'` to enable HTTP keep-alive.
- `HELIX_QUEUE_MAX_ATTEMPTS` — overrides the SDK's default retry attempts.
