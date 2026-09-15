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
 * Builds a {@link import('@adobe/helix-shared-queue').ReceivedMessage} from a raw SQS
 * message. Standalone (no `Queue`/`SqsBackend` instance required) so it can be reused both by
 * {@link SqsBackend#receiveBatch} and by {@link QueueServiceSqs.toReceivedMessages} for
 * messages delivered outside `Queue#receive()` entirely -- most notably an AWS Lambda
 * triggered by an SQS event source mapping.
 *
 * Unlike `SqsBackend`'s own (private) use of this mapping, this standalone version never
 * touches spillover/swap detection -- that requires the backend's configured `bucket`, which
 * is unavailable here; a caller that needs to resolve a swapped message body outside
 * `Queue#receive()` should use {@link dereferenceMessageBody} instead.
 *
 * @param {Object} raw a `ReceiveMessageCommand`-shaped message (`MessageId`/`Body`/
 *  `Attributes`, PascalCase). Note this differs from the field names AWS Lambda's own SQS
 *  event source mapping uses for `event.Records[]` entries (lowercase `messageId`/`body`,
 *  though nested `attributes` values keep their native PascalCase) -- callers on that path
 *  must remap fields to this shape first.
 * @returns {import('@adobe/helix-shared-queue').ReceivedMessage}
 */
export function toReceivedMessage(raw) {
  return {
    id: raw.MessageId,
    body: raw.Body,
    groupId: raw.Attributes?.MessageGroupId,
    receiveCount: raw.Attributes?.ApproximateReceiveCount === undefined
      ? undefined
      : Number(raw.Attributes.ApproximateReceiveCount),
    raw,
  };
}
