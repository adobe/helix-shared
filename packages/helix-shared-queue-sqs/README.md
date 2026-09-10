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

## Long-Polling

`queue.receive({ minTime, maxTime, maxMessages })` generalizes `BatchedQueueClient.receive()`'s long-poll loop — see `@adobe/helix-shared-queue`'s README for the semantics. Each individual `ReceiveMessageCommand` call is capped at SQS's own per-call limits (10 messages, 20s wait), looped transparently.

## Environment Variables

`createDefaultBackendFactory(env, opts)` (used internally by `QueueServiceSqs.fromContext()`) reads:

- `AWS_REGION` — SQS is region-specific (unlike S3), so this must match the queue's actual region.
- `HELIX_HTTP_CONNECTION_TIMEOUT` / `HELIX_HTTP_SOCKET_TIMEOUT` — connection/socket timeouts in ms (defaults: 5000/15000).
- `HELIX_HTTP_SQS_KEEP_ALIVE` — `'true'` to enable HTTP keep-alive.
- `HELIX_QUEUE_MAX_ATTEMPTS` — overrides the SDK's default retry attempts.
