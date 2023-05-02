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
import { FSCacheManager, FSCachePlugin } from '../src/index.js';
import { MockTokenCacheContext } from './MockTokenCacheContext.js';

describe('FSCacheManager Test', () => {
  let testRoot;

  beforeEach(async () => {
    testRoot = path.resolve(__testdir, 'tmp', crypto.randomUUID());
    await fs.mkdir(testRoot, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testRoot, { recursive: true });
  });

  it('lists the cache keys', async () => {
    const mgr = new FSCacheManager({
      dirPath: testRoot,
      type: 'onedrive',
    });

    await fs.writeFile(path.resolve(testRoot, 'readme.txt'), 'hello', 'utf-8');
    await fs.writeFile(path.resolve(testRoot, 'auth-onedrive-content.json'), '', 'utf-8');
    await fs.writeFile(path.resolve(testRoot, 'auth-onedrive-index.json'), '', 'utf-8');

    const ret = await mgr.listCacheKeys();
    assert.deepStrictEqual(ret, ['content', 'index']);
  });

  it('lists the cache keys handles not found errors', async () => {
    const mgr = new FSCacheManager({
      dirPath: '/foo/bar',
      type: 'onedrive',
    });

    const ret = await mgr.listCacheKeys();
    assert.deepStrictEqual(ret, []);
  });

  it('lists the cache keys handles generic errors', async () => {
    const wrongPath = path.resolve(testRoot, 'readme.txt');
    const mgr = new FSCacheManager({
      dirPath: wrongPath,
      type: 'onedrive',
    });

    await fs.writeFile(wrongPath, 'hello', 'utf-8');
    await assert.rejects(mgr.listCacheKeys());
  });

  it('creates fs plugin', async () => {
    const mgr = new FSCacheManager({
      dirPath: testRoot,
      type: 'onedrive',
    });

    const p = await mgr.getCache('content');

    assert.ok(p instanceof FSCachePlugin);
    assert.strictEqual(p.filePath, path.resolve(testRoot, 'auth-onedrive-content.json'));
  });

  it('creates fs plugin and creates directory', async () => {
    const mgr = new FSCacheManager({
      dirPath: path.resolve(testRoot, 'sub'),
      type: 'onedrive',
    });

    const p = await mgr.getCache('content');

    assert.ok(p instanceof FSCachePlugin);
    assert.strictEqual(p.filePath, path.resolve(testRoot, 'sub', 'auth-onedrive-content.json'));
  });

  it('getCache() handles fs errors', async () => {
    const mgr = new FSCacheManager({
      dirPath: testRoot,
      type: 'onedrive',
    });
    mgr.dirPath = '\0hack';
    await assert.rejects(mgr.getCache('content'));
  });

  it('checks if cache exists', async () => {
    const mgr = new FSCacheManager({
      dirPath: path.resolve(testRoot, 'sub'),
      type: 'onedrive',
    });
    assert.strictEqual(await mgr.hasCache('content'), false);

    const p = await mgr.getCache('content');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      tokens: '{ "access_token": "1234" }',
    });
    await p.afterCacheAccess(ctx);

    assert.strictEqual(await mgr.hasCache('content'), true);
  });

  it('checks if cache exists handles errors', async () => {
    const mgr = new FSCacheManager({
      dirPath: path.resolve(testRoot, 'sub'),
      type: 'onedrive',
    });
    await assert.rejects(mgr.hasCache('\0conten'));
  });
});
