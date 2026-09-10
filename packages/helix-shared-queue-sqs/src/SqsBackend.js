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

import {
  DeleteMessageBatchCommand,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  SendMessageBatchCommand,
} from '@aws-sdk/client-sqs';
import { AbstractQueueBackend } from '@adobe/helix-shared-queue';

/**
 * Maximum number of entries in a single `SendMessageBatchCommand`/`DeleteMessageBatchCommand`
 * call (SQS API limit).
 */
const MAX_BATCH_ENTRIES = 10;

/**
 * Maximum total serialized size of a single `SendMessageBatchCommand` call (SQS API limit,
 * with a small per-entry fudge factor for request overhead, matching `BatchedQueueClient`).
 */
const MAX_BATCH_BYTES = 256 * 1024;

const DEFAULT_SWAP_PREFIX = 'default/sqs-swap';

/**
 * Approximates the serialized size of a `SendMessageBatchRequestEntry`, including the same
 * small per-entry overhead fudge factor `BatchedQueueClient` used.
 *
 * @param {Object} entry
 * @returns {number}
 */
function entrySize(entry) {
  return Buffer.byteLength(JSON.stringify(entry), 'utf8') + 20;
}

/**
 * @typedef {Object} SqsBackendOptions
 * @property {import('@aws-sdk/client-sqs').SQSClient} client
 * @property {string} queueName logical queue name, resolved to a queue URL lazily via
 *  `GetQueueUrlCommand` and cached — callers never see the actual SQS URL.
 * @property {Console} [log]
 * @property {import('@adobe/helix-shared-storage').Bucket} [bucket] optional storage bucket
 *  used to spill a single message too large to fit in any batch on its own. When omitted,
 *  attempting to send such a message throws.
 * @property {string} [swapPrefix] key prefix used for spilled messages. Defaults to
 *  `'default/sqs-swap'`.
 */

/**
 * SQS {@link import('@adobe/helix-shared-queue').QueueBackend} implementation — a
 * behavior-preserving port of `BatchedQueueClient` (`@adobe/helix-admin-support`) onto the
 * pluggable `@adobe/helix-shared-queue` interface.
 *
 * @implements {import('@adobe/helix-shared-queue').QueueBackend}
 */
export class SqsBackend extends AbstractQueueBackend {
  /**
   * @param {SqsBackendOptions} opts
   */
  constructor({
    client, queueName, log = console, bucket, swapPrefix = DEFAULT_SWAP_PREFIX,
  }) {
    super();
    this._client = client;
    this._queueName = queueName;
    this._log = log;
    this._bucket = bucket;
    this._swapPrefix = swapPrefix;
  }

  // eslint-disable-next-line class-methods-use-this -- fixed tag, like S3Backend's `name`
  get name() {
    return 'SQS';
  }

  /** @type {string} */
  get queueName() {
    return this._queueName;
  }

  /** @type {import('@aws-sdk/client-sqs').SQSClient} */
  get client() {
    return this._client;
  }

  /**
   * Resolves (and caches) this queue's URL from its logical name via `GetQueueUrlCommand`.
   *
   * @returns {Promise<string>}
   */
  async _resolveQueueUrl() {
    if (!this._queueUrlPromise) {
      this._queueUrlPromise = this._client
        .send(new GetQueueUrlCommand({ QueueName: this._queueName }))
        .then(({ QueueUrl }) => QueueUrl)
        .catch((e) => {
          this._queueUrlPromise = undefined;
          throw this._wrapError(e, e.message, {
            status: e.$metadata?.httpStatusCode,
            code: e.Code,
          });
        });
    }
    return this._queueUrlPromise;
  }

  /**
   * Spills a single message too large to fit in any batch on its own into the configured
   * `bucket`, replacing its body with a small pointer. Mirrors `BatchedQueueClient.serialize()`,
   * generalized to an injected, backend-agnostic `Bucket` instead of a hardcoded `S3Client`.
   *
   * @param {Object} entry a `SendMessageBatchRequestEntry`-shaped object, without `Id`
   * @returns {Promise<Object>}
   */
  async _spill(entry) {
    if (!this._bucket) {
      throw this._wrapError(
        new Error('message too large for SQS and no spill bucket configured'),
        'message too large for SQS and no spill bucket configured',
        { status: 413 },
      );
    }
    const swapKey = `${this._swapPrefix}/${this._queueName}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
    await this._bucket.put(swapKey, entry.MessageBody, 'application/json', {}, false);
    this._log.debug(`message too big for SQS, spilled to ${this._bucket.bucket}/${swapKey}`);
    return {
      ...entry,
      MessageBody: JSON.stringify({ swapBucket: this._bucket.bucket, swapKey }),
    };
  }

  /**
   * @param {import('@adobe/helix-shared-queue').OutboundMessage[]} messages
   * @returns {Promise<import('@adobe/helix-shared-queue').SendResult>}
   */
  async sendBatch(messages) {
    const queueUrl = await this._resolveQueueUrl();
    const pending = messages.map(({ body, groupId, dedupId }) => ({
      MessageBody: body,
      MessageGroupId: groupId,
      MessageDeduplicationId: dedupId,
    }));

    const messageIds = [];
    let batch = [];
    let batchSize = 0;

    while (pending.length) {
      let entry = pending.shift();
      let size = entrySize(entry);
      let flush = false;

      if (batchSize + size <= MAX_BATCH_BYTES) {
        batch.push(entry);
        batchSize += size;
      } else if (batch.length === 0) {
        this._log.debug(`message too big: ${size} bytes. spilling...`);
        // eslint-disable-next-line no-await-in-loop
        entry = await this._spill(entry);
        size = entrySize(entry);
        batch.push(entry);
        batchSize += size;
      } else {
        pending.unshift(entry);
        flush = true;
      }

      if (flush || batch.length === MAX_BATCH_ENTRIES || pending.length === 0) {
        // eslint-disable-next-line no-await-in-loop
        messageIds.push(...(await this._sendChunk(queueUrl, batch)));
        batch = [];
        batchSize = 0;
      }
    }
    return { messageIds };
  }

  /**
   * Sends a single, already-within-limits batch of entries. Logs (but does not throw for)
   * per-entry failures reported in the response's `Failed` array — a network/permission-level
   * failure of the `SendMessageBatchCommand` call itself is thrown, per
   * {@link AbstractQueueBackend}.
   *
   * @param {string} queueUrl
   * @param {Object[]} batch entries without `Id` (assigned here, local to this chunk)
   * @returns {Promise<string[]>} `MessageId`s of the successfully sent entries
   */
  async _sendChunk(queueUrl, batch) {
    const entries = batch.map((entry, idx) => ({ Id: `msg${idx}`, ...entry }));
    try {
      const result = await this._client.send(new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: entries,
      }));
      const { Successful = [], Failed = [] } = result;
      if (Failed.length) {
        const details = Failed.map(({ Id, Code, Message }) => `- ${Id}: ${Message} (${Code})`);
        this._log.warn(`failed to send ${Failed.length} message(s) to ${this._queueName}:\n${details.join('\n')}`);
      }
      return Successful.map(({ MessageId }) => MessageId);
    } catch (e) {
      throw this._wrapError(e, e.message, { status: e.$metadata?.httpStatusCode, code: e.Code });
    }
  }

  /**
   * Long-polls for messages, generalizing `BatchedQueueClient.receive()`'s loop: keeps polling
   * for at least `minTime` seconds; if anything arrived in that window, keeps polling for more
   * up to `maxTime` seconds total; stops early once `maxMessages` is reached or no time budget
   * remains. Each individual `ReceiveMessageCommand` call is capped at SQS's own per-call limits
   * (10 messages, 20s wait).
   *
   * @param {import('@adobe/helix-shared-queue').ReceiveOptions} [opts]
   * @returns {Promise<import('@adobe/helix-shared-queue').ReceiveResult>}
   */
  async receiveBatch({ minTime = 10, maxTime = 30, maxMessages = 1000 } = {}) {
    const queueUrl = await this._resolveQueueUrl();
    const messages = [];
    const endMinTime = Date.now() + minTime * 1000;
    const endMaxTime = Date.now() + maxTime * 1000;

    let maybeMore = false;
    while (messages.length < maxMessages) {
      let timeRemaining = Math.round((endMinTime - Date.now()) / 1000);
      if (timeRemaining <= 0 && maybeMore) {
        timeRemaining = Math.round((endMaxTime - Date.now()) / 1000);
      }
      if (timeRemaining <= 0) {
        break;
      }
      const waitTime = Math.min(20, timeRemaining);
      const maxMsgs = Math.min(MAX_BATCH_ENTRIES, maxMessages - messages.length);

      let result;
      try {
        // eslint-disable-next-line no-await-in-loop
        result = await this._client.send(new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: maxMsgs,
          WaitTimeSeconds: waitTime,
          MessageAttributeNames: ['All'],
          AttributeNames: ['All'],
        }));
      } catch (e) {
        throw this._wrapError(e, e.message, { status: e.$metadata?.httpStatusCode, code: e.Code });
      }
      const { Messages = [] } = result;
      Messages.forEach((raw) => {
        messages.push({
          id: raw.MessageId,
          body: raw.Body,
          groupId: raw.Attributes?.MessageGroupId,
          receiveCount: raw.Attributes?.ApproximateReceiveCount === undefined
            ? undefined
            : Number(raw.Attributes.ApproximateReceiveCount),
          raw,
        });
      });
      maybeMore = Messages.length > 0;
    }
    return { messages };
  }

  /**
   * Best-effort acknowledge/delete of previously received messages, in chunks of at most 10
   * (SQS's `DeleteMessageBatchCommand` limit). Per-message failures reported in a chunk's
   * `Failed` array are collected into the result rather than thrown; a network/permission-level
   * failure of the `DeleteMessageBatchCommand` call itself is thrown.
   *
   * @param {import('@adobe/helix-shared-queue').ReceivedMessage[]} messages
   * @returns {Promise<import('@adobe/helix-shared-queue').DeleteResult>}
   */
  async deleteBatch(messages) {
    const queueUrl = await this._resolveQueueUrl();
    const byId = new Map(messages.map((m) => [m.id, m]));
    const deleted = [];
    const failed = [];

    for (let i = 0; i < messages.length; i += MAX_BATCH_ENTRIES) {
      const chunk = messages.slice(i, i + MAX_BATCH_ENTRIES);
      const entries = chunk.map((m) => ({ Id: m.id, ReceiptHandle: m.raw.ReceiptHandle }));
      let result;
      try {
        // eslint-disable-next-line no-await-in-loop
        result = await this._client.send(new DeleteMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: entries,
        }));
      } catch (e) {
        throw this._wrapError(e, e.message, { status: e.$metadata?.httpStatusCode, code: e.Code });
      }
      const { Successful = [], Failed = [] } = result;
      Successful.forEach(({ Id }) => deleted.push(byId.get(Id)));
      Failed.forEach(({ Id, Code, Message }) => {
        failed.push({
          message: byId.get(Id),
          error: this._wrapError(new Error(Message), Message, { code: Code }),
        });
      });
    }
    return { deleted, failed };
  }
}
