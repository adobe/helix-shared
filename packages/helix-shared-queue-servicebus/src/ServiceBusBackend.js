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

/* eslint-disable no-param-reassign */
import { randomUUID } from 'node:crypto';
import { AbstractQueueBackend } from '@adobe/helix-shared-queue';
import { extractSwapKey } from './dereferenceMessageBody.js';

const DEFAULT_SWAP_PREFIX = 'default/servicebus-swap';

/**
 * @typedef {Object} ServiceBusBackendOptions
 * @property {import('@azure/service-bus').ServiceBusSender} sender
 * @property {import('@azure/service-bus').ServiceBusReceiver} receiver
 * @property {string} queueName
 * @property {Console} [log]
 * @property {import('@adobe/helix-shared-storage').Bucket} [bucket] optional storage bucket
 *  used to spill a single message too large to fit in any batch on its own. When omitted,
 *  attempting to send such a message throws.
 * @property {string} [swapPrefix] key prefix used for spilled messages. Defaults to
 *  `'default/servicebus-swap'`.
 */

/**
 * Azure Service Bus {@link import('@adobe/helix-shared-queue').QueueBackend} implementation.
 *
 * Notable differences from the SQS backend, driven by real API differences rather than
 * choices made here:
 * - `sendMessages()` has no partial-success reporting — a batch either sends completely or
 *   throws, so (unlike SQS) `sendBatch()` cannot log-and-skip individual bad messages within
 *   an otherwise-successful batch.
 * - There is no bulk-ack API — messages are acknowledged (`completeMessage()`) one at a time.
 * - `ServiceBusMessageBatch#tryAddMessage()` does exact, connection-negotiated size checking,
 *   so (unlike SQS) this backend doesn't need its own approximate byte-size accounting.
 * - `groupId` maps to Service Bus's `sessionId`, but only session-enabled queues accept it;
 *   this backend's `receiveBatch()` uses the plain (non-session) receiver, so it does not
 *   support session-ordered consumption — only the SQS-FIFO-equivalent send-side mapping.
 *
 * @implements {import('@adobe/helix-shared-queue').QueueBackend}
 */
export class ServiceBusBackend extends AbstractQueueBackend {
  /**
   * @param {ServiceBusBackendOptions} opts
   */
  constructor({
    sender, receiver, queueName, log = console, bucket, swapPrefix = DEFAULT_SWAP_PREFIX,
  }) {
    super();
    this._sender = sender;
    this._receiver = receiver;
    this._queueName = queueName;
    this._log = log;
    this._bucket = bucket;
    this._swapPrefix = swapPrefix;
  }

  // eslint-disable-next-line class-methods-use-this -- fixed tag, like SqsBackend's `name`
  get name() {
    return 'ServiceBus';
  }

  /** @type {string} */
  get queueName() {
    return this._queueName;
  }

  /** @type {import('@azure/service-bus').ServiceBusSender} */
  get client() {
    return this._sender;
  }

  /**
   * @param {import('@adobe/helix-shared-queue').OutboundMessage} message
   * @returns {import('@azure/service-bus').ServiceBusMessage}
   */
  // eslint-disable-next-line class-methods-use-this
  _toServiceBusMessage({ body, groupId, dedupId }) {
    return { body, sessionId: groupId, messageId: dedupId ?? randomUUID() };
  }

  /**
   * Spills a single message too large to fit in any batch on its own into the configured
   * `bucket`, replacing its body with a small pointer.
   *
   * @param {import('@azure/service-bus').ServiceBusMessage} message
   * @returns {Promise<import('@azure/service-bus').ServiceBusMessage>}
   */
  async _spill(message) {
    if (!this._bucket) {
      throw this._wrapError(
        new Error('message too large for Service Bus and no spill bucket configured'),
        'message too large for Service Bus and no spill bucket configured',
        { status: 413 },
      );
    }
    const swapKey = `${this._swapPrefix}/${this._queueName}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
    await this._bucket.put(swapKey, message.body, 'application/json', {}, false);
    this._log.debug(`message too big for Service Bus, spilled to ${this._bucket.bucket}/${swapKey}`);
    return {
      ...message,
      body: JSON.stringify({ swapBucket: this._bucket.bucket, swapKey }),
    };
  }

  /**
   * @param {import('@adobe/helix-shared-queue').OutboundMessage[]} messages
   * @returns {Promise<import('@adobe/helix-shared-queue').SendResult>}
   */
  async sendBatch(messages) {
    const pending = messages.map((m) => this._toServiceBusMessage(m));
    const messageIds = pending.map((m) => String(m.messageId));

    const chunks = [];
    let batch = await this._sender.createMessageBatch();
    while (pending.length) {
      const message = pending[0];
      if (batch.tryAddMessage(message)) {
        pending.shift();
      } else if (batch.count === 0) {
        this._log.debug('message too big for the current batch. spilling...');
        // eslint-disable-next-line no-await-in-loop
        const spilled = await this._spill(message);
        if (!batch.tryAddMessage(spilled)) {
          throw this._wrapError(
            new Error('spilled message pointer still too large to send'),
            'spilled message pointer still too large to send',
            {},
          );
        }
        pending.shift();
      } else {
        chunks.push(batch);
        // eslint-disable-next-line no-await-in-loop
        batch = await this._sender.createMessageBatch();
      }
    }
    if (batch.count > 0) {
      chunks.push(batch);
    }

    for (const chunk of chunks) {
      // eslint-disable-next-line no-await-in-loop
      await this._sendChunk(chunk);
    }
    return { messageIds };
  }

  /**
   * Sends a single, already-within-limits batch. Unlike SQS, Service Bus's `sendMessages()`
   * reports no per-entry success/failure — a failure here means the whole chunk failed, and
   * is thrown (there's nothing to log-and-skip).
   *
   * @param {import('@azure/service-bus').ServiceBusMessageBatch} batch
   * @returns {Promise<void>}
   */
  async _sendChunk(batch) {
    try {
      await this._sender.sendMessages(batch);
    } catch (e) {
      throw this._wrapError(e, e.message, { code: e.code });
    }
  }

  /**
   * Long-polls for messages, mirroring the same `minTime`/`maxTime`/`maxMessages` contract as
   * the SQS backend's `receiveBatch()`, adapted to `receiveMessages()`'s single-call shape
   * (which, unlike SQS, has no fixed per-call message-count cap). A message spilled by
   * {@link ServiceBusBackend#_spill} is returned as-is (still a pointer) — see
   * {@link ServiceBusBackend#isSwapped}/{@link ServiceBusBackend#deserialize}.
   *
   * @param {import('@adobe/helix-shared-queue').ReceiveOptions} [opts]
   * @returns {Promise<import('@adobe/helix-shared-queue').ReceiveResult>}
   */
  async receiveBatch({ minTime = 10, maxTime = 30, maxMessages = 1000 } = {}) {
    const rawMessages = [];
    const endMinTime = Date.now() + minTime * 1000;
    const endMaxTime = Date.now() + maxTime * 1000;

    let maybeMore = false;
    while (rawMessages.length < maxMessages) {
      let timeRemaining = Math.round((endMinTime - Date.now()) / 1000);
      if (timeRemaining <= 0 && maybeMore) {
        timeRemaining = Math.round((endMaxTime - Date.now()) / 1000);
      }
      if (timeRemaining <= 0) {
        break;
      }
      const maxMsgs = maxMessages - rawMessages.length;

      let batch;
      try {
        // eslint-disable-next-line no-await-in-loop
        batch = await this._receiver.receiveMessages(maxMsgs, {
          maxWaitTimeInMs: timeRemaining * 1000,
        });
      } catch (e) {
        throw this._wrapError(e, e.message, { code: e.code });
      }
      rawMessages.push(...batch);
      maybeMore = batch.length > 0;
    }

    const messages = rawMessages.map((raw) => this._toReceivedMessage(raw));
    return { messages };
  }

  /**
   * Builds a {@link import('@adobe/helix-shared-queue').ReceivedMessage} from a raw Service
   * Bus message. Cheaply (no I/O) detects whether the body is a swap pointer produced by
   * {@link ServiceBusBackend#_spill} and, if so, stashes its storage key on `raw` (mutated in
   * place — `completeMessage()` requires the exact same object instance the SDK returned to
   * settle it, so a shallow copy would break acknowledgement) for
   * {@link ServiceBusBackend#isSwapped}/{@link ServiceBusBackend#deserialize}/
   * {@link ServiceBusBackend#deleteBatch} to use later — the actual blob fetch is deferred to
   * `deserialize()`.
   *
   * @param {import('@azure/service-bus').ServiceBusReceivedMessage} raw
   * @returns {import('@adobe/helix-shared-queue').ReceivedMessage}
   */
  _toReceivedMessage(raw) {
    raw.swapKey = this._detectSwapKey(raw.body);
    return {
      id: raw.messageId === undefined ? undefined : String(raw.messageId),
      body: raw.body,
      groupId: raw.sessionId,
      receiveCount: raw.deliveryCount,
      raw,
    };
  }

  /**
   * @param {string} body raw message body
   * @returns {string|undefined} the swap key, if `body` is a pointer referencing this
   *  backend's configured `bucket`
   * @throws {import('@adobe/helix-shared-queue').QueueError} if `body` is a pointer but
   *  references a different bucket than configured
   */
  _detectSwapKey(body) {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      return undefined;
    }
    return extractSwapKey(parsed, this._bucket?.bucket);
  }

  /**
   * Cheap (no I/O) check for whether `message.body` is a swap pointer — see
   * {@link ServiceBusBackend#_toReceivedMessage}.
   *
   * @param {import('@adobe/helix-shared-queue').ReceivedMessage} message
   * @returns {Promise<boolean>}
   */
  // eslint-disable-next-line class-methods-use-this -- swapKey lives on the message, not this
  async isSwapped(message) {
    return !!message.raw?.swapKey;
  }

  /**
   * If `message` was swapped, fetches the real content from `bucket` and returns a new
   * message with `body` replaced; otherwise returns `message` unchanged.
   *
   * @param {import('@adobe/helix-shared-queue').ReceivedMessage} message
   * @returns {Promise<import('@adobe/helix-shared-queue').ReceivedMessage>}
   */
  async deserialize(message) {
    const swapKey = message.raw?.swapKey;
    if (!swapKey) {
      return message;
    }
    if (!this._bucket) {
      throw this._wrapError(
        new Error('message was swapped out but no spill bucket is configured'),
        'message was swapped out but no spill bucket is configured',
        { status: 500 },
      );
    }
    const content = await this._bucket.get(swapKey);
    if (content === null) {
      throw this._wrapError(
        new Error(`swapped message body not found: ${this._bucket.bucket}/${swapKey}`),
        `swapped message body not found: ${this._bucket.bucket}/${swapKey}`,
        { status: 404 },
      );
    }
    return { ...message, body: content.toString('utf-8') };
  }

  /**
   * Best-effort acknowledge/delete of previously received messages. Unlike SQS, there is no
   * bulk-ack API — each message is completed individually, so per-message failures are
   * naturally isolated (collected into `DeleteResult.failed`) without needing chunking. Also
   * cleans up any swapped-out message body once its message is acknowledged, regardless of
   * whether {@link ServiceBusBackend#deserialize} was ever called for it.
   *
   * @param {import('@adobe/helix-shared-queue').ReceivedMessage[]} messages
   * @returns {Promise<import('@adobe/helix-shared-queue').DeleteResult>}
   */
  async deleteBatch(messages) {
    const deleted = [];
    const failed = [];
    await Promise.all(messages.map(async (message) => {
      try {
        await this._receiver.completeMessage(message.raw);
        deleted.push(message);
      } catch (e) {
        failed.push({ message, error: this._wrapError(e, e.message, { code: e.code }) });
      }
    }));
    await Promise.all(deleted.map((m) => this._cleanupSwap(m)));
    return { deleted, failed };
  }

  /**
   * Best-effort cleanup of a swapped-out message body once the message itself has been
   * acknowledged — deferred to this ack point (rather than done eagerly, or only when
   * {@link ServiceBusBackend#deserialize} happens to have been called) so a message that's
   * never successfully processed/deleted (and gets redelivered instead) can still find its
   * swapped body. Never throws — a failure to delete is logged and otherwise ignored.
   *
   * @param {import('@adobe/helix-shared-queue').ReceivedMessage} message
   * @returns {Promise<void>}
   */
  async _cleanupSwap(message) {
    const swapKey = message?.raw?.swapKey;
    if (!swapKey || !this._bucket) {
      return;
    }
    try {
      await this._bucket.remove(swapKey);
      this._log.debug(`deleted swapped message body: ${this._bucket.bucket}/${swapKey}`);
    } catch (e) {
      this._log.warn(`unable to delete swapped message body at ${this._bucket.bucket}/${swapKey}: ${e.message}`);
    }
  }
}
