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
import { MirroringBackend } from '../src/MirroringBackend.js';

/**
 * Minimal fake backend: records calls, either resolves with a fixed value or rejects with a
 * fixed error, for every method.
 */
class FakeBackend {
  constructor(name, { fails = false, value = `${name}-value`, client = `${name}-client` } = {}) {
    this.name = name;
    this.bucketName = 'fake-bucket';
    this.client = client;
    this.calls = {};
    this._fails = fails;
    this._value = value;
  }

  async _invoke(method, args) {
    this.calls[method] = (this.calls[method] || 0) + 1;
    if (this._fails) {
      throw new Error(`${method} failed`);
    }
    return { method, args, value: this._value };
  }

  get(...args) { return this._invoke('get', args); }

  head(...args) { return this._invoke('head', args); }

  metadata(...args) { return this._invoke('metadata', args); }

  list(...args) { return this._invoke('list', args); }

  listFolders(...args) { return this._invoke('listFolders', args); }

  browse(...args) { return this._invoke('browse', args); }

  put(...args) { return this._invoke('put', args); }

  copy(...args) { return this._invoke('copy', args); }

  remove(...args) { return this._invoke('remove', args); }

  putMeta(...args) { return this._invoke('putMeta', args); }
}

describe('MirroringBackend', () => {
  it('proxies name/bucketName/client to primary', () => {
    const primary = new FakeBackend('S3');
    const secondary = new FakeBackend('R2');
    const mirror = new MirroringBackend({ primary, secondaries: [secondary] });
    assert.strictEqual(mirror.name, 'S3');
    assert.strictEqual(mirror.bucketName, 'fake-bucket');
    assert.strictEqual(mirror.client, 'S3-client');
  });

  ['get', 'head', 'metadata', 'list', 'listFolders', 'browse'].forEach((method) => {
    it(`${method}() reads only from primary`, async () => {
      const primary = new FakeBackend('S3');
      const secondary = new FakeBackend('R2');
      const mirror = new MirroringBackend({ primary, secondaries: [secondary] });
      const result = await mirror[method]('foo');
      assert.strictEqual(result.value, 'S3-value');
      assert.strictEqual(primary.calls[method], 1);
      assert.strictEqual(secondary.calls[method] || 0, 0);
    });
  });

  ['put', 'copy', 'remove', 'putMeta'].forEach((method) => {
    describe(`${method}()`, () => {
      it('returns the primary result when all backends succeed', async () => {
        const primary = new FakeBackend('S3');
        const secondary = new FakeBackend('R2');
        const mirror = new MirroringBackend({ primary, secondaries: [secondary] });
        const result = await mirror[method]('foo', 'bar');
        assert.strictEqual(result.value, 'S3-value');
        assert.deepStrictEqual(result.args, ['foo', 'bar']);
        assert.strictEqual(primary.calls[method], 1);
        assert.strictEqual(secondary.calls[method], 1);
      });

      it('throws tagged with the primary name when only the primary fails', async () => {
        const primary = new FakeBackend('S3', { fails: true });
        const secondary = new FakeBackend('R2');
        const mirror = new MirroringBackend({ primary, secondaries: [secondary] });
        await assert.rejects(mirror[method]('foo'), (err) => {
          assert.strictEqual(err.message, `[S3] ${method} failed`);
          return true;
        });
      });

      it('throws tagged with the failing secondary name when only a secondary fails', async () => {
        const primary = new FakeBackend('S3');
        const secondary = new FakeBackend('R2', { fails: true });
        const mirror = new MirroringBackend({ primary, secondaries: [secondary] });
        await assert.rejects(mirror[method]('foo'), (err) => {
          assert.strictEqual(err.message, `[R2] ${method} failed`);
          return true;
        });
      });

      it('throws tagged with the first-in-array backend when multiple fail', async () => {
        const primary = new FakeBackend('S3', { fails: true });
        const secondary = new FakeBackend('R2', { fails: true });
        const mirror = new MirroringBackend({ primary, secondaries: [secondary] });
        await assert.rejects(mirror[method]('foo'), (err) => {
          assert.strictEqual(err.message, `[S3] ${method} failed`);
          return true;
        });
      });

      it('generalizes to 3+ backends, tagging the failing one by identity', async () => {
        const primary = new FakeBackend('S3');
        const r2 = new FakeBackend('R2');
        const azure = new FakeBackend('Azure', { fails: true });
        const mirror = new MirroringBackend({ primary, secondaries: [r2, azure] });
        await assert.rejects(mirror[method]('foo'), (err) => {
          assert.strictEqual(err.message, `[Azure] ${method} failed`);
          return true;
        });
      });

      it('with 3+ backends, returns the primary result when all succeed', async () => {
        const primary = new FakeBackend('S3');
        const r2 = new FakeBackend('R2');
        const azure = new FakeBackend('Azure');
        const mirror = new MirroringBackend({ primary, secondaries: [r2, azure] });
        const result = await mirror[method]('foo');
        assert.strictEqual(result.value, 'S3-value');
        assert.strictEqual(primary.calls[method], 1);
        assert.strictEqual(r2.calls[method], 1);
        assert.strictEqual(azure.calls[method], 1);
      });
    });
  });
});
