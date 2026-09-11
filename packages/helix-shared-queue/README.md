# Helix Shared - queue

The queue module provides a unified, backend-agnostic interface for sending and receiving messages via a message queue. `QueueService` and `Queue` are configured with a pluggable `QueueBackend` — this package ships no cloud SDK itself; it defines only the interface and a thin `send`/`receive`/`delete` facade on top of it.

The default AWS SQS backend lives in a separate package, `@adobe/helix-shared-queue-sqs`, which most consumers will want to install alongside this one.

## Installation

```bash
npm install @adobe/helix-shared-queue @adobe/helix-shared-queue-sqs
```

## Basic Usage

Existing SQS consumers use `QueueServiceSqs`, the `QueueService` subclass pre-wired with the default SQS backend, exported from `@adobe/helix-shared-queue-sqs`:

```js
import { QueueServiceSqs as QueueService } from '@adobe/helix-shared-queue-sqs';

export async function main(req, context) {
  const service = QueueService.fromContext(context);
  const queue = service.queue('my-queue-name');

  const { messageIds } = await queue.send([{ body: JSON.stringify({ hello: 'world' }) }]);

  return new Response(JSON.stringify({ messageIds }));
}
```

Consumers who want a different backend (or no cloud SDK dependency at all) construct core's generic `QueueService` directly with an explicit `backendFactory` — a function `(queueName, opts) => QueueBackend`:

```js
import { QueueService } from '@adobe/helix-shared-queue';
import { createDefaultBackendFactory } from '@adobe/helix-shared-queue-sqs';

const service = new QueueService({
  backendFactory: createDefaultBackendFactory(process.env),
  log: console,
});

const queue = service.queue('my-queue-name');
await queue.send([{ body: 'Hello World' }]);
service.close();
```

## Sending Messages

```js
const { messageIds } = await queue.send([
  { body: 'plain message' },
  { body: 'ordered message', groupId: 'order-42', dedupId: 'order-42-v1' },
]);
```

`groupId`/`dedupId` are named generically rather than after SQS FIFO's `MessageGroupId`/`MessageDeduplicationId`, so a future Azure Service Bus backend can map them onto a session id and native deduplication instead.

## Receiving and Deleting Messages

```js
const { messages } = await queue.receive({ minTime: 10, maxTime: 30, maxMessages: 100 });

for (const message of messages) {
  console.log(message.body);
}

const { deleted, failed } = await queue.delete(messages);
```

`receive()` long-polls: it keeps polling for at least `minTime` seconds, and if any messages were received in that window, keeps polling for more up to `maxTime` seconds total, stopping early once `maxMessages` is reached.

Each `message` returned by `receive()` carries an opaque `raw` field with the backend-native message object (e.g. SQS's full message including its `ReceiptHandle`). Pass the same message objects back into `delete()` unmodified — the backend reads whatever ack token it needs off `raw`. `delete()` is best-effort: individual per-message failures are collected into `failed` rather than thrown; only a total, whole-call failure throws.

## Oversized Messages: `isSwapped()` / `deserialize()`

A backend that spills oversized messages to blob storage (see "Notes for Backend Authors" below) does **not** transparently resolve them during `receive()` — `message.body` may be a backend-specific pointer rather than the real content. Check cheaply (no I/O) and resolve only when actually needed:

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

This split matters for callers that only need a few cheap fields out of a message (e.g. routing metadata) without paying for a blob fetch on every message, swapped or not. `delete()` still cleans up any spilled blob-storage object on ack, whether or not `deserialize()` was ever called for it. Backends that don't support spillover at all inherit safe defaults from `AbstractQueueBackend` (`isSwapped()` always `false`, `deserialize()` returns the message unchanged) — this API works identically (including as a no-op) regardless of which backend is plugged in.

## Notes for Backend Authors

- **No `MirroringBackend` equivalent.** Storage's `MirroringBackend` fans out writes to multiple backends for read redundancy, which is safe because reads are idempotent. Fanning out `send()` to two independent queue backends would mean *duplicate delivery* to two independent consumer fleets, not redundancy — don't port that pattern here.
- **Oversized-message spillover is a backend concern.** This package has no dependency on `@adobe/helix-shared-storage` and no opinion on how a backend handles a message too large for its provider's limits. A backend that needs to spill oversized messages to blob storage (as `BatchedQueueClient` did for SQS, hardcoding S3) should accept an injected `Storage`/`Bucket` from `@adobe/helix-shared-storage` for that purpose via its own constructor/backend-factory options, so the spill-storage choice tracks whatever `Storage` backend the host service already configured.
- **All three `QueueBackend` primitives (`sendBatch`/`receiveBatch`/`deleteBatch`) are mandatory** — there are no generic defaults to inherit from `AbstractQueueBackend`, since batch-size limits, long-poll call shape, and ack-token shape are all inherently provider-specific.
- **`isSwapped`/`deserialize` do have generic defaults** (always `false` / return the message unchanged), since spillover support is optional — most backends won't need it. A backend that does support spillover should implement both, and have `receiveBatch()` do only the cheap (no I/O) detection step eagerly — computing and stashing whatever it needs (e.g. a storage key) on `raw` — while deferring the actual blob fetch to `deserialize()`. `deleteBatch()` should use that same stashed state to clean up the spilled object on ack, independent of whether `deserialize()` was ever called.
