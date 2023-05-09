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
import { getCachePlugin } from '../src/getCachePlugin.js';
import { Nock } from './utils.js';

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

  it('uses derived opts if contentBusId is available', async () => {
    const contentBusId = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789a';
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

  it('uses derived opts if owner is available', async () => {
    const contentBusId = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789a';
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

  it('falls back to contentBusId if owner not found', async () => {
    const contentBusId = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789a';
    nock('https://helix-code-bus.s3.us-east-1.amazonaws.com')
      .head('/adobe/.helix-auth/auth-onedrive-content.json')
      .reply(404);
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
});
