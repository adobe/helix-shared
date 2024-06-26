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
import { FSCachePlugin } from '../src/index.js';
import { MockTokenCacheContext } from './MockTokenCacheContext.js';
import { toAuthContent } from './utils.js';

describe('FSCachePlugin Test', () => {
  let testRoot;
  let testFilePath;

  beforeEach(async () => {
    testRoot = path.resolve(__testdir, 'tmp', crypto.randomUUID());
    await fs.mkdir(testRoot, { recursive: true });
    testFilePath = path.resolve(testRoot, 'auth.json');
  });

  afterEach(async () => {
    await fs.rm(testRoot, { recursive: true });
  });

  it('writes the cache data to the filesystem', async () => {
    const p = new FSCachePlugin({
      filePath: testFilePath,
    });

    const data = toAuthContent('1234');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data,
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.deepStrictEqual(JSON.parse(await fs.readFile(testFilePath, 'utf-8')), data);
    assert.strictEqual(p.location, testFilePath);
  });

  it('writes the fresh cache data does not overwrite metadata', async () => {
    await fs.writeFile(testFilePath, JSON.stringify({
      ...toAuthContent('1234'),
      cachePluginMetadata: {
        foo: 'bar',
      },
    }), 'utf-8');

    const p = new FSCachePlugin({
      filePath: testFilePath,
    });

    const data = toAuthContent('2345');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data,
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.deepStrictEqual(JSON.parse(await fs.readFile(testFilePath, 'utf-8')), {
      ...data,
      cachePluginMetadata: {
        foo: 'bar',
      },
    });
    assert.strictEqual(p.location, testFilePath);
  });

  it('writes the plugin metadata cache data to the filesystem', async () => {
    const p = new FSCachePlugin({
      filePath: testFilePath,
    });

    const data = toAuthContent('2345');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data,
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.deepStrictEqual(JSON.parse(await fs.readFile(testFilePath, 'utf-8')), data);

    await p.setPluginMetadata({ foo: 'bar' });
    assert.deepStrictEqual(JSON.parse(await fs.readFile(testFilePath, 'utf-8')), {
      ...data,
      cachePluginMetadata: {
        foo: 'bar',
      },
    });
    assert.strictEqual(p.location, testFilePath);
  });

  it('writes the plugin metadata cache data pristine plugin', async () => {
    const p = new FSCachePlugin({
      filePath: testFilePath,
    });
    await p.setPluginMetadata({ foo: 'bar' });
    assert.deepStrictEqual(JSON.parse(await fs.readFile(testFilePath, 'utf-8')), {
      cachePluginMetadata: {
        foo: 'bar',
      },
    });
    assert.strictEqual(p.location, testFilePath);
  });

  it('can clear plugin metadata', async () => {
    const data = toAuthContent('2345');
    await fs.writeFile(testFilePath, JSON.stringify({
      ...data,
      cachePluginMetadata: {
        foo: 'bar',
      },
    }), 'utf-8');

    const p = new FSCachePlugin({
      filePath: testFilePath,
    });
    await p.setPluginMetadata();
    assert.deepStrictEqual(JSON.parse(await fs.readFile(testFilePath, 'utf-8')), data);
  });

  it('does not the cache data to the filesystem if context not changed', async () => {
    const p = new FSCachePlugin({
      filePath: testFilePath,
    });

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: false,
      data: toAuthContent('2345'),
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, false);
    try {
      await fs.lstat(testFilePath);
      assert.fail('file should not be written');
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
  });

  it('read cache data from the filesystem', async () => {
    const data = toAuthContent('1234');
    await fs.writeFile(testFilePath, JSON.stringify(data), 'utf-8');

    const p = new FSCachePlugin({
      filePath: testFilePath,
    });

    const ctx = new MockTokenCacheContext({
    });
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.strictEqual(ctx.token, '1234');
  });

  it('read cache plugin metadata from the filesystem', async () => {
    await fs.writeFile(testFilePath, JSON.stringify({
      ...toAuthContent('1234'),
      cachePluginMetadata: {
        foo: 'bar',
      },
    }), 'utf-8');

    const p = new FSCachePlugin({
      filePath: testFilePath,
    });

    const ctx = new MockTokenCacheContext({
    });
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.strictEqual(ctx.token, '1234');
    assert.deepStrictEqual(await p.getPluginMetadata(), {
      foo: 'bar',
    });
  });

  it('read cache plugin metadata from pristine plugin', async () => {
    await fs.writeFile(testFilePath, JSON.stringify({
      ...toAuthContent('1234'),
      cachePluginMetadata: {
        foo: 'bar',
      },
    }), 'utf-8');

    const p = new FSCachePlugin({
      filePath: testFilePath,
    });
    assert.deepStrictEqual(await p.getPluginMetadata(), {
      foo: 'bar',
    });
  });

  it('read cache data ignores nonexistent file', async () => {
    const p = new FSCachePlugin({
      filePath: testRoot,
    });

    const ctx = new MockTokenCacheContext({
    });
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, false);
    assert.strictEqual(ctx.token, '');
  });

  it('deletes the cache from the filesystem', async () => {
    await fs.writeFile(testFilePath, JSON.stringify(toAuthContent('1234')), 'utf-8');
    const p = new FSCachePlugin({
      filePath: testFilePath,
    });

    await p.deleteCache();
    try {
      await fs.lstat(testFilePath);
      assert.fail('file should be gone');
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
  });

  it('handles error during delete', async () => {
    const p = new FSCachePlugin({
      filePath: testFilePath,
    });
    await p.deleteCache();
  });
});
