/*
 * Copyright 2021 Adobe. All rights reserved.
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
import { HelixStorage, parseBucketNames, resolveMetadataForCopy } from '../src/storage.js';

describe('resolveMetadataForCopy()', () => {
  it('resolves metadata', () => {
    const meta = resolveMetadataForCopy(
      {
        metadata: {
          foo: 1,
          bar: 2,
          baz: 3,
        },
        lastModified: '0',
      },
      { foo: 'bar', baz: 'foo' },
      { bar: 5, qux: 5 },
    );
    assert.deepStrictEqual(meta, {
      foo: 3,
      bar: 5,
      qux: 5,
    });
  });

  it('allows undefined params', () => {
    let meta = resolveMetadataForCopy();
    assert.deepStrictEqual(meta, {});

    meta = resolveMetadataForCopy({ metadata: { foo: '1' } });
    assert.deepStrictEqual(meta, { foo: '1' });

    meta = resolveMetadataForCopy(undefined, { foo: 'bar' });
    assert.deepStrictEqual(meta, { });

    meta = resolveMetadataForCopy(undefined, undefined, { foo: '1' });
    assert.deepStrictEqual(meta, { foo: '1' });
  });

  it('prefers renameMetadata over existingMetadata', () => {
    const meta = resolveMetadataForCopy({ metadata: { foo: '1', bar: '2' } }, { foo: 'bar' });
    assert.deepStrictEqual(meta, { bar: '1' });
  });

  it('prefers addMetadata over renameMetadata', () => {
    const meta = resolveMetadataForCopy({ metadata: { foo: '1' } }, { foo: 'bar' }, { bar: 'baz' });
    assert.deepStrictEqual(meta, { bar: 'baz' });
  });

  it('rename allows cycles', () => {
    const meta = resolveMetadataForCopy({ metadata: { foo: '1', bar: '2' } }, { foo: 'bar', bar: 'foo' });
    assert.deepStrictEqual(meta, { bar: '1', foo: '2' });
  });

  it('converts a Date lastModified to a UTC string when renamed', () => {
    const meta = resolveMetadataForCopy(
      { metadata: { foo: '1' }, lastModified: new Date('2023-11-23T10:35:10.000Z') },
      { 'last-modified': 'x-last-previewed' },
    );
    assert.deepStrictEqual(meta, { foo: '1', 'x-last-previewed': 'Thu, 23 Nov 2023 10:35:10 GMT' });
  });
});

describe('parseBucketNames()', () => {
  it('returns default mapping', () => {
    const map = parseBucketNames(null);
    assert.deepStrictEqual(map, {
      code: 'helix-code-bus',
      config: 'helix-config-bus',
      content: 'helix-content-bus',
      media: 'helix-media-bus',
      source: 'helix-source-bus',
    });
  });

  it('returns specified mapping', () => {
    const map = {
      code: 'bucket-01',
      config: 'bucket-02',
      content: 'bucket-03',
      media: 'bucket-04',
      source: 'bucket-05',
    };
    assert.deepStrictEqual(parseBucketNames(JSON.stringify(map)), map);
  });
});

describe('HelixStorage', () => {
  let calls;
  let storage;

  const backendFactory = (bucketId, opts) => {
    calls.push({ bucketId, opts });
    return { bucketName: bucketId, name: 'Fake' };
  };

  beforeEach(() => {
    calls = [];
    storage = new HelixStorage({ backendFactory });
  });

  afterEach(() => {
    storage.close();
  });

  it('bucket() throws when no backendFactory is configured', () => {
    const s = new HelixStorage();
    assert.throws(
      () => s.bucket('foo'),
      /No backendFactory configured/,
    );
  });

  it('bucket() needs bucket', () => {
    assert.throws(() => storage.bucket(), Error('bucketId is required.'));
  });

  it('bucket() calls the backendFactory with a forwarded, opaque opts bag', () => {
    const bucket = storage.bucket('my-bucket', { disableR2: true });
    assert.deepStrictEqual(calls, [{ bucketId: 'my-bucket', opts: { disableR2: true } }]);
    assert.strictEqual(bucket.bucket, 'my-bucket');
  });

  it('bucket() defaults opts to an empty object', () => {
    storage.bucket('my-bucket');
    assert.deepStrictEqual(calls, [{ bucketId: 'my-bucket', opts: {} }]);
  });

  it('contentBus() fails on closed storage', () => {
    storage.close();
    assert.throws(() => storage.contentBus(), Error('storage already closed.'));
  });

  it('can get the content-bus', () => {
    assert.strictEqual(storage.contentBus().bucket, 'helix-content-bus');
    assert.deepStrictEqual(calls[0].opts, {});
  });

  it('can get the code-bus', () => {
    assert.strictEqual(storage.codeBus().bucket, 'helix-code-bus');
    assert.deepStrictEqual(calls[0].opts, {});
  });

  it('can get the media-bus', () => {
    assert.strictEqual(storage.mediaBus().bucket, 'helix-media-bus');
  });

  it('can get the config-bus', () => {
    assert.strictEqual(storage.configBus().bucket, 'helix-config-bus');
  });

  it('can get the source-bus, defaulting to disableR2', () => {
    assert.strictEqual(storage.sourceBus().bucket, 'helix-source-bus');
    assert.deepStrictEqual(calls[0].opts, { disableR2: true });
  });

  it('can get the source-bus with disableR2 overridden', () => {
    storage.sourceBus({ disableR2: false });
    assert.deepStrictEqual(calls[0].opts, { disableR2: false });
  });

  it('can get an object with a different bucket name', () => {
    const map = {
      code: 'bucket-01',
      config: 'bucket-02',
      content: 'bucket-03',
      media: 'bucket-04',
      source: 'bucket-05',
    };
    storage = new HelixStorage({ backendFactory, bucketNames: JSON.stringify(map) });
    assert.strictEqual(storage.codeBus().bucket, 'bucket-01');
  });

  it('creates a storage from context and caches it', () => {
    const ctx = {
      env: { backendFactory },
      attributes: {},
    };
    const stor = HelixStorage.fromContext(ctx);
    assert.ok(stor instanceof HelixStorage);
    assert.strictEqual(HelixStorage.fromContext(ctx), stor);
  });

  it('fromContext() forwards opts to the constructor', () => {
    const ctx = {
      env: {},
      attributes: {},
    };
    const stor = HelixStorage.fromContext(ctx, { backendFactory });
    assert.strictEqual(stor.contentBus().bucket, 'helix-content-bus');
  });
});
