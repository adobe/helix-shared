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
import { toAuthContent } from './utils.js';

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
    const data = toAuthContent('1234');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data,
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.deepStrictEqual(caches.get('foobar-key'), { data: JSON.stringify(data) });
    assert.strictEqual(p.location, 'foobar-key');
  });

  it('read/writes the cache w/o base with global cache', async () => {
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
    });

    const data = toAuthContent('1234');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data,
    });

    await p.afterCacheAccess(ctx);
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.strictEqual(ctx.token, '1234');
  });

  it('handles errors when updating the token cache', async () => {
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
    });

    const data = toAuthContent('1234');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data,
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

    const data = toAuthContent('1234');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: false,
      data,
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, false);
    assert.strictEqual(caches.get('foobar-key'), undefined);
  });

  it('ignores if value passed has empty Account key', async () => {
    const caches = new Map();
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      caches,
    });

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data: { Account: {}, AccessToken: {} },
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, false);
    assert.deepStrictEqual(caches.get('foobar-key'), undefined);
  });

  it('ignores if value passed has no Account key at all', async () => {
    const caches = new Map();
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      caches,
    });

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data: { AccessToken: {} },
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, false);
    assert.deepStrictEqual(caches.get('foobar-key'), undefined);
  });

  it('writes the cache w/o base with local cache can delete', async () => {
    const caches = new Map();
    const p = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      caches,
    });

    const data = toAuthContent('1234');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data,
    });
    await p.afterCacheAccess(ctx);
    assert.deepStrictEqual(caches.get('foobar-key'), { data: JSON.stringify(data) });
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

    const data = toAuthContent('1234');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data,
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.deepStrictEqual(caches.get('foobar-key'), { data: JSON.stringify(data) });
  });

  it('read the cache from base', async () => {
    const baseCaches = new Map();
    const base = new MemCachePlugin({
      key: 'foobar-key',
      caches: baseCaches,
    });
    const data = toAuthContent('1234');
    baseCaches.set('foobar-key', { data: JSON.stringify(data) });

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
    assert.strictEqual(ctx.token, '1234');
    assert.deepStrictEqual(caches.get('foobar-key'), { data: JSON.stringify(data) });
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
    assert.strictEqual(ctx.token, '');
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

  it('updates the data w/o losing metadata (fs-cache)', async () => {
    await fs.writeFile(testFilePath, JSON.stringify({
      ...toAuthContent('1234'),
      cachePluginMetadata: {
        foo: 'bar',
      },
    }), 'utf-8');

    const b1 = new FSCachePlugin({
      filePath: testFilePath,
    });
    const p1 = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      base: b1,
    });

    const meta = await p1.getPluginMetadata();
    assert.deepStrictEqual(meta, {
      foo: 'bar',
    });

    const b2 = new FSCachePlugin({
      filePath: testFilePath,
    });
    const p2 = new MemCachePlugin({
      log: console,
      key: 'foobar-key',
      base: b2,
    });
    const data = toAuthContent('2345');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data,
    });
    const ret = await p2.afterCacheAccess(ctx);
    assert.strictEqual(ret, true);

    assert.deepStrictEqual(JSON.parse(await fs.readFile(testFilePath, 'utf-8')), {
      ...data,
      cachePluginMetadata: {
        foo: 'bar',
      },
    });
  });
});
