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
import { QueueError } from '@adobe/helix-shared-queue';
import { dereferenceMessageBody, isSwappedBody } from '../src/dereferenceMessageBody.js';

/**
 * In-memory fake `Bucket`, mirroring the one in SqsBackend.test.js.
 */
class FakeBucket {
  constructor({ bucket = 'fake-spill-bucket' } = {}) {
    this.bucket = bucket;
    this.objects = new Map();
    this.removeCalls = [];
  }

  async put(key, body) {
    this.objects.set(key, body);
    return { key };
  }

  async get(key) {
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

/**
 * In-memory fake `Storage`: resolves any bucket name, lazily creating one if it wasn't
 * pre-registered -- mirrors the real `Storage.bucket()`'s "no allowlist" behavior.
 */
function createFakeStorage(bucketsByName = {}) {
  return {
    buckets: bucketsByName,
    bucket(name) {
      if (!this.buckets[name]) {
        this.buckets[name] = new FakeBucket({ bucket: name });
      }
      return this.buckets[name];
    },
  };
}

describe('dereferenceMessageBody()', () => {
  it('passes a non-JSON body through unchanged, with a no-op cleanup', async () => {
    const result = await dereferenceMessageBody('not json at all');
    assert.strictEqual(result.body, 'not json at all');
    await result.cleanup(); // must not throw
  });

  it('passes a JSON body through unchanged when it is not a swap pointer', async () => {
    const bucket = new FakeBucket();
    const storage = createFakeStorage({ [bucket.bucket]: bucket });
    const result = await dereferenceMessageBody('{"hello":"world"}', { storage });
    assert.strictEqual(result.body, '{"hello":"world"}');
    await result.cleanup();
    assert.deepStrictEqual(bucket.removeCalls, []);
  });

  it('dereferences a BatchedQueueClient-compatible pointer and cleans it up on request', async () => {
    const bucket = new FakeBucket();
    await bucket.put('k.json', JSON.stringify({ owner: 'adobe', repo: 'helix-indexer', data: 'x' }));
    const storage = createFakeStorage({ [bucket.bucket]: bucket });
    const body = JSON.stringify({
      owner: 'adobe', repo: 'helix-indexer', key: 'adobe/helix-indexer', swapS3Url: 's3://fake-spill-bucket/k.json',
    });

    const result = await dereferenceMessageBody(body, { storage });
    assert.deepStrictEqual(JSON.parse(result.body), { owner: 'adobe', repo: 'helix-indexer', data: 'x' });
    await result.cleanup();
    assert.deepStrictEqual(bucket.removeCalls, ['k.json']);
  });

  it('trusts the pointer and resolves whichever bucket it names, not a pre-configured one', async () => {
    const bucket = new FakeBucket({ bucket: 'some-other-bucket' });
    await bucket.put('k.json', 'the real body');
    const storage = createFakeStorage({ [bucket.bucket]: bucket });
    const body = JSON.stringify({
      owner: 'adobe', repo: 'helix-indexer', key: 'adobe/helix-indexer', swapS3Url: 's3://some-other-bucket/k.json',
    });

    const result = await dereferenceMessageBody(body, { storage });
    assert.strictEqual(result.body, 'the real body');
  });

  it('throws when the message was swapped out but no storage is configured', async () => {
    const body = JSON.stringify({
      owner: 'adobe', repo: 'helix-indexer', key: 'adobe/helix-indexer', swapS3Url: 's3://fake-spill-bucket/k.json',
    });
    await assert.rejects(dereferenceMessageBody(body), (e) => {
      assert.ok(e instanceof QueueError);
      assert.strictEqual(e.status, 500);
      return true;
    });
  });

  it('throws when the swapped message body cannot be found in the bucket', async () => {
    const storage = createFakeStorage();
    const body = JSON.stringify({
      owner: 'adobe', repo: 'helix-indexer', key: 'adobe/helix-indexer', swapS3Url: 's3://fake-spill-bucket/missing.json',
    });
    await assert.rejects(dereferenceMessageBody(body, { storage }), (e) => {
      assert.ok(e instanceof QueueError);
      assert.strictEqual(e.status, 404);
      return true;
    });
  });

  it('cleanup() is a no-op, and safe to call, when nothing was swapped', async () => {
    const storage = createFakeStorage();
    const result = await dereferenceMessageBody('{"plain":"message"}', { storage });
    await result.cleanup();
    assert.deepStrictEqual(Object.keys(storage.buckets), []);
  });

  it("cleanup() logs (but doesn't throw for) a failure to delete the swapped body", async () => {
    const bucket = new FakeBucket();
    await bucket.put('k.json', 'the real body');
    bucket.remove = async () => {
      throw new Error('boom');
    };
    const storage = createFakeStorage({ [bucket.bucket]: bucket });
    const body = JSON.stringify({
      owner: 'adobe', repo: 'helix-indexer', key: 'adobe/helix-indexer', swapS3Url: 's3://fake-spill-bucket/k.json',
    });

    const result = await dereferenceMessageBody(body, { storage });
    await result.cleanup(); // must not throw
  });
});

describe('isSwappedBody()', () => {
  it('returns false for a non-JSON body', () => {
    assert.strictEqual(isSwappedBody('not json at all'), false);
  });

  it('returns false for a plain JSON body', () => {
    assert.strictEqual(isSwappedBody('{"hello":"world"}'), false);
  });

  it('returns true for a swap pointer', () => {
    const body = JSON.stringify({
      owner: 'adobe', repo: 'helix-indexer', key: 'adobe/helix-indexer', swapS3Url: 's3://fake-spill-bucket/k.json',
    });
    assert.strictEqual(isSwappedBody(body), true);
  });
});
