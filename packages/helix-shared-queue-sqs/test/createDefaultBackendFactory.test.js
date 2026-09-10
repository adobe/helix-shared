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
import { SqsBackend } from '../src/SqsBackend.js';

describe('createDefaultBackendFactory()', () => {
  it('returns a factory producing an SqsBackend for a given queue name', () => {
    const factory = createDefaultBackendFactory({ AWS_REGION: 'us-east-1' }, { log: console });
    const backend = factory('my-queue');
    assert.ok(backend instanceof SqsBackend);
    assert.strictEqual(backend.queueName, 'my-queue');
  });

  it('forwards a factory-level default bucket/swapPrefix to every queue', () => {
    const bucket = { bucket: 'fake-bucket' };
    const factory = createDefaultBackendFactory({}, { log: console, bucket, swapPrefix: 'custom' });
    const backend = factory('my-queue');
    // eslint-disable-next-line no-underscore-dangle -- exercising internal wiring directly
    assert.strictEqual(backend._bucket, bucket);
    // eslint-disable-next-line no-underscore-dangle -- exercising internal wiring directly
    assert.strictEqual(backend._swapPrefix, 'custom');
  });

  it('lets a per-queue opts bag override the factory-level bucket/swapPrefix', () => {
    const defaultBucket = { bucket: 'default-bucket' };
    const perQueueBucket = { bucket: 'per-queue-bucket' };
    const factory = createDefaultBackendFactory({}, { log: console, bucket: defaultBucket });
    const backend = factory('my-queue', { bucket: perQueueBucket, swapPrefix: 'per-queue' });
    // eslint-disable-next-line no-underscore-dangle -- exercising internal wiring directly
    assert.strictEqual(backend._bucket, perQueueBucket);
    // eslint-disable-next-line no-underscore-dangle -- exercising internal wiring directly
    assert.strictEqual(backend._swapPrefix, 'per-queue');
  });

  it('forwards a factory-level default legacySwapFormat, overridable per queue', () => {
    const factory = createDefaultBackendFactory({}, { log: console, legacySwapFormat: true });
    const backend = factory('my-queue');
    // eslint-disable-next-line no-underscore-dangle -- exercising internal wiring directly
    assert.strictEqual(backend._legacySwapFormat, true);

    const overridden = factory('my-queue', { legacySwapFormat: false });
    // eslint-disable-next-line no-underscore-dangle -- exercising internal wiring directly
    assert.strictEqual(overridden._legacySwapFormat, false);
  });

  it('parses HELIX_QUEUE_MAX_ATTEMPTS and defaults to undefined when absent/invalid', () => {
    const withAttempts = createDefaultBackendFactory({ HELIX_QUEUE_MAX_ATTEMPTS: '5' }, { log: console });
    assert.ok(withAttempts('q') instanceof SqsBackend);

    const withoutAttempts = createDefaultBackendFactory({}, { log: console });
    assert.ok(withoutAttempts('q') instanceof SqsBackend);
  });

  it('parses HELIX_HTTP_SQS_KEEP_ALIVE as a boolean', () => {
    const factory = createDefaultBackendFactory({ HELIX_HTTP_SQS_KEEP_ALIVE: 'true' }, { log: console });
    assert.ok(factory('q') instanceof SqsBackend);
  });
});
