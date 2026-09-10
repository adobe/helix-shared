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
import { ServiceBusBackend } from '../src/ServiceBusBackend.js';

const FAKE_CONNECTION_STRING = 'Endpoint=sb://fake.servicebus.windows.net/;SharedAccessKeyName=fake;SharedAccessKey=ZmFrZQ==';

describe('createDefaultBackendFactory()', () => {
  it('returns a factory producing a ServiceBusBackend for a given queue name', () => {
    const factory = createDefaultBackendFactory(
      { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      { log: console },
    );
    const backend = factory('my-queue');
    assert.ok(backend instanceof ServiceBusBackend);
    assert.strictEqual(backend.queueName, 'my-queue');
  });

  it('forwards a factory-level default bucket/swapPrefix to every queue', () => {
    const bucket = { bucket: 'fake-bucket' };
    const factory = createDefaultBackendFactory(
      { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      { log: console, bucket, swapPrefix: 'custom' },
    );
    const backend = factory('my-queue');
    // eslint-disable-next-line no-underscore-dangle -- exercising internal wiring directly
    assert.strictEqual(backend._bucket, bucket);
    // eslint-disable-next-line no-underscore-dangle -- exercising internal wiring directly
    assert.strictEqual(backend._swapPrefix, 'custom');
  });

  it('lets a per-queue opts bag override the factory-level bucket/swapPrefix', () => {
    const defaultBucket = { bucket: 'default-bucket' };
    const perQueueBucket = { bucket: 'per-queue-bucket' };
    const factory = createDefaultBackendFactory(
      { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      { log: console, bucket: defaultBucket },
    );
    const backend = factory('my-queue', { bucket: perQueueBucket, swapPrefix: 'per-queue' });
    // eslint-disable-next-line no-underscore-dangle -- exercising internal wiring directly
    assert.strictEqual(backend._bucket, perQueueBucket);
    // eslint-disable-next-line no-underscore-dangle -- exercising internal wiring directly
    assert.strictEqual(backend._swapPrefix, 'per-queue');
  });
});
