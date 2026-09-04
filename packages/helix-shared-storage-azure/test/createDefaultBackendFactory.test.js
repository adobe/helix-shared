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
import { createDefaultBackendFactory } from '../src/createDefaultBackendFactory.js';
import { AzureBackend } from '../src/AzureBackend.js';

describe('createDefaultBackendFactory()', () => {
  it('builds a BlobServiceClient from a connection string', () => {
    const factory = createDefaultBackendFactory({
      HLX_AZURE_STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=fake;AccountKey=ZmFrZQ==;EndpointSuffix=core.windows.net',
    }, { log: console });
    const backend = factory('helix-code-bus');
    assert.ok(backend instanceof AzureBackend);
    assert.strictEqual(backend.name, 'Azure');
    assert.strictEqual(backend.bucketName, 'helix-code-bus');
  });

  it('prefers the connection string when both credential styles are set', () => {
    const factory = createDefaultBackendFactory({
      HLX_AZURE_STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=fake;AccountKey=ZmFrZQ==;EndpointSuffix=core.windows.net',
      HLX_AZURE_STORAGE_ACCOUNT_NAME: 'other',
      HLX_AZURE_STORAGE_ACCOUNT_KEY: 'ZmFrZQ==',
    }, { log: console });
    const backend = factory('helix-code-bus');
    assert.strictEqual(backend.client.accountName, 'fake');
  });

  it('falls back to account name/key when no connection string is set', () => {
    const factory = createDefaultBackendFactory({
      HLX_AZURE_STORAGE_ACCOUNT_NAME: 'fake',
      HLX_AZURE_STORAGE_ACCOUNT_KEY: 'ZmFrZQ==',
    }, { log: console });
    const backend = factory('helix-code-bus');
    assert.ok(backend instanceof AzureBackend);
    assert.strictEqual(backend.client.accountName, 'fake');
  });
});
