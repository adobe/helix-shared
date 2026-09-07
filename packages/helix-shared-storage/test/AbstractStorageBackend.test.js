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
import { Readable } from 'node:stream';
import { AbstractStorageBackend } from '../src/AbstractStorageBackend.js';
import { StorageError } from '../src/StorageError.js';

class MinimalBackend extends AbstractStorageBackend {
  constructor(heads = {}, listResult = { prefix: '', objects: [], continuationToken: undefined }) {
    super();
    this._heads = heads;
    this._listResult = listResult;
  }

  // eslint-disable-next-line class-methods-use-this -- fixed tag, like real backends' `name`
  get name() {
    return 'Minimal';
  }

  async head(key) {
    return this._heads[key] ?? null;
  }

  async list() {
    return this._listResult;
  }

  async put(key, body, opts) {
    this.putCall = { key, body, opts };
    return { etag: 'fake-etag' };
  }
}

describe('AbstractStorageBackend', () => {
  describe('generic defaults', () => {
    it('metadata() derives from head()', async () => {
      const backend = new MinimalBackend({ foo: { metadata: { a: '1' } } });
      assert.deepStrictEqual(await backend.metadata('foo'), { a: '1' });
    });

    it('metadata() returns undefined when head() is null', async () => {
      const backend = new MinimalBackend({});
      assert.strictEqual(await backend.metadata('missing'), undefined);
    });

    it('getMeta() merges head()\'s recognized system fields with its custom metadata', async () => {
      const backend = new MinimalBackend({
        foo: {
          contentType: 'text/plain',
          cacheControl: undefined,
          metadata: { a: '1' },
        },
      });
      assert.deepStrictEqual(await backend.getMeta('foo'), { contentType: 'text/plain', a: '1' });
    });

    it('getMeta() returns undefined when head() is null', async () => {
      const backend = new MinimalBackend({});
      assert.strictEqual(await backend.getMeta('missing'), undefined);
    });

    it('listFolders() filters list() results to folders', async () => {
      const backend = new MinimalBackend({}, {
        prefix: 'foo/',
        objects: [
          { key: 'foo/bar/', name: 'bar', isFolder: true },
          { key: 'foo/baz.md', name: 'baz.md', isFolder: false },
        ],
      });
      assert.deepStrictEqual(await backend.listFolders('foo'), ['bar']);
    });

    it('browse() forwards to list({shallow: true, maxItems}) and clears the continuation token', async () => {
      const backend = new MinimalBackend({}, {
        prefix: 'foo/',
        objects: [{ key: 'foo/bar.md', name: 'bar.md', isFolder: false }],
        continuationToken: 'should-be-cleared',
      });
      const result = await backend.browse('foo', { maxItems: 10 });
      assert.deepStrictEqual(result, {
        prefix: 'foo/',
        objects: [{ key: 'foo/bar.md', name: 'bar.md', isFolder: false }],
        continuationToken: undefined,
      });
    });

    it('putStream() buffers the stream fully, then delegates to put()', async () => {
      const backend = new MinimalBackend();
      const stream = Readable.from([Buffer.from('hello world')]);
      const opts = { contentType: 'text/plain' };

      const result = await backend.putStream('foo', stream, opts);
      assert.deepStrictEqual(result, { etag: 'fake-etag' });
      assert.strictEqual(backend.putCall.key, 'foo');
      assert.strictEqual(backend.putCall.body.toString(), 'hello world');
      assert.strictEqual(backend.putCall.opts, opts);
    });
  });

  describe('_wrapError()/_wrapOr404()', () => {
    it('_wrapError() wraps a raw error into a StorageError tagged with this.name', () => {
      const backend = new MinimalBackend();
      const raw = new Error('boom');
      // eslint-disable-next-line no-underscore-dangle -- exercising the protected helper directly
      const wrapped = backend._wrapError(raw, 'wrapped msg', { status: 500, code: 'X' });
      assert.ok(wrapped instanceof StorageError);
      assert.strictEqual(wrapped.message, 'wrapped msg');
      assert.strictEqual(wrapped.status, 500);
      assert.strictEqual(wrapped.code, 'X');
      assert.strictEqual(wrapped.backend, 'Minimal');
      assert.strictEqual(wrapped.cause, raw);
    });

    it('_wrapError() passes an already-StorageError through unchanged', () => {
      const backend = new MinimalBackend();
      const original = new StorageError('original msg', { status: 404, backend: 'Other' });
      // eslint-disable-next-line no-underscore-dangle -- exercising the protected helper directly
      const result = backend._wrapError(original, 'other msg', { status: 500 });
      assert.strictEqual(result, original);
      assert.strictEqual(result.message, 'original msg');
      assert.strictEqual(result.status, 404);
      assert.strictEqual(result.backend, 'Other');
    });

    it('_wrapOr404() returns null when the normalized status is 404', () => {
      const backend = new MinimalBackend();
      // eslint-disable-next-line no-underscore-dangle -- exercising the protected helper directly
      const result = backend._wrapOr404(new Error('not found'), 'not found', { status: 404 });
      assert.strictEqual(result, null);
    });

    it('_wrapOr404() throws a StorageError when the normalized status is not 404', () => {
      const backend = new MinimalBackend();
      // eslint-disable-next-line no-underscore-dangle -- exercising the protected helper directly
      assert.throws(() => backend._wrapOr404(new Error('boom'), 'boom', { status: 500 }), (e) => {
        assert.ok(e instanceof StorageError);
        assert.strictEqual(e.status, 500);
        return true;
      });
    });
  });

  describe('mandatory primitives', () => {
    const backend = new AbstractStorageBackend();

    ['get', 'head', 'put', 'putMeta', 'copy', 'remove', 'list'].forEach((method) => {
      it(`${method}() throws when not implemented`, async () => {
        await assert.rejects(backend[method](), new Error(`${method}() not implemented`));
      });
    });
  });
});
