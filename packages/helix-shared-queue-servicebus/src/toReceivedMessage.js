/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Builds a {@link import('@adobe/helix-shared-queue').ReceivedMessage} from a raw Service Bus
 * message. Standalone (no `Queue`/`ServiceBusBackend` instance required) so it can be reused
 * both by {@link ServiceBusBackend#receiveBatch} and by
 * {@link QueueServiceServiceBus.toReceivedMessages} for messages delivered outside
 * `Queue#receive()` entirely -- most notably an Azure Function triggered by a Service Bus
 * trigger.
 *
 * Unlike `ServiceBusBackend`'s own (private) use of this mapping, this standalone version
 * never touches spillover/swap detection -- that requires the backend's configured `bucket`,
 * which is unavailable here; a caller that needs to resolve a swapped message body outside
 * `Queue#receive()` should use {@link dereferenceMessageBody} instead.
 *
 * @param {Object} raw a `ServiceBusReceivedMessage`-shaped message (`messageId`/`body`/
 *  `sessionId`/`deliveryCount`)
 * @returns {import('@adobe/helix-shared-queue').ReceivedMessage}
 */
export function toReceivedMessage(raw) {
  return {
    id: raw.messageId === undefined ? undefined : String(raw.messageId),
    body: raw.body,
    groupId: raw.sessionId,
    receiveCount: raw.deliveryCount,
    raw,
  };
}
