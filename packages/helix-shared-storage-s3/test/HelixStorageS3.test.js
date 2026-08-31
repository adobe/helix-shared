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
import { HelixStorage } from '@adobe/helix-shared-storage';
import { HelixStorageS3 } from '../src/HelixStorageS3.js';

describe('HelixStorageS3', () => {
  it('exposes AWS_S3_SYSTEM_HEADERS, carried over unchanged from core\'s pre-refactor static', () => {
    assert.deepStrictEqual(HelixStorageS3.AWS_S3_SYSTEM_HEADERS, {
      'content-type': 'ContentType',
      'content-disposition': 'ContentDisposition',
      'content-encoding': 'ContentEncoding',
      'content-language': 'ContentLanguage',
    });
  });

  it('fromContext() caches an instance that is both HelixStorageS3 and HelixStorage', () => {
    const context = { env: { HELIX_STORAGE_DISABLE_R2: 'true' }, log: console, attributes: {} };
    const stor = HelixStorageS3.fromContext(context);
    assert.ok(stor instanceof HelixStorageS3);
    assert.ok(stor instanceof HelixStorage);
    assert.strictEqual(context.attributes.storage, stor);
  });

  it('fromContext() returns the same cached instance on repeated calls', () => {
    const context = { env: { HELIX_STORAGE_DISABLE_R2: 'true' }, log: console, attributes: {} };
    const first = HelixStorageS3.fromContext(context);
    const second = HelixStorageS3.fromContext(context);
    assert.strictEqual(first, second);
  });

  it('forwards opts without requiring the caller to pass backendFactory directly', () => {
    const context = { env: { HELIX_STORAGE_DISABLE_R2: 'true' }, log: console, attributes: {} };
    const stor = HelixStorageS3.fromContext(context, { bucketNames: JSON.stringify({ code: 'my-code-bus' }) });
    assert.strictEqual(stor.codeBus().bucket, 'my-code-bus');
  });
});
