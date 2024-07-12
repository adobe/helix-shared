/*
 * Copyright 2023 Adobe. All rights reserved.
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
import { encrypt } from '../src/index.js';
import { getCachePlugin } from '../src/getCachePlugin.js';
import { MockTokenCacheContext } from './MockTokenCacheContext.js';
import { Nock, toAuthContent } from './utils.js';

const DEFAULT_ENV = {
  AZURE_HELIX_SERVICE_CLIENT_ID: 'client-id',
  AZURE_HELIX_SERVICE_CLIENT_SECRET: 'client-secret',
};

describe('getCachePlugin tests', () => {
  let nock;
  let savedProcessEnv;
  beforeEach(() => {
    nock = new Nock();
    savedProcessEnv = process.env;
    process.env = {
      ...process.env,
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'fake-key-id',
      AWS_SECRET_ACCESS_KEY: 'fake-secret',
    };
  });

  afterEach(() => {
    nock.done();
    process.env = savedProcessEnv;
  });

  const contentBusId = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789a';

  it('uses derived opts if contentBusId is available', async () => {
    nock('https://helix-content-bus.s3.us-east-1.amazonaws.com')
      .head(`/${contentBusId}/.helix-auth/auth-onedrive-content.json`)
      .reply(200);

    const cachePlugin = await getCachePlugin({
      log: console,
      env: DEFAULT_ENV,
      contentBusId,
    }, 'onedrive');
    assert.ok(cachePlugin);
    assert.strictEqual(cachePlugin.location, `helix-content-bus/${contentBusId}/.helix-auth/auth-onedrive-content.json`);
  });

  it('contentBusId has precedence over owner', async () => {
    nock('https://helix-content-bus.s3.us-east-1.amazonaws.com')
      .head(`/${contentBusId}/.helix-auth/auth-onedrive-content.json`)
      .reply(200);

    const cachePlugin = await getCachePlugin({
      log: console,
      env: DEFAULT_ENV,
      contentBusId,
      owner: 'adobe',
    }, 'onedrive');
    assert.ok(cachePlugin);
    assert.strictEqual(cachePlugin.location, `helix-content-bus/${contentBusId}/.helix-auth/auth-onedrive-content.json`);
  });

  it('falls back to owner if contentBusId not found', async () => {
    nock('https://helix-content-bus.s3.us-east-1.amazonaws.com')
      .head(`/${contentBusId}/.helix-auth/auth-onedrive-content.json`)
      .reply(404);
    nock('https://helix-code-bus.s3.us-east-1.amazonaws.com')
      .head('/adobe/.helix-auth/auth-onedrive-content.json')
      .reply(200);

    const cachePlugin = await getCachePlugin({
      log: console,
      env: DEFAULT_ENV,
      contentBusId,
      owner: 'adobe',
    }, 'onedrive');
    assert.ok(cachePlugin);
    assert.strictEqual(cachePlugin.location, 'helix-code-bus/adobe/.helix-auth/auth-onedrive-content.json');
  });

  it('falls back to default if contentBusId and owner not found', async () => {
    nock('https://helix-content-bus.s3.us-east-1.amazonaws.com')
      .head(`/${contentBusId}/.helix-auth/auth-onedrive-content.json`)
      .reply(404);
    nock('https://helix-code-bus.s3.us-east-1.amazonaws.com')
      .head('/adobe/.helix-auth/auth-onedrive-content.json')
      .reply(404);

    const cachePlugin = await getCachePlugin({
      log: console,
      env: DEFAULT_ENV,
      contentBusId,
      owner: 'adobe',
    }, 'onedrive');
    assert.ok(cachePlugin);
    assert.strictEqual(cachePlugin.location, 'helix-content-bus/default/.helix-auth/auth-onedrive-content.json');
  });

  it('uses empty opts if contentBusId is not available', async () => {
    // "content-bus-id/.helix-auth/auth-onedrive-content.json"
    const cachePlugin = await getCachePlugin({
      log: console,
      env: DEFAULT_ENV,
      contentBusId: null,
    }, 'onedrive');
    assert.ok(cachePlugin);
    assert.strictEqual(cachePlugin.location, 'helix-content-bus/default/.helix-auth/auth-onedrive-content.json');
  });

  it('does not store back unmodified auth settings', async () => {
    nock('https://helix-content-bus.s3.us-east-1.amazonaws.com')
      .head(`/${contentBusId}/.helix-auth/auth-onedrive-content.json`)
      .twice()
      .reply(200)
      .get(`/${contentBusId}/.helix-auth/auth-onedrive-content.json?x-id=GetObject`)
      .reply(200, encrypt(contentBusId, JSON.stringify(toAuthContent('1234'))));

    const caches = new Map();

    // step 1: create plugin and read token from underlying S3 storage
    let cachePlugin = await getCachePlugin({
      log: console,
      env: DEFAULT_ENV,
      contentBusId,
      caches,
    }, 'onedrive');

    await cachePlugin.beforeCacheAccess(
      new MockTokenCacheContext({
        cacheHasChanged: true,
      }),
    );

    // step 2: verify cache has been filled
    assert.strictEqual(caches.size, 1);

    // step 3: create another plugin instance with the same cache
    cachePlugin = await getCachePlugin({
      log: console,
      env: DEFAULT_ENV,
      contentBusId,
      caches,
    }, 'onedrive');

    // step 4: read cache back into context
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
    });
    await cachePlugin.beforeCacheAccess(ctx);

    // step 5: and write cache back without changes
    const ret = await cachePlugin.afterCacheAccess(ctx);
    assert.strictEqual(ret, false);
  });
});
