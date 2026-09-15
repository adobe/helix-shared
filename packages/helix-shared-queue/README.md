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

### Receiving Messages Outside `Queue#receive()`

Some consumers never call `receive()` at all — the runtime hands messages straight to the handler (an AWS Lambda triggered by an SQS event source mapping, an Azure Function Service Bus trigger, ...). To normalize such a message into the same `ReceivedMessage` shape, use the backend-specific `QueueService` subclass's `toReceivedMessages()`, e.g. `QueueServiceSqs.fromContext(context).toReceivedMessages(rawMessages)` from `@adobe/helix-shared-queue-sqs` or `QueueServiceServiceBus.fromContext(context).toReceivedMessages(rawMessages)` from `@adobe/helix-shared-queue-servicebus` — see each package's README for its expected raw shape. The base `QueueService` has no way to know any backend's raw message shape, so calling it there throws; each backend package implements it. Since this is an instance method (not static), the same `service` also gives you `isSwapped()`/`deserialize()` below, with no need to ever call `service.queue(name)`.

## Oversized Messages: `isSwapped()` / `deserialize()`

A backend that spills oversized messages to blob storage (see "Notes for Backend Authors" below) does **not** transparently resolve them during `receive()` — `message.body` may be a backend-specific pointer rather than the real content. Check cheaply (no I/O) and resolve only when actually needed, off the `QueueService` instance itself:

```js
const { messages } = await queue.receive();
for (let message of messages) {
  if (await service.isSwapped(message)) {
    message = await service.deserialize(message);
  }
  console.log(message.body); // guaranteed real now
}
await queue.delete(messages);
```

This works identically for a message obtained via `Queue#receive()` or via `service.toReceivedMessages()` (the cloud-trigger delivery path above) — both resolve purely off `message.body`, so neither needs a `Queue` instance. This split also matters for callers that only need a few cheap fields out of a message (e.g. routing metadata) without paying for a blob fetch on every message, swapped or not. `delete()` still cleans up any spilled blob-storage object on ack, whether or not `deserialize()` was ever called for it. A `QueueService` that doesn't support spillover at all inherits safe generic defaults (`isSwapped()` always `false`, `deserialize()` returns the message unchanged) — this API works identically (including as a no-op) regardless of which backend is plugged in.

## Notes for Backend Authors

- **No `MirroringBackend` equivalent.** Storage's `MirroringBackend` fans out writes to multiple backends for read redundancy, which is safe because reads are idempotent. Fanning out `send()` to two independent queue backends would mean *duplicate delivery* to two independent consumer fleets, not redundancy — don't port that pattern here.
- **Oversized-message spillover is a `QueueService`-subclass concern, not a `QueueBackend` concern.** This package has no dependency on `@adobe/helix-shared-storage` and no opinion on how a backend handles a message too large for its provider's limits. A backend package that needs to spill oversized messages to blob storage (as `BatchedQueueClient` did for SQS, hardcoding S3) should accept an injected `Storage` from `@adobe/helix-shared-storage` (plus a target bucket name) via its own constructor/backend-factory options for the send-side spill, and have its `QueueService` subclass implement `isSwapped`/`deserialize` using `QueueService#storage` to resolve whichever bucket a received message's own pointer names — see `@adobe/helix-shared-queue-servicebus`'s implementation for the reference pattern, including its trust model (it resolves the bucket named by the pointer, rather than requiring it to match a pre-configured name).
- **All three `QueueBackend` primitives (`sendBatch`/`receiveBatch`/`deleteBatch`) are mandatory** — there are no generic defaults to inherit from `AbstractQueueBackend`, since batch-size limits, long-poll call shape, and ack-token shape are all inherently provider-specific.
- **`QueueService#isSwapped`/`#deserialize` do have generic defaults** (always `false` / return the message unchanged), since spillover support is optional — most backends won't need it. A `QueueService` subclass that does support spillover should override both. Its backend's `receiveBatch()` should still do the cheap (no I/O) detection step eagerly — stashing whatever it needs (e.g. a storage key) on `raw` — purely so `deleteBatch()` can clean up the spilled object on ack later, independent of whether `deserialize()` was ever called; the public `isSwapped()`/`deserialize()` resolve directly from `message.body` instead, so they work the same way for a message obtained via `receive()` or via `toReceivedMessages()`.
