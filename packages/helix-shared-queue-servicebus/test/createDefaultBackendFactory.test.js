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
import { ServiceBusClient } from '@azure/service-bus';
import { createDefaultBackendFactory } from '../src/createDefaultBackendFactory.js';
import { ServiceBusBackend } from '../src/ServiceBusBackend.js';

const FAKE_CONNECTION_STRING = 'Endpoint=sb://fake.servicebus.windows.net/;SharedAccessKeyName=fake;SharedAccessKey=ZmFrZQ==';

/**
 * AMQP can't be mocked with `nock`, so proving the factory wired `bucket`/`swapPrefix` into the
 * real `ServiceBusClient`-backed backend requires stubbing `createSender`/`createReceiver` on
 * the client prototype with hand-rolled fakes (same style as `ServiceBusBackend.test.js`),
 * rather than mocking at the wire level.
 */
function createFakeSender({ maxSizeInBytes = 200 } = {}) {
  return {
    async createMessageBatch() {
      const messages = [];
      return {
        get count() { return messages.length; },
        tryAddMessage(message) {
          const size = messages.reduce((n, m) => n + Buffer.byteLength(String(m.body)), 0)
            + Buffer.byteLength(String(message.body));
          if (size > maxSizeInBytes) {
            return false;
          }
          messages.push(message);
          return true;
        },
        messages,
      };
    },
    // no-op: this test only cares about what got spilled to the bucket, not what got "sent"
    async sendMessages() {
      // intentionally empty
    },
  };
}

/**
 * In-memory fake `Bucket`, sufficient to prove a `put()` call actually landed on the expected
 * bucket instance with the expected key prefix.
 */
class FakeBucket {
  constructor({ bucket }) {
    this.bucket = bucket;
    this.putCalls = [];
  }

  async put(key, body) {
    this.putCalls.push({ key, body });
    return { key };
  }
}

describe('createDefaultBackendFactory()', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns a factory producing a ServiceBusBackend for a given queue name', () => {
    const factory = createDefaultBackendFactory(
      { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      { log: console },
    );
    const backend = factory('my-queue');
    assert.ok(backend instanceof ServiceBusBackend);
    assert.strictEqual(backend.queueName, 'my-queue');
  });

  it('forwards a factory-level default bucket/swapPrefix to every queue', async () => {
    const bucket = new FakeBucket({ bucket: 'fake-bucket' });
    sinon.stub(ServiceBusClient.prototype, 'createSender').returns(createFakeSender());
    sinon.stub(ServiceBusClient.prototype, 'createReceiver').returns({});

    const factory = createDefaultBackendFactory(
      { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      { log: console, bucket, swapPrefix: 'custom' },
    );
    const backend = factory('my-queue');
    await backend.sendBatch([{ body: JSON.stringify({ payload: 'x'.repeat(1000) }) }]);

    assert.strictEqual(bucket.putCalls.length, 1);
    assert.match(bucket.putCalls[0].key, /^custom\//);
  });

  it('lets a per-queue opts bag override the factory-level bucket/swapPrefix', async () => {
    const defaultBucket = new FakeBucket({ bucket: 'default-bucket' });
    const perQueueBucket = new FakeBucket({ bucket: 'per-queue-bucket' });
    sinon.stub(ServiceBusClient.prototype, 'createSender').returns(createFakeSender());
    sinon.stub(ServiceBusClient.prototype, 'createReceiver').returns({});

    const factory = createDefaultBackendFactory(
      { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      { log: console, bucket: defaultBucket },
    );
    const backend = factory('my-queue', { bucket: perQueueBucket, swapPrefix: 'per-queue' });
    await backend.sendBatch([{ body: JSON.stringify({ payload: 'x'.repeat(1000) }) }]);

    assert.strictEqual(defaultBucket.putCalls.length, 0);
    assert.strictEqual(perQueueBucket.putCalls.length, 1);
    assert.match(perQueueBucket.putCalls[0].key, /^per-queue\//);
  });
});
