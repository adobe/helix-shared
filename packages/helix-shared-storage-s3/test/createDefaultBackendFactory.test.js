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
import { MirroringBackend } from '@adobe/helix-shared-storage';
import { createDefaultBackendFactory } from '../src/createDefaultBackendFactory.js';
import { S3Backend } from '../src/S3Backend.js';

describe('createDefaultBackendFactory()', () => {
  it('returns a MirroringBackend composing S3+R2 when R2 is not disabled', () => {
    const factory = createDefaultBackendFactory({
      CLOUDFLARE_ACCOUNT_ID: 'fake',
      CLOUDFLARE_R2_ACCESS_KEY_ID: 'fake',
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'fake',
    }, { log: console });
    const backend = factory('helix-code-bus');
    assert.ok(backend instanceof MirroringBackend);
    assert.strictEqual(backend.name, 'S3');
    assert.strictEqual(backend.bucketName, 'helix-code-bus');
  });

  it('returns a bare S3Backend when R2 is globally disabled', () => {
    const factory = createDefaultBackendFactory({ HELIX_STORAGE_DISABLE_R2: 'true' }, { log: console });
    const backend = factory('helix-code-bus');
    assert.ok(backend instanceof S3Backend);
    assert.strictEqual(backend.name, 'S3');
  });

  it('returns a bare S3Backend when R2 is disabled per-bucket', () => {
    const factory = createDefaultBackendFactory({
      CLOUDFLARE_ACCOUNT_ID: 'fake',
      CLOUDFLARE_R2_ACCESS_KEY_ID: 'fake',
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'fake',
    }, { log: console });
    const backend = factory('helix-code-bus', { disableR2: true });
    assert.ok(backend instanceof S3Backend);
  });
});
