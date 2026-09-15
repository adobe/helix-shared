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
import { QueueService } from '@adobe/helix-shared-queue';
import { QueueServiceServiceBus } from '../src/QueueServiceServiceBus.js';

const FAKE_CONNECTION_STRING = 'Endpoint=sb://fake.servicebus.windows.net/;SharedAccessKeyName=fake;SharedAccessKey=ZmFrZQ==';

describe('QueueServiceServiceBus', () => {
  it('fromContext() caches an instance that is both QueueServiceServiceBus and QueueService', () => {
    const context = {
      env: { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      log: console,
      attributes: {},
    };
    const service = QueueServiceServiceBus.fromContext(context);
    assert.ok(service instanceof QueueServiceServiceBus);
    assert.ok(service instanceof QueueService);
    assert.strictEqual(context.attributes.queue, service);
  });

  it('fromContext() returns the same cached instance on repeated calls', () => {
    const context = {
      env: { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      log: console,
      attributes: {},
    };
    const first = QueueServiceServiceBus.fromContext(context);
    const second = QueueServiceServiceBus.fromContext(context);
    assert.strictEqual(first, second);
  });

  it('forwards opts without requiring the caller to pass backendFactory directly', () => {
    const context = {
      env: { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      log: console,
      attributes: {},
    };
    const service = QueueServiceServiceBus.fromContext(context);
    const queue = service.queue('my-queue');
    assert.strictEqual(queue.name, 'my-queue');
  });

  it('toReceivedMessages() maps an array of raw Service Bus messages', () => {
    const context = {
      env: { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      log: console,
      attributes: {},
    };
    const service = QueueServiceServiceBus.fromContext(context);
    const raw1 = { messageId: 'mid-1', body: 'one' };
    const raw2 = {
      messageId: 'mid-2', body: 'two', sessionId: 'g1', deliveryCount: 3,
    };
    assert.deepStrictEqual(service.toReceivedMessages([raw1, raw2]), [
      {
        id: 'mid-1', body: 'one', groupId: undefined, receiveCount: undefined, raw: raw1,
      },
      {
        id: 'mid-2', body: 'two', groupId: 'g1', receiveCount: 3, raw: raw2,
      },
    ]);
  });

  it('fromContext(context, { storage }) sets storage on the service', () => {
    const context = {
      env: { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      log: console,
      attributes: {},
    };
    const storage = { bucket: () => {} };
    const service = QueueServiceServiceBus.fromContext(context, { storage });
    assert.strictEqual(service.storage, storage);
  });

  describe('isSwapped() / deserialize()', () => {
    function buildService(storage) {
      const context = {
        env: { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
        log: console,
        attributes: {},
      };
      return QueueServiceServiceBus.fromContext(context, { storage });
    }

    function createFakeStorage(buckets = new Map()) {
      return {
        bucket(name) {
          if (!buckets.has(name)) {
            buckets.set(name, {
              bucket: name,
              objects: new Map(),
              async get(key) {
                return this.objects.has(key) ? Buffer.from(this.objects.get(key)) : null;
              },
              async put(key, body) {
                this.objects.set(key, body);
              },
              async remove(key) {
                this.objects.delete(key);
              },
            });
          }
          return buckets.get(name);
        },
      };
    }

    it('isSwapped()/deserialize() work off a plain {id, body} message with no `raw` at all -- '
      + 'the trigger-delivery path', async () => {
      const storage = createFakeStorage();
      const bucket = storage.bucket('fake-bucket');
      await bucket.put('k.json', 'the real body');
      const service = buildService(storage);
      const [message] = service.toReceivedMessages([{
        messageId: 'mid-1',
        body: JSON.stringify({ swapBucket: 'fake-bucket', swapKey: 'k.json' }),
      }]);
      assert.strictEqual(await service.isSwapped(message), true);
      const resolved = await service.deserialize(message);
      assert.strictEqual(resolved.body, 'the real body');
    });

    it('isSwapped() returns false for a plain (non-swapped) message', async () => {
      const service = buildService(createFakeStorage());
      const [message] = service.toReceivedMessages([{ messageId: 'mid-1', body: 'hello' }]);
      assert.strictEqual(await service.isSwapped(message), false);
    });

    it('deserialize() returns the message unchanged when it was not swapped', async () => {
      const service = buildService(createFakeStorage());
      const [message] = service.toReceivedMessages([{ messageId: 'mid-1', body: 'hello' }]);
      assert.strictEqual(await service.deserialize(message), message);
    });

    it('deserialize() resolves a bucket different from the one configured on the service -- trust the pointer', async () => {
      const storage = createFakeStorage();
      const service = buildService(storage);
      const bucket = storage.bucket('some-other-bucket');
      await bucket.put('k.json', 'the real body');
      const [message] = service.toReceivedMessages([{
        messageId: 'mid-1',
        body: JSON.stringify({ swapBucket: 'some-other-bucket', swapKey: 'k.json' }),
      }]);
      const resolved = await service.deserialize(message);
      assert.strictEqual(resolved.body, 'the real body');
    });

    it('deserialize() throws when no storage is configured and the message was swapped', async () => {
      const service = buildService(undefined);
      const [message] = service.toReceivedMessages([{
        messageId: 'mid-1',
        body: JSON.stringify({ swapBucket: 'fake-bucket', swapKey: 'k.json' }),
      }]);
      await assert.rejects(service.deserialize(message));
    });
  });
});
