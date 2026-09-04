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
import { Storage } from '@adobe/helix-shared-storage';
import { StorageAzure } from '../src/StorageAzure.js';

const env = {
  HLX_AZURE_STORAGE_ACCOUNT_NAME: 'fake',
  HLX_AZURE_STORAGE_ACCOUNT_KEY: 'ZmFrZQ==',
};

describe('StorageAzure', () => {
  it('fromContext() caches an instance that is both StorageAzure and Storage', () => {
    const context = { env, log: console, attributes: {} };
    const stor = StorageAzure.fromContext(context);
    assert.ok(stor instanceof StorageAzure);
    assert.ok(stor instanceof Storage);
    assert.strictEqual(context.attributes.storage, stor);
  });

  it('fromContext() returns the same cached instance on repeated calls', () => {
    const context = { env, log: console, attributes: {} };
    const first = StorageAzure.fromContext(context);
    const second = StorageAzure.fromContext(context);
    assert.strictEqual(first, second);
  });

  it('forwards opts without requiring the caller to pass backendFactory directly', () => {
    const context = { env, log: console, attributes: {} };
    const stor = StorageAzure.fromContext(context, { bucketNames: JSON.stringify({ code: 'my-code-bus' }) });
    assert.strictEqual(stor.codeBus().bucket, 'my-code-bus');
  });
});
