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
 * A single outbound message to send via {@link Queue#send}.
 *
 * @typedef {Object} OutboundMessage
 * @property {string} body message payload, verbatim (backend decides wire encoding)
 * @property {string} [groupId] ordering/session key. Maps onto SQS FIFO's `MessageGroupId`
 *  today; named generically so a future Azure Service Bus backend can map it onto a session
 *  id instead.
 * @property {string} [dedupId] deduplication key. Maps onto SQS FIFO's
 *  `MessageDeduplicationId` today; named generically so a future Azure Service Bus backend
 *  can map it onto its own native dedup mechanism instead.
 */

/**
 * Result of {@link Queue#send}.
 *
 * @typedef {Object} SendResult
 * @property {string[]} messageIds backend-assigned ids, one per input message, in the same
 *  order as the input array.
 */

/**
 * A single message returned by {@link Queue#receive}. Round-trips through
 * {@link Queue#delete} to acknowledge — `raw` carries whatever backend-native handle is
 * needed to ack (SQS's `ReceiptHandle`, a future Azure Service Bus lock token); `Queue`
 * itself never interprets it.
 *
 * `body` may be a backend-specific spillover pointer rather than the real message content,
 * if the backend spilled it to blob storage because it was too large to send inline —
 * `receive()` does **not** transparently resolve this (unlike a prior design of this
 * package): call {@link Queue#isSwapped} to check cheaply (no I/O), and
 * {@link Queue#deserialize} to fetch the real content only when actually needed. This
 * split exists so a caller that only needs a few cheap fields out of a large message (e.g.
 * routing metadata) never pays for the blob fetch.
 *
 * @typedef {Object} ReceivedMessage
 * @property {string} id backend-native message id (e.g. SQS's `MessageId`)
 * @property {string} body message payload, verbatim — see note above about spillover
 * @property {string} [groupId] echoes the ordering/session key that produced this message,
 *  when the backend can report one
 * @property {number} [receiveCount] number of times this message has been delivered so far
 *  (SQS's `ApproximateReceiveCount`), when the backend can report it
 * @property {*} raw the backend's raw, native SDK message object — opaque to `Queue`;
 *  required by {@link Queue#delete} to ack this specific message, and used by backends to
 *  privately track spillover state between `isSwapped`/`deserialize`/`delete`
 */

/**
 * Options for {@link Queue#receive}, generalizing `BatchedQueueClient.receive()`'s
 * long-poll loop: keep polling for at least `minTime` seconds; if anything was received in
 * that window, keep polling for more up to `maxTime` seconds total; stop early once
 * `maxMessages` is reached or no time budget remains. Individual poll-call sizing/timeout
 * (e.g. SQS's 10-messages/20-seconds-per-call caps) is entirely the backend's concern.
 *
 * @typedef {Object} ReceiveOptions
 * @property {number} [minTime=10] seconds to keep long-polling even before anything has been
 *  received
 * @property {number} [maxTime=30] once at least one message has been received, keep polling
 *  for more, up to this many seconds total
 * @property {number} [maxMessages=1000] stop early once this many messages have been
 *  received across the whole call
 */

/**
 * @typedef {Object} ReceiveResult
 * @property {ReceivedMessage[]} messages
 */

/**
 * Aggregated, best-effort result of {@link Queue#delete}. Never throws for individual
 * message-ack failures — only for a total, whole-call failure — mirroring
 * `BatchedQueueClient.delete()`'s "log partial failures, don't throw" semantics.
 *
 * @typedef {Object} DeleteResult
 * @property {ReceivedMessage[]} deleted messages successfully acknowledged/removed
 * @property {Array<{message: ReceivedMessage, error: Error}>} failed messages that failed to
 *  delete, paired with the normalized error for each
 */

/**
 * @typedef {Object} QueueOptions
 * @property {import('./AbstractQueueBackend.js').QueueBackend} backend
 * @property {Console} [log]
 */

/**
 * Thin, backend-agnostic facade wrapping a single `QueueBackend` (see
 * {@link AbstractQueueBackend}). Unlike {@link Bucket} (which hosts significant generic
 * composition logic on top of its backend's mandatory primitives), `Queue` is a
 * near-total pass-through: batching/chunking against provider-specific limits (SQS's
 * ≤10 msgs/≤256KB, Azure Service Bus's dynamic sizing) is the backend's job, not a shared
 * generic chunker here.
 */
export class Queue {
  /**
   * @param {QueueOptions} opts
   */
  constructor({ backend, log = console }) {
    this._backend = backend;
    this._log = log;
  }

  /** @type {string} the queue name */
  get name() {
    return this._backend.queueName;
  }

  /** @type {Console} */
  get log() {
    return this._log;
  }

  /**
   * The backend's native client (e.g. an `SQSClient`); throws if the backend has none.
   *
   * @returns {*}
   */
  get client() {
    const c = this._backend.client;
    if (!c) {
      throw new Error('client is only available for some backends');
    }
    return c;
  }

  /**
   * Send a batch of messages. The backend owns all batching/chunking against its own
   * service limits.
   *
   * @param {OutboundMessage[]} messages
   * @returns {Promise<SendResult>}
   */
  async send(messages) {
    const result = await this._backend.sendBatch(messages);
    this._log.info(`sent ${messages.length} message(s) to queue: ${this.name}`);
    return result;
  }

  /**
   * Long-poll for messages. See {@link ReceiveOptions}.
   *
   * @param {ReceiveOptions} [opts]
   * @returns {Promise<ReceiveResult>}
   */
  async receive(opts = {}) {
    return this._backend.receiveBatch(opts);
  }

  /**
   * Best-effort acknowledge/delete of previously received messages.
   *
   * @param {ReceivedMessage[]} messages
   * @returns {Promise<DeleteResult>}
   */
  async delete(messages) {
    return this._backend.deleteBatch(messages);
  }

  /**
   * Cheap (no I/O) check for whether `message.body` is a backend-specific spillover pointer
   * rather than the real content. Backends that don't support spillover at all always
   * return `false` (see {@link AbstractQueueBackend#isSwapped}).
   *
   * @param {ReceivedMessage} message
   * @returns {Promise<boolean>}
   */
  async isSwapped(message) {
    return this._backend.isSwapped(message);
  }

  /**
   * If `isSwapped(message)` is true, fetches the real content from blob storage and returns
   * a new message with `body` replaced; otherwise returns `message` unchanged. Only fetches
   * when actually called — see the note on {@link ReceivedMessage} for why this is a
   * separate, opt-in step rather than something `receive()` does automatically.
   *
   * @param {ReceivedMessage} message
   * @returns {Promise<ReceivedMessage>}
   */
  async deserialize(message) {
    return this._backend.deserialize(message);
  }
}
