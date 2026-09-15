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
import { QueueServiceSqs } from '../src/QueueServiceSqs.js';

describe('QueueServiceSqs', () => {
  it('fromContext() caches an instance that is both QueueServiceSqs and QueueService', () => {
    const context = { env: {}, log: console, attributes: {} };
    const service = QueueServiceSqs.fromContext(context);
    assert.ok(service instanceof QueueServiceSqs);
    assert.ok(service instanceof QueueService);
    assert.strictEqual(context.attributes.queue, service);
  });

  it('fromContext() returns the same cached instance on repeated calls', () => {
    const context = { env: {}, log: console, attributes: {} };
    const first = QueueServiceSqs.fromContext(context);
    const second = QueueServiceSqs.fromContext(context);
    assert.strictEqual(first, second);
  });

  it('forwards opts without requiring the caller to pass backendFactory directly', () => {
    const context = { env: {}, log: console, attributes: {} };
    const service = QueueServiceSqs.fromContext(context);
    const queue = service.queue('my-queue');
    assert.strictEqual(queue.name, 'my-queue');
  });

  it('toReceivedMessages() maps an array of raw SQS messages', () => {
    const context = { env: {}, log: console, attributes: {} };
    const service = QueueServiceSqs.fromContext(context);
    const raw1 = { MessageId: 'mid-1', Body: 'one' };
    const raw2 = { MessageId: 'mid-2', Body: 'two', Attributes: { MessageGroupId: 'g1' } };
    assert.deepStrictEqual(service.toReceivedMessages([raw1, raw2]), [
      {
        id: 'mid-1', body: 'one', groupId: undefined, receiveCount: undefined, raw: raw1,
      },
      {
        id: 'mid-2', body: 'two', groupId: 'g1', receiveCount: undefined, raw: raw2,
      },
    ]);
  });

  it('fromContext(context, { storage }) sets storage on the service', () => {
    const context = { env: {}, log: console, attributes: {} };
    const storage = { bucket: () => {} };
    const service = QueueServiceSqs.fromContext(context, { storage });
    assert.strictEqual(service.storage, storage);
  });

  describe('isSwapped() / deserialize()', () => {
    function buildService(storage) {
      const context = { env: {}, log: console, attributes: {} };
      return QueueServiceSqs.fromContext(context, { storage });
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
      await bucket.put('k.json', JSON.stringify({ owner: 'adobe', repo: 'helix-indexer', data: 'the real body' }));
      const service = buildService(storage);
      const [message] = service.toReceivedMessages([{
        MessageId: 'mid-1',
        Body: JSON.stringify({
          owner: 'adobe', repo: 'helix-indexer', key: 'adobe/helix-indexer', swapS3Url: 's3://fake-bucket/k.json',
        }),
      }]);
      assert.strictEqual(await service.isSwapped(message), true);
      const resolved = await service.deserialize(message);
      assert.deepStrictEqual(JSON.parse(resolved.body), { owner: 'adobe', repo: 'helix-indexer', data: 'the real body' });
    });

    it('isSwapped() returns false for a plain (non-swapped) message', async () => {
      const service = buildService(createFakeStorage());
      const [message] = service.toReceivedMessages([{ MessageId: 'mid-1', Body: 'hello' }]);
      assert.strictEqual(await service.isSwapped(message), false);
    });

    it('deserialize() returns the message unchanged when it was not swapped', async () => {
      const service = buildService(createFakeStorage());
      const [message] = service.toReceivedMessages([{ MessageId: 'mid-1', Body: 'hello' }]);
      assert.strictEqual(await service.deserialize(message), message);
    });

    it('deserialize() resolves a bucket different from the one configured on the service -- trust the pointer', async () => {
      const storage = createFakeStorage();
      const service = buildService(storage);
      const bucket = storage.bucket('some-other-bucket');
      await bucket.put('k.json', 'the real body');
      const [message] = service.toReceivedMessages([{
        MessageId: 'mid-1',
        Body: JSON.stringify({
          owner: 'adobe', repo: 'helix-indexer', key: 'adobe/helix-indexer', swapS3Url: 's3://some-other-bucket/k.json',
        }),
      }]);
      const resolved = await service.deserialize(message);
      assert.strictEqual(resolved.body, 'the real body');
    });

    it('deserialize() throws when no storage is configured and the message was swapped', async () => {
      const service = buildService(undefined);
      const [message] = service.toReceivedMessages([{
        MessageId: 'mid-1',
        Body: JSON.stringify({
          owner: 'adobe', repo: 'helix-indexer', key: 'adobe/helix-indexer', swapS3Url: 's3://fake-bucket/k.json',
        }),
      }]);
      await assert.rejects(service.deserialize(message));
    });
  });
});
