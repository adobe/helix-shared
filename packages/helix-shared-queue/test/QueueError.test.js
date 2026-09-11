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
import { QueueError } from '../src/QueueError.js';

describe('QueueError', () => {
  it('sets message/name/status/code/backend/cause', () => {
    const cause = new Error('root cause');
    const err = new QueueError('something failed', {
      status: 404, code: 'QueueDoesNotExist', backend: 'SQS', cause,
    });
    assert.ok(err instanceof Error);
    assert.strictEqual(err.name, 'QueueError');
    assert.strictEqual(err.message, 'something failed');
    assert.strictEqual(err.status, 404);
    assert.strictEqual(err.code, 'QueueDoesNotExist');
    assert.strictEqual(err.backend, 'SQS');
    assert.strictEqual(err.cause, cause);
  });

  it('leaves status/code/backend/cause undefined when not given', () => {
    const err = new QueueError('plain failure');
    assert.strictEqual(err.status, undefined);
    assert.strictEqual(err.code, undefined);
    assert.strictEqual(err.backend, undefined);
    assert.strictEqual(err.cause, undefined);
  });
});
