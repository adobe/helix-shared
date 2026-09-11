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

/* eslint-env mocha */
import assert from 'assert';
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon from 'sinon';
import { QueueError } from '@adobe/helix-shared-queue';
import { ServiceBusBackend } from '../src/ServiceBusBackend.js';

/**
 * AMQP (which `@azure/service-bus` uses) can't be intercepted with `nock` the way SQS's
 * plain-HTTPS JSON protocol can, so these tests exercise `ServiceBusBackend`'s own logic
 * (batching, spillover, dereferencing, ack) against hand-rolled fake sender/receiver objects
 * satisfying the real SDK's method shapes, rather than a real `ServiceBusClient`. Factory
 * functions (not classes) are used for these fakes, since only one class per file is allowed.
 */
function createFakeMessageBatch({ maxCount = Infinity, maxSizeInBytes = 1024 } = {}) {
  const messages = [];
  return {
    messages,
    get count() {
      return messages.length;
    },
    get sizeInBytes() {
      return messages.reduce((n, m) => n + Buffer.byteLength(String(m.body)), 0);
    },
    tryAddMessage(message) {
      if (messages.length >= maxCount) {
        return false;
      }
      if (this.sizeInBytes + Buffer.byteLength(String(message.body)) > maxSizeInBytes) {
        return false;
      }
      messages.push(message);
      return true;
    },
  };
}

function createFakeSender({ maxCount, maxSizeInBytes, failSend } = {}) {
  const sentBatches = [];
  return {
    sentBatches,
    async createMessageBatch() {
      return createFakeMessageBatch({ maxCount, maxSizeInBytes });
    },
    async sendMessages(batch) {
      if (failSend) {
        const e = new Error('boom');
        e.code = 'ServiceCommunicationProblem';
        throw e;
      }
      sentBatches.push(batch.messages.map((m) => ({ ...m })));
    },
  };
}

function createFakeReceiver({ messageBatches = [], failReceive, failComplete } = {}) {
  const completed = [];
  const receiveCalls = [];
  return {
    completed,
    receiveCalls,
    async receiveMessages(maxMessageCount, opts) {
      receiveCalls.push({ maxMessageCount, ...opts });
      if (failReceive) {
        const e = new Error('boom');
        e.code = 'ServiceCommunicationProblem';
        throw e;
      }
      const batch = messageBatches.shift() || [];
      return batch.slice(0, maxMessageCount);
    },
    async completeMessage(message) {
      if (failComplete) {
        throw new Error('boom');
      }
      completed.push(message);
    },
  };
}

/**
 * In-memory fake `Bucket`.
 */
class FakeBucket {
  constructor({ bucket = 'fake-spill-bucket' } = {}) {
    this.bucket = bucket;
    this.objects = new Map();
    this.removeCalls = [];
    this.getCalls = [];
  }

  async put(key, body) {
    this.objects.set(key, body);
    return { key };
  }

  async get(key) {
    this.getCalls.push(key);
    if (!this.objects.has(key)) {
      return null;
    }
    return Buffer.from(this.objects.get(key));
  }

  async remove(key) {
    this.removeCalls.push(key);
    this.objects.delete(key);
    return { key };
  }
}

function buildTestBackend({
  senderOpts, receiverOpts, ...opts
} = {}) {
  const sender = createFakeSender(senderOpts);
  const receiver = createFakeReceiver(receiverOpts);
  const backend = new ServiceBusBackend({
    sender, receiver, queueName: 'my-queue', log: console, ...opts,
  });
  return {
    backend, sender, receiver,
  };
}

describe('ServiceBusBackend', () => {
  it('exposes name/queueName/client', () => {
    const { backend, sender } = buildTestBackend();
    assert.strictEqual(backend.name, 'ServiceBus');
    assert.strictEqual(backend.queueName, 'my-queue');
    assert.strictEqual(backend.client, sender);
  });

  describe('sendBatch()', () => {
    it('sends a single small batch and maps groupId/dedupId onto sessionId/messageId', async () => {
      const { backend, sender } = buildTestBackend();
      const result = await backend.sendBatch([{ body: 'hello', groupId: 'g1', dedupId: 'd1' }]);
      assert.deepStrictEqual(result.messageIds, ['d1']);
      assert.strictEqual(sender.sentBatches.length, 1);
      assert.deepStrictEqual(sender.sentBatches[0], [{ body: 'hello', sessionId: 'g1', messageId: 'd1' }]);
    });

    it('generates a messageId when dedupId is not provided', async () => {
      const { backend } = buildTestBackend();
      const result = await backend.sendBatch([{ body: 'hello' }]);
      assert.strictEqual(result.messageIds.length, 1);
      assert.match(result.messageIds[0], /^[0-9a-f-]{36}$/);
    });

    it('splits messages into multiple chunks when they do not fit one batch', async () => {
      const { backend, sender } = buildTestBackend({ senderOpts: { maxCount: 2 } });
      const messages = Array.from({ length: 5 }, (_, i) => ({ body: `msg-${i}`, dedupId: `id-${i}` }));
      const result = await backend.sendBatch(messages);
      assert.deepStrictEqual(result.messageIds, ['id-0', 'id-1', 'id-2', 'id-3', 'id-4']);
      assert.deepStrictEqual(sender.sentBatches.map((b) => b.length), [2, 2, 1]);
    });

    it('spills a single message too large to fit any batch to the configured bucket', async () => {
      const bucket = new FakeBucket();
      // small enough to reject the 300-char message, large enough for the ~110-byte pointer
      const { backend, sender } = buildTestBackend({ senderOpts: { maxSizeInBytes: 200 }, bucket });
      const big = 'x'.repeat(300);
      const result = await backend.sendBatch([{ body: big, dedupId: 'id-1' }]);
      assert.deepStrictEqual(result.messageIds, ['id-1']);
      const [sentMsg] = sender.sentBatches[0];
      const pointer = JSON.parse(sentMsg.body);
      assert.strictEqual(pointer.swapBucket, 'fake-spill-bucket');
      assert.ok(bucket.objects.has(pointer.swapKey));
      assert.strictEqual(bucket.objects.get(pointer.swapKey), big);
    });

    it('throws when a message is too large and no spill bucket is configured', async () => {
      const { backend } = buildTestBackend({ senderOpts: { maxSizeInBytes: 20 } });
      await assert.rejects(backend.sendBatch([{ body: 'x'.repeat(300) }]), (e) => {
        assert.ok(e instanceof QueueError);
        assert.strictEqual(e.status, 413);
        return true;
      });
    });

    it('throws when even the spilled pointer does not fit the batch', async () => {
      const bucket = new FakeBucket();
      // an unreasonably tiny cap that not even the small pointer JSON fits into
      const { backend } = buildTestBackend({ senderOpts: { maxSizeInBytes: 1 }, bucket });
      await assert.rejects(backend.sendBatch([{ body: 'x'.repeat(300) }]), QueueError);
    });

    it('flushes a non-empty batch early when the next message would not fit', async () => {
      const { backend, sender } = buildTestBackend({ senderOpts: { maxSizeInBytes: 15 } });
      const messages = [{ body: 'x'.repeat(10) }, { body: 'y'.repeat(10) }];
      await backend.sendBatch(messages);
      assert.deepStrictEqual(sender.sentBatches.map((b) => b.length), [1, 1]);
    });

    it('throws a QueueError when the sendMessages() call itself fails (no per-entry skip)', async () => {
      const { backend } = buildTestBackend({ senderOpts: { failSend: true } });
      await assert.rejects(backend.sendBatch([{ body: 'hello' }]), (e) => {
        assert.ok(e instanceof QueueError);
        assert.strictEqual(e.code, 'ServiceCommunicationProblem');
        return true;
      });
    });
  });

  describe('receiveBatch()', () => {
    it('maps a received message, including groupId/receiveCount', async () => {
      const { backend } = buildTestBackend({
        receiverOpts: {
          messageBatches: [[{
            messageId: 'mid-1', sessionId: 'g1', deliveryCount: 2, body: 'hello',
          }]],
        },
      });
      const result = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      const [msg] = result.messages;
      assert.strictEqual(msg.id, 'mid-1');
      assert.strictEqual(msg.body, 'hello');
      assert.strictEqual(msg.groupId, 'g1');
      assert.strictEqual(msg.receiveCount, 2);
      assert.strictEqual(msg.raw.messageId, 'mid-1');
    });

    it('leaves id undefined when the raw message has no messageId', async () => {
      const { backend } = buildTestBackend({
        receiverOpts: { messageBatches: [[{ body: 'hello' }]] },
      });
      const result = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      assert.strictEqual(result.messages[0].id, undefined);
    });

    it('passes a plain JSON body through unchanged, not marked as swapped', async () => {
      const bucket = new FakeBucket();
      const { backend } = buildTestBackend({
        bucket,
        receiverOpts: { messageBatches: [[{ messageId: 'mid-1', body: '{"hello":"world"}' }]] },
      });
      const result = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      const [msg] = result.messages;
      assert.strictEqual(msg.body, '{"hello":"world"}');
      assert.strictEqual(msg.raw.swapKey, undefined);
      assert.deepStrictEqual(bucket.getCalls, []);
    });

    it('detects a swap pointer and stashes its key, without fetching its content', async () => {
      const bucket = new FakeBucket();
      await bucket.put('k.json', 'the real body');
      const { backend } = buildTestBackend({
        bucket,
        receiverOpts: {
          messageBatches: [[{
            messageId: 'mid-1',
            body: JSON.stringify({ swapBucket: 'fake-spill-bucket', swapKey: 'k.json' }),
          }]],
        },
      });
      const result = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      const [msg] = result.messages;
      // body is still the pointer -- receive() does not fetch
      assert.strictEqual(JSON.parse(msg.body).swapKey, 'k.json');
      assert.strictEqual(msg.raw.swapKey, 'k.json');
      assert.deepStrictEqual(bucket.getCalls, []);
    });

    it('throws when a pointer references a different bucket than configured', async () => {
      const bucket = new FakeBucket();
      const { backend } = buildTestBackend({
        bucket,
        receiverOpts: {
          messageBatches: [[{
            messageId: 'mid-1',
            body: JSON.stringify({ swapBucket: 'some-other-bucket', swapKey: 'k.json' }),
          }]],
        },
      });
      await assert.rejects(
        backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 }),
        (e) => {
          assert.ok(e instanceof QueueError);
          assert.strictEqual(e.status, 500);
          return true;
        },
      );
    });

    it('does not throw when no bucket is configured -- that is deferred to deserialize()', async () => {
      const { backend } = buildTestBackend({
        receiverOpts: {
          messageBatches: [[{
            messageId: 'mid-1',
            body: JSON.stringify({ swapBucket: 'fake-spill-bucket', swapKey: 'k.json' }),
          }]],
        },
      });
      const result = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      assert.strictEqual(result.messages[0].raw.swapKey, 'k.json');
    });

    it('stops once maxMessages is reached, without waiting out minTime', async () => {
      const { backend } = buildTestBackend({
        receiverOpts: {
          messageBatches: [Array.from({ length: 5 }, (_, i) => ({
            messageId: `mid-${i}`, body: `body-${i}`,
          }))],
        },
      });
      const result = await backend.receiveBatch({ minTime: 100, maxTime: 100, maxMessages: 5 });
      assert.strictEqual(result.messages.length, 5);
    });

    it('throws a QueueError when receiveMessages() fails', async () => {
      const { backend } = buildTestBackend({ receiverOpts: { failReceive: true } });
      await assert.rejects(
        backend.receiveBatch({ minTime: 1, maxTime: 1 }),
        (e) => {
          assert.ok(e instanceof QueueError);
          assert.strictEqual(e.code, 'ServiceCommunicationProblem');
          return true;
        },
      );
    });

    it('keeps polling until minTime elapses when nothing arrives', async () => {
      const clock = sinon.useFakeTimers({ toFake: ['Date'], now: 0 });
      try {
        const receiver = createFakeReceiver({});
        receiver.receiveMessages = async (maxMessageCount, opts) => {
          receiver.receiveCalls.push({ maxMessageCount, ...opts });
          clock.tick(opts.maxWaitTimeInMs);
          return [];
        };
        const backend = new ServiceBusBackend({
          sender: createFakeSender(), receiver, queueName: 'my-queue', log: console,
        });

        const result = await backend.receiveBatch({ minTime: 45, maxTime: 60, maxMessages: 1000 });
        assert.deepStrictEqual(result.messages, []);
        // a single wait covering the whole minTime window in one call
        assert.strictEqual(receiver.receiveCalls.length, 1);
        assert.strictEqual(receiver.receiveCalls[0].maxWaitTimeInMs, 45_000);
      } finally {
        clock.restore();
      }
    });

    it('keeps polling past minTime up to maxTime while messages keep arriving', async () => {
      const clock = sinon.useFakeTimers({ toFake: ['Date'], now: 0 });
      try {
        let calls = 0;
        const receiver = createFakeReceiver({});
        receiver.receiveMessages = async (maxMessageCount, opts) => {
          calls += 1;
          receiver.receiveCalls.push({ maxMessageCount, ...opts });
          clock.tick(opts.maxWaitTimeInMs);
          if (calls === 1) {
            return [{ messageId: 'mid-1', body: 'hi' }];
          }
          return [];
        };
        const backend = new ServiceBusBackend({
          sender: createFakeSender(), receiver, queueName: 'my-queue', log: console,
        });

        const result = await backend.receiveBatch({ minTime: 10, maxTime: 30, maxMessages: 1000 });
        assert.strictEqual(result.messages.length, 1);
        assert.strictEqual(calls, 2);
        assert.strictEqual(receiver.receiveCalls[0].maxWaitTimeInMs, 10_000);
        assert.strictEqual(receiver.receiveCalls[1].maxWaitTimeInMs, 20_000);
      } finally {
        clock.restore();
      }
    });
  });

  describe('isSwapped()', () => {
    it('returns true when the message was detected as a swap pointer at receive time', async () => {
      const { backend } = buildTestBackend();
      const message = { id: 'm1', body: 'pointer', raw: { swapKey: 'k.json' } };
      assert.strictEqual(await backend.isSwapped(message), true);
    });

    it('returns false otherwise', async () => {
      const { backend } = buildTestBackend();
      const message = { id: 'm1', body: 'hello', raw: {} };
      assert.strictEqual(await backend.isSwapped(message), false);
    });
  });

  describe('deserialize()', () => {
    it('returns the message unchanged when it was not swapped', async () => {
      const { backend } = buildTestBackend();
      const message = { id: 'm1', body: 'hello', raw: {} };
      assert.strictEqual(await backend.deserialize(message), message);
    });

    it('fetches and returns a new message with the real body when swapped', async () => {
      const bucket = new FakeBucket();
      await bucket.put('k.json', 'the real body');
      const { backend } = buildTestBackend({ bucket });
      const message = {
        id: 'm1', body: JSON.stringify({ swapBucket: 'fake-spill-bucket', swapKey: 'k.json' }), raw: { swapKey: 'k.json' },
      };
      const result = await backend.deserialize(message);
      assert.strictEqual(result.body, 'the real body');
      assert.notStrictEqual(result, message);
      assert.deepStrictEqual(bucket.getCalls, ['k.json']);
    });

    it('throws when the swapped message body cannot be found in the bucket', async () => {
      const bucket = new FakeBucket();
      const { backend } = buildTestBackend({ bucket });
      const message = { id: 'm1', body: '{}', raw: { swapKey: 'missing.json' } };
      await assert.rejects(backend.deserialize(message), (e) => {
        assert.ok(e instanceof QueueError);
        assert.strictEqual(e.status, 404);
        return true;
      });
    });

    it('throws when the message was swapped out but no spill bucket is configured', async () => {
      const { backend } = buildTestBackend();
      const message = { id: 'm1', body: '{}', raw: { swapKey: 'k.json' } };
      await assert.rejects(backend.deserialize(message), (e) => {
        assert.ok(e instanceof QueueError);
        assert.strictEqual(e.status, 500);
        return true;
      });
    });
  });

  describe('deleteBatch()', () => {
    it('completes each message individually and runs cleanup after a successful ack', async () => {
      const bucket = new FakeBucket();
      await bucket.put('k.json', 'the real body');
      const { backend, receiver } = buildTestBackend({
        bucket,
        receiverOpts: {
          messageBatches: [[{
            messageId: 'mid-1',
            body: JSON.stringify({ swapBucket: 'fake-spill-bucket', swapKey: 'k.json' }),
          }]],
        },
      });
      const { messages } = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      const result = await backend.deleteBatch(messages);
      assert.strictEqual(result.deleted[0], messages[0]);
      assert.deepStrictEqual(result.failed, []);
      assert.strictEqual(receiver.completed[0], messages[0].raw);
      assert.deepStrictEqual(bucket.removeCalls, ['k.json']);
    });

    it('isolates a per-message completeMessage() failure into `failed`, without affecting others', async () => {
      const { backend, receiver } = buildTestBackend({
        receiverOpts: {
          messageBatches: [[
            { messageId: 'mid-1', body: 'a' },
            { messageId: 'mid-2', body: 'b' },
          ]],
        },
      });
      const { messages } = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 2 });
      let calls = 0;
      receiver.completeMessage = async (msg) => {
        calls += 1;
        if (msg.messageId === 'mid-2') {
          throw new Error('lock lost');
        }
      };
      const result = await backend.deleteBatch(messages);
      assert.strictEqual(calls, 2);
      assert.strictEqual(result.deleted.length, 1);
      assert.strictEqual(result.deleted[0].id, 'mid-1');
      assert.strictEqual(result.failed.length, 1);
      assert.strictEqual(result.failed[0].message.id, 'mid-2');
      assert.ok(result.failed[0].error instanceof QueueError);
    });

    it('does not attempt cleanup for a message that was never swapped', async () => {
      const bucket = new FakeBucket();
      const { backend } = buildTestBackend({
        bucket,
        receiverOpts: { messageBatches: [[{ messageId: 'mid-1', body: 'hi' }]] },
      });
      const { messages } = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      await backend.deleteBatch(messages);
      assert.deepStrictEqual(bucket.removeCalls, []);
    });

    it('does not propagate a failure to clean up a swapped message body', async () => {
      const bucket = new FakeBucket();
      bucket.remove = async () => {
        throw new Error('boom');
      };
      const { backend } = buildTestBackend({
        bucket,
        receiverOpts: {
          messageBatches: [[{
            messageId: 'mid-1',
            body: JSON.stringify({ swapBucket: 'fake-spill-bucket', swapKey: 'k.json' }),
          }]],
        },
      });
      const { messages } = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      const result = await backend.deleteBatch(messages);
      assert.strictEqual(result.deleted[0], messages[0]);
    });
  });
});
