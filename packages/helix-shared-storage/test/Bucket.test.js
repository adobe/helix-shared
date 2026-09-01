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
import { Response } from '@adobe/fetch';
import { AbstractStorageBackend } from '../src/AbstractStorageBackend.js';
import { Bucket } from '../src/Bucket.js';

/**
 * In-memory fake backend, sufficient to exercise Bucket's compositions (copy metadata
 * algebra, copyDeep, rmdir, store) without any real HTTP/SDK involved.
 */
class FakeBackend extends AbstractStorageBackend {
  constructor({ bucketName = 'fake-bucket', name = 'Fake', client } = {}) {
    super();
    this.bucketName = bucketName;
    this.name = name;
    this.client = client;
    this.objects = new Map();
  }

  async get(key, meta) {
    const obj = this.objects.get(key);
    if (!obj) {
      return null;
    }
    if (meta) {
      Object.assign(meta, obj.metadata);
    }
    return obj.body;
  }

  async head(key) {
    const obj = this.objects.get(key);
    if (!obj) {
      return null;
    }
    const { body: _, ...rest } = obj;
    return { ...rest };
  }

  async put(key, body, opts = {}) {
    this.objects.set(key, { body, metadata: {}, ...opts });
    return { etag: `"etag-${key}"`, key, ...opts };
  }

  async putMeta(key, meta) {
    const obj = this.objects.get(key);
    if (obj) {
      obj.metadata = meta;
    }
    return { key };
  }

  async copy(src, dst, opts = {}) {
    const obj = this.objects.get(src);
    if (!obj) {
      const e = new Error(`source not found: ${src}`);
      e.status = 404;
      throw e;
    }
    // `opts` is already a flat bag (Bucket._buildCopyOptions() spreads `copyOpts` at the top
    // level, mixed with the common fields), matching how a real backend consumes it.
    this.objects.set(dst, {
      body: obj.body,
      ...opts,
      metadata: opts.metadataDirective === 'REPLACE' ? (opts.metadata || {}) : obj.metadata,
    });
    return { etag: `"etag-${dst}"`, key: dst };
  }

  async remove(pathOrPaths) {
    if (Array.isArray(pathOrPaths)) {
      const Deleted = pathOrPaths.map((k) => {
        this.objects.delete(k);
        return { Key: k };
      });
      return { Deleted, Errors: [] };
    }
    this.objects.delete(pathOrPaths);
    return { Key: pathOrPaths };
  }

  async list(prefix) {
    const objects = [];
    for (const key of this.objects.keys()) {
      if (key.startsWith(prefix)) {
        objects.push({
          key,
          name: key.substring(prefix.length),
          isFolder: false,
          contentLength: this.objects.get(key).body?.length,
        });
      }
    }
    return { prefix, objects, continuationToken: undefined };
  }
}

describe('Bucket', () => {
  let backend;
  let bucket;

  beforeEach(() => {
    backend = new FakeBackend();
    bucket = new Bucket({ backend, log: console });
  });

  it('exposes the bucket name and log from the backend', () => {
    assert.strictEqual(bucket.bucket, 'fake-bucket');
    assert.strictEqual(bucket.log, console);
  });

  describe('client', () => {
    it('throws when the backend has no client', () => {
      assert.throws(() => bucket.client, /client is only available for S3-backed buckets/);
    });

    it('returns the backend client when present', () => {
      backend.client = 'fake-client';
      assert.strictEqual(bucket.client, 'fake-client');
    });
  });

  describe('get/head/metadata', () => {
    it('get() returns null for a missing key', async () => {
      assert.strictEqual(await bucket.get('/missing'), null);
    });

    it('put() then get() round-trips, sanitizing leading slashes', async () => {
      await bucket.put('/foo', 'hello', 'text/plain', { a: '1' }, false);
      const ret = await bucket.get('/foo');
      assert.strictEqual(ret, 'hello');
    });

    it('head() returns null for a missing key', async () => {
      assert.strictEqual(await bucket.head('/missing'), null);
    });

    it('metadata() returns undefined for a missing key, and the metadata otherwise', async () => {
      assert.strictEqual(await bucket.metadata('/missing'), undefined);
      await bucket.put('/foo', 'hello', 'text/plain', { a: '1' }, false);
      assert.deepStrictEqual(await bucket.metadata('/foo'), { a: '1' });
    });
  });

  describe('put()', () => {
    it('gzips the body by default', async () => {
      await bucket.put('/foo', 'hello, world.', 'text/plain', { a: '1' });
      const obj = backend.objects.get('foo');
      assert.notStrictEqual(obj.body.toString('utf-8'), 'hello, world.');
      assert.strictEqual(obj.contentEncoding, 'gzip');
      assert.strictEqual(obj.contentType, 'text/plain');
      assert.deepStrictEqual(obj.metadata, { a: '1' });
    });

    it('skips gzip when compress is false', async () => {
      await bucket.put('/foo', 'hello, world.', 'text/plain', {}, false);
      const obj = backend.objects.get('foo');
      assert.strictEqual(obj.body.toString('utf-8'), 'hello, world.');
      assert.strictEqual(obj.contentEncoding, undefined);
    });
  });

  describe('store()', () => {
    it('maps system headers and metadata, gzipping the body', async () => {
      const res = new Response('hello, world.', {
        headers: { 'content-type': 'text/plain', myid: '1234' },
      });
      await bucket.store('/foo', res);
      const obj = backend.objects.get('foo');
      assert.strictEqual(obj.contentType, 'text/plain');
      assert.strictEqual(obj.contentEncoding, 'gzip');
      assert.deepStrictEqual(obj.metadata, { myid: '1234' });
      assert.notStrictEqual(obj.body.toString('utf-8'), 'hello, world.');
    });

    it('passes through an already-gzipped body unchanged', async () => {
      const zlib = await import('zlib');
      const { promisify } = await import('util');
      const gzip = promisify(zlib.gzip);
      const zipped = await gzip('hello, world.');
      const res = new Response(zipped, {
        headers: { 'content-type': 'text/plain', 'content-encoding': 'gzip' },
      });
      await bucket.store('/foo', res);
      const obj = backend.objects.get('foo');
      assert.deepStrictEqual(obj.body, zipped);
    });

    it('renames the last-modified header before writing it as metadata', async () => {
      const res = new Response('hello, world.', {
        headers: { 'content-type': 'text/plain', 'last-modified': 'Mon, 03 Nov 2025 07:08:10 GMT' },
      });
      await bucket.store('/foo', res);
      const obj = backend.objects.get('foo');
      assert.deepStrictEqual(obj.metadata, { 'x-source-last-modified': 'Mon, 03 Nov 2025 07:08:10 GMT' });
    });
  });

  describe('putMeta()', () => {
    it('delegates to the backend, unnarrowed', async () => {
      await bucket.put('/foo', 'hello', 'text/plain', {}, false);
      const res = await bucket.putMeta('/foo', { a: '1' });
      assert.strictEqual(res.key, 'foo');
      assert.deepStrictEqual(backend.objects.get('foo').metadata, { a: '1' });
    });
  });

  describe('copy()', () => {
    it('copies without touching metadata when no addMetadata/renameMetadata given', async () => {
      await bucket.put('/foo', 'hello', 'text/plain', { a: '1' }, false);
      await bucket.copy('/foo', '/bar');
      assert.deepStrictEqual(backend.objects.get('bar').metadata, { a: '1' });
    });

    it('rejects with the backend error when source is missing and no metadata requested', async () => {
      await assert.rejects(bucket.copy('/missing', '/bar'), /source not found/);
    });

    it('throws status 404 when source is missing and metadata mutation was requested', async () => {
      await assert.rejects(bucket.copy('/missing', '/bar', { addMetadata: { a: '1' } }), (e) => {
        assert.strictEqual(e.status, 404);
        return true;
      });
    });

    it('preserves system headers and resolves metadata via head() when addMetadata given', async () => {
      await bucket.put('/foo', 'hello', 'text/plain', { existing: '1' }, false);
      await bucket.copy('/foo', '/bar', { addMetadata: { added: '2' } });
      const obj = backend.objects.get('bar');
      assert.strictEqual(obj.contentType, 'text/plain');
      assert.deepStrictEqual(obj.metadata, { existing: '1', added: '2' });
    });

    it('forwards copyOpts as raw, backend-native fields', async () => {
      await bucket.put('/foo', 'hello', 'text/plain', {}, false);
      await bucket.copy('/foo', '/bar', { copyOpts: { Tagging: 'x=1' } });
      assert.strictEqual(backend.objects.get('bar').Tagging, 'x=1');
    });
  });

  describe('remove()', () => {
    it('removes a single key', async () => {
      await bucket.put('/foo', 'hello', 'text/plain', {}, false);
      await bucket.remove('/foo');
      assert.strictEqual(backend.objects.has('foo'), false);
    });

    it('removes an array of keys', async () => {
      await bucket.put('/foo', 'hello', 'text/plain', {}, false);
      await bucket.put('/bar', 'hello', 'text/plain', {}, false);
      const result = await bucket.remove(['/foo', '/bar']);
      assert.deepStrictEqual(result.Deleted.map((d) => d.Key).sort(), ['bar', 'foo']);
    });
  });

  describe('list/browse/listFolders', () => {
    it('list() returns objects under a sanitized prefix', async () => {
      await bucket.put('/foo/a.txt', 'hello', 'text/plain', {}, false);
      await bucket.put('/foo/b.txt', 'hello', 'text/plain', {}, false);
      const result = await bucket.list('foo');
      assert.strictEqual(result.prefix, 'foo/');
      assert.strictEqual(result.objects.length, 2);
    });

    it('browse() delegates to the backend (generic default, since FakeBackend does not override it)', async () => {
      await bucket.put('/foo/a.txt', 'hello', 'text/plain', {}, false);
      const result = await bucket.browse('foo');
      assert.strictEqual(result.objects.length, 1);
      assert.strictEqual(result.continuationToken, undefined);
    });

    it('listFolders() delegates to the backend (generic default: none of the fake entries are folders)', async () => {
      await bucket.put('/foo/a.txt', 'hello', 'text/plain', {}, false);
      assert.deepStrictEqual(await bucket.listFolders('foo'), []);
    });

    it('list() with an empty prefix lists the entire bucket', async () => {
      await bucket.put('/foo.txt', 'hello', 'text/plain', {}, false);
      const result = await bucket.list('');
      assert.strictEqual(result.prefix, '');
    });
  });

  describe('copyDeep()', () => {
    it('copies the filtered tree, skipping objects excluded by the filter', async () => {
      await bucket.put('/src/a.txt', 'a', 'text/plain', {}, false);
      await bucket.put('/src/b.txt', 'b', 'text/plain', {}, false);
      const changes = await bucket.copyDeep('/src/', '/dst', (info) => info.relPath !== 'b.txt');
      assert.strictEqual(changes.length, 1);
      assert.strictEqual(changes[0].dst, 'dst/a.txt');
      assert.ok(backend.objects.has('dst/a.txt'));
      assert.ok(!backend.objects.has('dst/b.txt'));
    });

    it('places files at the bucket root when dst is empty', async () => {
      await bucket.put('/src/a.txt', 'a', 'text/plain', {}, false);
      const changes = await bucket.copyDeep('src/', '');
      assert.strictEqual(changes[0].dst, 'a.txt');
    });

    it('logs and counts (without throwing) when an individual copy fails', async () => {
      await bucket.put('/src/a.txt', 'a', 'text/plain', {}, false);
      backend.copy = async () => {
        throw new Error('boom');
      };
      const changes = await bucket.copyDeep('/src/', '/dst');
      assert.deepStrictEqual(changes, []);
    });

    it('skips a task when metadata mutation is requested but the source disappeared', async () => {
      await bucket.put('/src/ghost.txt', 'a', 'text/plain', {}, false);
      const originalHead = backend.head.bind(backend);
      backend.head = async (key) => {
        if (key === 'src/ghost.txt') {
          return null;
        }
        return originalHead(key);
      };
      const changes = await bucket.copyDeep('/src/', '/dst', undefined, { addMetadata: { a: '1' } });
      assert.deepStrictEqual(changes, []);
      assert.ok(!backend.objects.has('dst/ghost.txt'));
    });
  });

  describe('rmdir()', () => {
    it('lists and removes every object below the prefix', async () => {
      await bucket.put('/src/a.txt', 'a', 'text/plain', {}, false);
      await bucket.put('/src/b.txt', 'b', 'text/plain', {}, false);
      await bucket.rmdir('/src/');
      assert.strictEqual(backend.objects.has('src/a.txt'), false);
      assert.strictEqual(backend.objects.has('src/b.txt'), false);
    });
  });
});
