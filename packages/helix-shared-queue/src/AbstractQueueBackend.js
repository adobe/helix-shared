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

import { QueueError } from './QueueError.js';

/**
 * The pluggable queue backend interface. A `QueueBackend` wraps a single queue against a
 * single provider (SQS, Azure Service Bus, ...). `QueueService` is configured with a
 * `backendFactory` that produces one `QueueBackend` per queue name; {@link Queue} is a
 * thin, backend-agnostic facade over it.
 *
 * `sendBatch`/`receiveBatch`/`deleteBatch` are mandatory, with no generic default
 * implementation in {@link AbstractQueueBackend} — unlike `StorageBackend`'s 7 mandatory + 5
 * generic-default split, batch-size/payload-size limits, long-poll call shape, and ack-token
 * shape are all inherently provider-specific, so there is nothing safe to implement
 * generically here in terms of the other primitives. `isSwapped`/`deserialize`, by contrast,
 * default to a safe no-spillover-support implementation, since spillover is an optional
 * concern most backends won't need at all.
 *
 * @typedef {Object} QueueBackend
 * @property {string} name backend family tag used for error tagging, e.g. `'SQS'`,
 *  `'AzureServiceBus'`
 * @property {string} queueName the queue this backend instance is bound to
 * @property {*} [client] the backend's native client, if it has a meaningful one to expose
 *  (e.g. an `SQSClient`)
 * @property {function(import('./Queue.js').OutboundMessage[]):
 *   Promise<import('./Queue.js').SendResult>} sendBatch
 *  send a batch of messages; the backend owns its own batching/chunking against its own
 *  service limits (SQS's ≤10 msgs/≤256KB per `SendMessageBatchCommand` vs. Azure Service
 *  Bus's dynamic batch sizing) — mandatory, no generic default
 * @property {function(import('./Queue.js').ReceiveOptions=):
 *   Promise<import('./Queue.js').ReceiveResult>} receiveBatch
 *  long-poll for messages honoring `minTime`/`maxTime`/`maxMessages` — mandatory, no generic
 *  default (the loop shape is similar across backends, but the size/timeout of an individual
 *  poll call is not, so there's nothing safely factorable into a shared default). A message
 *  that a backend spilled to blob storage (because it was too large to send inline) is
 *  returned as-is — still a backend-specific pointer, not transparently resolved — see
 *  `isSwapped`/`deserialize` below.
 * @property {function(import('./Queue.js').ReceivedMessage[]):
 *   Promise<import('./Queue.js').DeleteResult>} deleteBatch
 *  best-effort acknowledge/delete of previously received messages; must not throw for
 *  individual per-message ack failures (collect them into `DeleteResult.failed` instead),
 *  only for a total, whole-call failure — mandatory. Also responsible for cleaning up any
 *  spilled blob-storage object a message references, once the message itself is
 *  successfully acknowledged, regardless of whether `deserialize` was ever called for it.
 * @property {function(import('./Queue.js').ReceivedMessage): Promise<boolean>} isSwapped
 *  cheap (no I/O), synchronous-in-practice check for whether a message's `body` is a
 *  backend-specific spillover pointer rather than the real content — generic default:
 *  always `false`
 * @property {function(import('./Queue.js').ReceivedMessage):
 *   Promise<import('./Queue.js').ReceivedMessage>} deserialize
 *  if `isSwapped(message)` is true, fetches the real content from blob storage and returns a
 *  new message with `body` replaced; otherwise returns `message` unchanged — generic
 *  default: always returns `message` unchanged
 */

/* eslint-disable class-methods-use-this -- mandatory-primitive stubs intentionally ignore `this` */
/**
 * Convenience base class for {@link QueueBackend} implementations. Concrete backend
 * packages (e.g. `@adobe/helix-shared-queue-sqs`) must implement all three primitives —
 * there are no generic defaults to inherit, unlike `AbstractStorageBackend`.
 *
 * @implements {QueueBackend}
 */
export class AbstractQueueBackend {
  /**
   * Wraps a caught, backend-native SDK error into a {@link QueueError} tagged with this
   * backend's `name`. Passes an already-`QueueError` through unchanged instead of
   * double-wrapping it.
   *
   * @protected
   * @param {Error} e the raw, caught SDK error
   * @param {string} message normalized message for the new `QueueError` — callers without a
   *  better message should pass `e.message` through verbatim
   * @param {Object} [fields]
   * @param {number} [fields.status]
   * @param {string} [fields.code]
   * @returns {QueueError}
   */
  _wrapError(e, message, { status, code } = {}) {
    if (e instanceof QueueError) {
      return e;
    }
    return new QueueError(message, {
      status, code, backend: this.name, cause: e,
    });
  }

  async sendBatch() {
    throw new Error('sendBatch() not implemented');
  }

  async receiveBatch() {
    throw new Error('receiveBatch() not implemented');
  }

  async deleteBatch() {
    throw new Error('deleteBatch() not implemented');
  }

  /**
   * Generic default: this backend never spills messages to blob storage, so nothing is ever
   * swapped.
   *
   * @returns {Promise<boolean>}
   */
  async isSwapped() {
    return false;
  }

  /**
   * Generic default: since {@link AbstractQueueBackend#isSwapped} always returns `false` for
   * this backend, there's never anything to resolve — return `message` unchanged.
   *
   * @param {import('./Queue.js').ReceivedMessage} message
   * @returns {Promise<import('./Queue.js').ReceivedMessage>}
   */
  async deserialize(message) {
    return message;
  }
}
