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
import {
  DeleteMessageBatchCommand,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  SendMessageBatchCommand,
} from '@aws-sdk/client-sqs';
import { AbstractQueueBackend } from '@adobe/helix-shared-queue';
import { extractSwapKey } from './dereferenceMessageBody.js';

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
 * pluggable `@adobe/helix-shared-queue` interface. Spilled messages always use the exact wire
 * format `BatchedQueueClient.serialize()` used — `{owner, repo, key, swapS3Url: 's3://bucket/key'}`
 * — so unmigrated consumers reading the same queue (e.g. `helix-indexer`'s `extractBody()`)
 * keep working unchanged; there is no generic/alternate pointer shape for this backend, since
 * realistically anything adopting it in the Helix context has (or will have) exactly this kind
 * of consumer to stay compatible with. This requires the spilled message body to already
 * contain `owner`/`repo` (or an explicit `key`) fields, and requires `bucket` to be backed by
 * real AWS S3 (e.g. `@adobe/helix-shared-storage-s3`) — the emitted `swapS3Url` is a literal
 * `s3://` URI that non-abstracted legacy consumers parse and fetch directly, bypassing this
 * package's storage abstraction entirely.
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
   * `bucket`, replacing its body with a pointer matching `BatchedQueueClient.serialize()`'s
   * exact wire format.
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
    let parsed;
    try {
      parsed = JSON.parse(entry.MessageBody);
    } catch (e) {
      throw this._wrapError(e, 'spilling requires a JSON message body', { status: 400 });
    }
    const { owner, repo, key = `${owner}/${repo}` } = parsed;
    if (!owner || !repo) {
      throw this._wrapError(
        new Error('spilling requires an "owner"/"repo" (or explicit "key") field on the message body'),
        'spilling requires an "owner"/"repo" (or explicit "key") field on the message body',
        { status: 400 },
      );
    }
    const swapKey = `${this._swapPrefix}/${key}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
    await this._bucket.put(swapKey, entry.MessageBody, 'application/json', {}, false);
    const swapS3Url = `s3://${this._bucket.bucket}/${swapKey}`;
    this._log.debug(`message too big for SQS, spilled to ${swapS3Url}`);
    return {
      ...entry,
      MessageBody: JSON.stringify({
        owner, repo, key, swapS3Url,
      }),
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
   * (10 messages, 20s wait). A message spilled by {@link SqsBackend#_spill} is returned as-is
   * (still a pointer) — see {@link SqsBackend#isSwapped}/{@link SqsBackend#deserialize}.
   *
   * @param {import('@adobe/helix-shared-queue').ReceiveOptions} [opts]
   * @returns {Promise<import('@adobe/helix-shared-queue').ReceiveResult>}
   */
  async receiveBatch({ minTime = 10, maxTime = 30, maxMessages = 1000 } = {}) {
    const queueUrl = await this._resolveQueueUrl();
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
      const waitTime = Math.min(20, timeRemaining);
      const maxMsgs = Math.min(MAX_BATCH_ENTRIES, maxMessages - rawMessages.length);

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
      rawMessages.push(...Messages);
      maybeMore = Messages.length > 0;
    }

    const messages = rawMessages.map((raw) => this._toReceivedMessage(raw));
    return { messages };
  }

  /**
   * Builds a {@link import('@adobe/helix-shared-queue').ReceivedMessage} from a raw SQS
   * message. Cheaply (no I/O) detects whether the body is a swap pointer produced by
   * {@link SqsBackend#_spill} and, if so, stashes its storage key on `raw` for
   * {@link SqsBackend#isSwapped}/{@link SqsBackend#deserialize}/{@link SqsBackend#deleteBatch}
   * to use later — the actual blob fetch is deferred to `deserialize()`.
   *
   * @param {Object} raw raw `ReceiveMessageCommand` message
   * @returns {import('@adobe/helix-shared-queue').ReceivedMessage}
   */
  _toReceivedMessage(raw) {
    raw.swapKey = this._detectSwapKey(raw.Body);
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
   * {@link SqsBackend#_toReceivedMessage}.
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
   * Best-effort acknowledge/delete of previously received messages, in chunks of at most 10
   * (SQS's `DeleteMessageBatchCommand` limit). Per-message failures reported in a chunk's
   * `Failed` array are collected into the result rather than thrown; a network/permission-level
   * failure of the `DeleteMessageBatchCommand` call itself is thrown. Also cleans up any
   * swapped-out message body once its message is acknowledged — regardless of whether
   * {@link SqsBackend#deserialize} was ever called for it.
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
    await Promise.all(deleted.map((m) => this._cleanupSwap(m)));
    return { deleted, failed };
  }

  /**
   * Best-effort cleanup of a swapped-out message body once the message itself has been
   * acknowledged — deferred to this ack point (rather than done eagerly, or only when
   * {@link SqsBackend#deserialize} happens to have been called) so a message that's never
   * successfully processed/deleted (and gets redelivered instead) can still find its swapped
   * body. Never throws — a failure to delete is logged and otherwise ignored.
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
