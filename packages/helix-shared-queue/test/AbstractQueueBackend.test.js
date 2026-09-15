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
import { AbstractQueueBackend } from '../src/AbstractQueueBackend.js';
import { QueueError } from '../src/QueueError.js';

class MinimalBackend extends AbstractQueueBackend {
  // eslint-disable-next-line class-methods-use-this -- fixed tag, like real backends' `name`
  get name() {
    return 'Minimal';
  }
}

describe('AbstractQueueBackend', () => {
  describe('_wrapError()', () => {
    it('wraps a raw error into a QueueError tagged with this.name', () => {
      const backend = new MinimalBackend();
      const raw = new Error('boom');
      // eslint-disable-next-line no-underscore-dangle -- exercising the protected helper directly
      const wrapped = backend._wrapError(raw, 'wrapped msg', { status: 500, code: 'X' });
      assert.ok(wrapped instanceof QueueError);
      assert.strictEqual(wrapped.message, 'wrapped msg');
      assert.strictEqual(wrapped.status, 500);
      assert.strictEqual(wrapped.code, 'X');
      assert.strictEqual(wrapped.backend, 'Minimal');
      assert.strictEqual(wrapped.cause, raw);
    });

    it('passes an already-QueueError through unchanged', () => {
      const backend = new MinimalBackend();
      const original = new QueueError('original msg', { status: 404, backend: 'Other' });
      // eslint-disable-next-line no-underscore-dangle -- exercising the protected helper directly
      const result = backend._wrapError(original, 'other msg', { status: 500 });
      assert.strictEqual(result, original);
      assert.strictEqual(result.message, 'original msg');
      assert.strictEqual(result.status, 404);
      assert.strictEqual(result.backend, 'Other');
    });
  });

  describe('mandatory primitives', () => {
    const backend = new AbstractQueueBackend();

    ['sendBatch', 'receiveBatch', 'deleteBatch'].forEach((method) => {
      it(`${method}() throws when not implemented`, async () => {
        await assert.rejects(backend[method](), new Error(`${method}() not implemented`));
      });
    });
  });
});
