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
import { AbstractQueueBackend } from '../src/AbstractQueueBackend.js';
import { Queue } from '../src/Queue.js';

/**
 * In-memory fake backend, sufficient to exercise Queue's pass-through behavior without any
 * real SDK involved.
 */
class FakeBackend extends AbstractQueueBackend {
  constructor({ queueName = 'fake-queue', name = 'Fake', client } = {}) {
    super();
    this.queueName = queueName;
    this.name = name;
    this.client = client;
    this.sendCalls = [];
    this.receiveCalls = [];
    this.deleteCalls = [];
  }

  async sendBatch(messages) {
    this.sendCalls.push(messages);
    return { messageIds: messages.map((_, i) => `id-${i}`) };
  }

  async receiveBatch(opts) {
    this.receiveCalls.push(opts);
    return { messages: [{ id: 'm1', body: 'hello', raw: { ReceiptHandle: 'rh1' } }] };
  }

  async deleteBatch(messages) {
    this.deleteCalls.push(messages);
    return { deleted: messages, failed: [] };
  }
}

describe('Queue', () => {
  let backend;
  let queue;

  beforeEach(() => {
    backend = new FakeBackend();
    queue = new Queue({ backend, log: console });
  });

  it('exposes the queue name and log from the backend', () => {
    assert.strictEqual(queue.name, 'fake-queue');
    assert.strictEqual(queue.log, console);
  });

  describe('client', () => {
    it('throws when the backend has no client', () => {
      assert.throws(() => queue.client, /client is only available for some backends/);
    });

    it('returns the backend client when present', () => {
      backend.client = 'fake-client';
      assert.strictEqual(queue.client, 'fake-client');
    });
  });

  describe('send()', () => {
    it('forwards to backend.sendBatch() and returns its result verbatim', async () => {
      const messages = [{ body: 'a' }, { body: 'b', groupId: 'g1', dedupId: 'd1' }];
      const result = await queue.send(messages);
      assert.deepStrictEqual(backend.sendCalls, [messages]);
      assert.deepStrictEqual(result, { messageIds: ['id-0', 'id-1'] });
    });
  });

  describe('receive()', () => {
    it('forwards to backend.receiveBatch() with the given opts', async () => {
      const result = await queue.receive({ minTime: 1, maxTime: 2, maxMessages: 3 });
      assert.deepStrictEqual(backend.receiveCalls, [{ minTime: 1, maxTime: 2, maxMessages: 3 }]);
      assert.deepStrictEqual(result, {
        messages: [{ id: 'm1', body: 'hello', raw: { ReceiptHandle: 'rh1' } }],
      });
    });

    it('defaults opts to an empty object', async () => {
      await queue.receive();
      assert.deepStrictEqual(backend.receiveCalls, [{}]);
    });
  });

  describe('delete()', () => {
    it('forwards to backend.deleteBatch() and returns mixed deleted/failed verbatim', async () => {
      const messages = [{ id: 'm1', raw: { ReceiptHandle: 'rh1' } }];
      backend.deleteBatch = async (msgs) => ({
        deleted: [msgs[0]],
        failed: [{ message: msgs[0], error: new Error('boom') }],
      });
      const result = await queue.delete(messages);
      assert.strictEqual(result.deleted[0], messages[0]);
      assert.strictEqual(result.failed[0].message, messages[0]);
      assert.strictEqual(result.failed[0].error.message, 'boom');
    });
  });
});
