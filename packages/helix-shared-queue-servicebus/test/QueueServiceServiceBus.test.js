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
import { QueueService } from '@adobe/helix-shared-queue';
import { QueueServiceServiceBus } from '../src/QueueServiceServiceBus.js';

const FAKE_CONNECTION_STRING = 'Endpoint=sb://fake.servicebus.windows.net/;SharedAccessKeyName=fake;SharedAccessKey=ZmFrZQ==';

describe('QueueServiceServiceBus', () => {
  it('fromContext() caches an instance that is both QueueServiceServiceBus and QueueService', () => {
    const context = {
      env: { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      log: console,
      attributes: {},
    };
    const service = QueueServiceServiceBus.fromContext(context);
    assert.ok(service instanceof QueueServiceServiceBus);
    assert.ok(service instanceof QueueService);
    assert.strictEqual(context.attributes.queue, service);
  });

  it('fromContext() returns the same cached instance on repeated calls', () => {
    const context = {
      env: { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      log: console,
      attributes: {},
    };
    const first = QueueServiceServiceBus.fromContext(context);
    const second = QueueServiceServiceBus.fromContext(context);
    assert.strictEqual(first, second);
  });

  it('forwards opts without requiring the caller to pass backendFactory directly', () => {
    const context = {
      env: { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: FAKE_CONNECTION_STRING },
      log: console,
      attributes: {},
    };
    const service = QueueServiceServiceBus.fromContext(context);
    const queue = service.queue('my-queue');
    assert.strictEqual(queue.name, 'my-queue');
  });
});
