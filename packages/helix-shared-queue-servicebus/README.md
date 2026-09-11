# Helix Shared - queue - Azure Service Bus

The Azure Service Bus `QueueBackend` for `@adobe/helix-shared-queue` — the concrete backend proposed (tracking-only, no code) in issue #1271, built to validate that the pluggable-queue pattern established for SQS (`@adobe/helix-shared-queue-sqs`) generalizes to a second, materially different provider.

## Installation

```bash
npm install @adobe/helix-shared-queue @adobe/helix-shared-queue-servicebus
```

## Basic Usage

`QueueServiceServiceBus` is a `QueueService` subclass pre-wired with the default Service Bus backend:

```js
import { QueueServiceServiceBus as QueueService } from '@adobe/helix-shared-queue-servicebus';

export async function main(req, context) {
  const service = QueueService.fromContext(context);
  const queue = service.queue('my-queue-name');

  const { messageIds } = await queue.send([{ body: JSON.stringify({ hello: 'world' }) }]);

  return new Response(JSON.stringify({ messageIds }));
}
```

## Environment Variables

`createDefaultBackendFactory(env, opts)` (used internally by `QueueServiceServiceBus.fromContext()`) reads:

- `HLX_AZURE_SERVICE_BUS_CONNECTION_STRING` — a Service Bus namespace connection string. This is the only supported auth method for now — there is no managed-identity (`@azure/identity`) support yet, matching `@adobe/helix-shared-storage-azure`'s connection-string/account-key-only precedent. See issue #1271 for context on this being a deferred decision.

## Real API Differences from the SQS Backend (not implementation choices)

Porting the same abstraction onto Azure Service Bus surfaced genuine API-shape differences, not just naming differences:

- **No partial batch success/failure.** SQS's `SendMessageBatchCommand` reports per-entry `Successful`/`Failed`; Service Bus's `sendMessages()` either sends the whole batch or throws. So unlike the SQS backend, `sendBatch()` here cannot log-and-skip an individual bad message within an otherwise-good batch — a batch failure here always propagates as a `QueueError`.
- **No bulk-ack API.** SQS batches deletes via `DeleteMessageBatchCommand`; Service Bus only exposes `completeMessage()` for one message at a time, so `deleteBatch()` completes each message individually (in parallel), which also means per-message ack failures are naturally isolated without needing SQS's chunking logic.
- **Exact, connection-aware batch sizing.** `ServiceBusMessageBatch#tryAddMessage()` does real, connection-negotiated size checking, so — unlike the SQS backend, which has to approximate serialized entry size itself — this backend needs no `MAX_BATCH_BYTES`-style constant at all.
- **Ack requires the exact received object.** SQS acks via a `ReceiptHandle` string copied out of the message; Service Bus's `completeMessage(message)` requires the *same* `ServiceBusReceivedMessage` instance the SDK returned (it's used for internal lock tracking) — so unlike the SQS backend, this one mutates the raw message in place to attach its `cleanup` closure rather than building a plain-object copy.
- **`groupId` → `sessionId`, send-side only.** Service Bus's `sessionId` (mapped from `groupId`) requires session-enabled queues, and session-ordered *consumption* requires an entirely different receiver (`acceptSession()`/`acceptNextSession()`, not the plain `createReceiver()` this backend uses). This backend supports the send-side mapping but does not implement session-based receive — a known, documented limitation, not an oversight.

## Oversized-Message Spillover

Same pattern as the SQS backend: a single message too large to fit any batch is spilled to an injected `@adobe/helix-shared-storage` `Bucket`. This package has no prior wire format to stay compatible with, so there's only one pointer shape: `{swapBucket, swapKey}` — no SQS-style `legacySwapFormat` equivalent.

```js
import { QueueServiceServiceBus as QueueService } from '@adobe/helix-shared-queue-servicebus';
import { StorageAzure as Storage } from '@adobe/helix-shared-storage-azure';

const bucket = Storage.fromContext(context).contentBus();
const service = QueueService.fromContext(context, { bucket });
```

`bucket` (and `swapPrefix`, defaulting to `'default/servicebus-swap'`) can also be set per queue: `service.queue('my-queue-name', { bucket, swapPrefix })`.

### Receiving a Swapped Message: `isSwapped()`/`deserialize()`

`queue.receive()` does **not** transparently fetch a swapped-out message's real content — see `@adobe/helix-shared-queue`'s README for why (in short: forcing a blob fetch for every swapped message regardless of whether the caller needs the full body is wasteful). Check and resolve explicitly instead:

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

`queue.delete()` cleans up the swapped body from `bucket` once the message is acknowledged — regardless of whether `deserialize()` was ever called for it; cleanup failures are logged and otherwise ignored.

### Using Outside `receive()`/`delete()` (e.g. an Azure Function Service Bus Trigger)

`isSwapped()`/`deserialize()` only help consumers going through `Queue`. An Azure Function with a Service Bus trigger delivers the message straight to the handler, never calling `Queue#receive()` at all. For that case, the same dereference-and-cleanup logic is available standalone — fetching immediately, since there's little benefit to laziness processing one message at a time:

```js
import { dereferenceMessageBody } from '@adobe/helix-shared-queue-servicebus';

export async function handler(message, context) {
  const { body, cleanup } = await dereferenceMessageBody(String(message.body), { bucket, log: context.log });
  await process(JSON.parse(body));
  await cleanup(); // only after successful, durable processing
}
```

## Long-Polling

`queue.receive({ minTime, maxTime, maxMessages })` follows the same contract as the SQS backend (see `@adobe/helix-shared-queue`'s README), adapted to `receiveMessages()`'s single-call shape — unlike SQS, there's no fixed per-call message-count cap to chunk against.
