/*
 * Copyright 2022 Adobe. All rights reserved.
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
import path from 'path';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import { FSCachePlugin, MemCachePlugin } from '../src/index.js';
import { MockTokenCacheContext } from './MockTokenCacheContext.js';

describe('MemCachePlugin Test', () => {
  let testRoot;
  let testFilePath;

  beforeEach(async () => {
    new MemCachePlugin().clear();
    testRoot = path.resolve(__testdir, 'tmp', crypto.randomUUID());
    await fs.mkdir(testRoot, { recursive: true });
    testFilePath = path.resolve(testRoot, 'auth.json');
  });

  afterEach(async () => {
    new MemCachePlugin().clear();
    await fs.rm(testRoot, { recursive: true });
  });

  it('writes the cache w/o base with local cache', async () => {
    const caches = new Map();
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      caches,
    });

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      tokens: 'foobar',
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.deepStrictEqual(caches.get('foobar-key'), { data: 'foobar' });
    assert.strictEqual(p.location, 'foobar-key');
  });

  it('read/writes the cache w/o base with global cache', async () => {
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
    });

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      tokens: 'foobar',
    });

    await p.afterCacheAccess(ctx);
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.strictEqual(ctx.tokens, 'foobar');
  });

  it('handles errors when updating the token cache', async () => {
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
    });

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      tokens: 'foobar',
    });
    ctx.tokenCache.deserialize = () => {
      throw new Error('kaput');
    };

    await p.afterCacheAccess(ctx);
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, false);
  });

  it('ignores if token cache not modified', async () => {
    const caches = new Map();
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      caches,
    });

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: false,
      tokens: 'foobar',
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, false);
    assert.strictEqual(caches.get('foobar-key'), undefined);
  });

  it('writes the cache w/o base with local cache can delete', async () => {
    const caches = new Map();
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      caches,
    });

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      tokens: 'foobar',
    });
    await p.afterCacheAccess(ctx);
    assert.deepStrictEqual(caches.get('foobar-key'), { data: 'foobar' });
    p.deleteCache();
    assert.strictEqual(caches.get('foobar-key'), undefined);
  });

  it('writes the cache to base', async () => {
    const caches = new Map();
    const base = new MemCachePlugin({
      key: 'foobar-key',
      caches,
    });

    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      base,
    });

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      tokens: 'foobar',
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.deepStrictEqual(caches.get('foobar-key'), { data: 'foobar' });
  });

  it('read the cache from base', async () => {
    const baseCaches = new Map();
    const base = new MemCachePlugin({
      key: 'foobar-key',
      caches: baseCaches,
    });
    baseCaches.set('foobar-key', { data: 'foobar' });

    const caches = new Map();
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      base,
      caches,
    });

    const ctx = new MockTokenCacheContext({
    });
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.strictEqual(ctx.tokens, 'foobar');
    assert.deepStrictEqual(caches.get('foobar-key'), { data: 'foobar' });
  });

  it('read the cache from base is missing', async () => {
    const caches = new Map();
    const base = new MemCachePlugin({
      key: 'foobar-key',
      caches,
    });

    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      base,
    });

    const ctx = new MockTokenCacheContext({
    });
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, false);
    assert.strictEqual(ctx.tokens, '');
  });

  it('deletes the cache from base', async () => {
    const baseCaches = new Map();
    const base = new MemCachePlugin({
      key: 'foobar-key',
      caches: baseCaches,
    });
    baseCaches.set('foobar-key', 'foobar');

    const caches = new Map();
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      base,
      caches,
    });

    await p.deleteCache();
    assert.strictEqual(baseCaches.get('foobar-key'), undefined);
  });

  it('writes the metadata to base', async () => {
    const base = new FSCachePlugin({
      filePath: testFilePath,
    });
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      base,
    });

    await p.setPluginMetadata({ foo: 'bar' });
    assert.deepStrictEqual(JSON.parse(await fs.readFile(testFilePath, 'utf-8')), {
      cachePluginMetadata: {
        foo: 'bar',
      },
    });
  });

  it('reads the metadata from base', async () => {
    await fs.writeFile(testFilePath, JSON.stringify({
      access_token: '1234',
      cachePluginMetadata: {
        foo: 'bar',
      },
    }), 'utf-8');

    const base = new FSCachePlugin({
      filePath: testFilePath,
    });
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      base,
    });

    const meta = await p.getPluginMetadata();
    assert.deepStrictEqual(meta, {
      foo: 'bar',
    });
  });
});
