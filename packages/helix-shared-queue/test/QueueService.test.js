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
import { QueueService } from '../src/QueueService.js';

describe('QueueService', () => {
  let calls;
  let service;

  const backendFactory = (queueName, opts) => {
    calls.push({ queueName, opts });
    return { queueName, name: 'Fake' };
  };

  beforeEach(() => {
    calls = [];
    service = new QueueService({ backendFactory });
  });

  afterEach(() => {
    service.close();
  });

  it('queue() throws when no backendFactory is configured', () => {
    const s = new QueueService();
    assert.throws(
      () => s.queue('foo'),
      /No backendFactory configured/,
    );
  });

  it('queue() needs a queueName', () => {
    assert.throws(() => service.queue(), Error('queueName is required.'));
  });

  it('queue() calls the backendFactory with a forwarded, opaque opts bag', () => {
    const queue = service.queue('my-queue', { visibilityTimeout: 30 });
    assert.deepStrictEqual(calls, [{ queueName: 'my-queue', opts: { visibilityTimeout: 30 } }]);
    assert.strictEqual(queue.name, 'my-queue');
  });

  it('queue() defaults opts to an empty object', () => {
    service.queue('my-queue');
    assert.deepStrictEqual(calls, [{ queueName: 'my-queue', opts: {} }]);
  });

  it('queue() fails on closed service', () => {
    service.close();
    assert.throws(() => service.queue('my-queue'), Error('queue service already closed.'));
  });

  it('close() is idempotent', () => {
    service.close();
    service.close();
    assert.throws(() => service.queue('my-queue'), Error('queue service already closed.'));
  });

  it('creates a queue service from context and caches it', () => {
    const ctx = {
      env: {},
      log: console,
      attributes: {},
    };
    const s = QueueService.fromContext(ctx, { backendFactory });
    assert.ok(s instanceof QueueService);
    assert.strictEqual(QueueService.fromContext(ctx), s);
    // second call must not re-construct (asserted indirectly: only one backendFactory call
    // happens below, on the single queue() invocation)
    assert.strictEqual(s.queue('my-queue').name, 'my-queue');
    assert.strictEqual(calls.length, 1);
  });

  it('fromContext() forwards opts to the constructor', () => {
    const ctx = {
      env: {},
      log: console,
      attributes: {},
    };
    const s = QueueService.fromContext(ctx, { backendFactory });
    assert.strictEqual(s.queue('my-queue').name, 'my-queue');
  });

  it('fromContext() lets a subclass compose correctly via new this(...)', () => {
    class MyQueueService extends QueueService {
      static fromContext(context, opts = {}) {
        return super.fromContext(context, { backendFactory, ...opts });
      }
    }
    const ctx = {
      env: {},
      log: console,
      attributes: {},
    };
    const s = MyQueueService.fromContext(ctx);
    assert.ok(s instanceof MyQueueService);
    assert.strictEqual(MyQueueService.fromContext(ctx), s);
  });
});
