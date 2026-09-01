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
import { AbstractStorageBackend } from '../src/AbstractStorageBackend.js';

class MinimalBackend extends AbstractStorageBackend {
  constructor(heads = {}, listResult = { prefix: '', objects: [], continuationToken: undefined }) {
    super();
    this._heads = heads;
    this._listResult = listResult;
  }

  async head(key) {
    return this._heads[key] ?? null;
  }

  async list() {
    return this._listResult;
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
