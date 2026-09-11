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

Spilled messages always use the exact wire format `BatchedQueueClient.serialize()` used — `{owner, repo, key, swapS3Url: 's3://bucket/key'}` — there is no alternate pointer shape for this backend. Realistically, anything adopting this backend in the Helix context has (or will have) `helix-indexer`-style consumers to stay compatible with, so there's no reason to offer a different shape. Two consequences:
- The spilled message body must already contain `owner`/`repo` fields (or an explicit `key`) — `sendBatch()` throws if neither is present when a message needs spilling.
- `bucket` must be backed by real AWS S3 (e.g. `@adobe/helix-shared-storage-s3`) — the emitted `swapS3Url` is a literal `s3://` URI that non-abstracted legacy consumers parse and fetch directly, bypassing this package's storage abstraction entirely.

### Receiving a Swapped Message: `isSwapped()`/`deserialize()`

`queue.receive()` does **not** transparently fetch a swapped-out message's real content — see `@adobe/helix-shared-queue`'s README for why (in short: forcing a blob fetch for every swapped message regardless of whether the caller needs the full body defeats an optimization `helix-indexer`'s `notify()` already relies on, reading just `owner`/`repo` off the message without ever touching storage). Check and resolve explicitly instead:

```js
const { messages } = await queue.receive();
for (let message of messages) {
  if (await queue.isSwapped(message)) {
    message = await queue.deserialize(message);
  }
  console.log(message.body); // guaranteed real now
}
await queue.delete(messages);
```

`queue.delete()` cleans up the swapped body from `bucket` once the message is acknowledged — regardless of whether `deserialize()` was ever called for it (deferred to this ack point, not done eagerly on receive, so a message redelivered before being successfully processed can still find its swapped body); cleanup failures are logged and otherwise ignored.

### Using Outside `receive()`/`delete()` (e.g. a Lambda SQS Event Source Mapping)

`isSwapped()`/`deserialize()` only help consumers going through `Queue`. A very common alternative — e.g. `helix-indexer`'s [`extractBody()`](https://github.com/adobe/helix-indexer/blob/main/src/index.js#L150) — is an AWS Lambda triggered directly by an SQS event source mapping: AWS itself does the "receive" and hands `event.Records[].body` straight to the handler, so this package's `receiveBatch()` is never involved at all.

For exactly that case, the same dereference-and-cleanup logic is available standalone, with no `Queue`/`SqsBackend` instance required — just a `Bucket` — and fetches immediately rather than lazily (there's little benefit to laziness when processing one record at a time anyway):

```js
import { dereferenceMessageBody } from '@adobe/helix-shared-queue-sqs';

export async function handler(event, context) {
  for (const record of event.Records) {
    const { body, cleanup } = await dereferenceMessageBody(record.body, { bucket, log: context.log });
    await process(JSON.parse(body));
    await cleanup(); // only after successful, durable processing
  }
}
```

`cleanup()` is always a function (a no-op when nothing was swapped), so it's safe to call unconditionally, and it never throws — a failure to delete the swapped body is logged and otherwise ignored.

## Long-Polling

`queue.receive({ minTime, maxTime, maxMessages })` generalizes `BatchedQueueClient.receive()`'s long-poll loop — see `@adobe/helix-shared-queue`'s README for the semantics. Each individual `ReceiveMessageCommand` call is capped at SQS's own per-call limits (10 messages, 20s wait), looped transparently.

## Environment Variables

`createDefaultBackendFactory(env, opts)` (used internally by `QueueServiceSqs.fromContext()`) reads:

- `AWS_REGION` — SQS is region-specific (unlike S3), so this must match the queue's actual region.
- `HELIX_HTTP_CONNECTION_TIMEOUT` / `HELIX_HTTP_SOCKET_TIMEOUT` — connection/socket timeouts in ms (defaults: 5000/15000).
- `HELIX_HTTP_SQS_KEEP_ALIVE` — `'true'` to enable HTTP keep-alive.
- `HELIX_QUEUE_MAX_ATTEMPTS` — overrides the SDK's default retry attempts.
