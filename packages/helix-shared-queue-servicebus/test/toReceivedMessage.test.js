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
import { toReceivedMessage } from '../src/toReceivedMessage.js';

describe('toReceivedMessage', () => {
  it('maps a full raw ServiceBusReceivedMessage-shaped message', () => {
    const raw = {
      messageId: 'mid-1', body: 'hello', sessionId: 'g1', deliveryCount: 2,
    };
    assert.deepStrictEqual(toReceivedMessage(raw), {
      id: 'mid-1',
      body: 'hello',
      groupId: 'g1',
      receiveCount: 2,
      raw,
    });
  });

  it('leaves groupId/receiveCount undefined when the raw message has none', () => {
    const raw = { messageId: 'mid-1', body: 'hello' };
    assert.deepStrictEqual(toReceivedMessage(raw), {
      id: 'mid-1',
      body: 'hello',
      groupId: undefined,
      receiveCount: undefined,
      raw,
    });
  });

  it('leaves id undefined when the raw message has no messageId', () => {
    const raw = { body: 'hello' };
    const message = toReceivedMessage(raw);
    assert.strictEqual(message.id, undefined);
  });

  it('does not mutate raw or detect a swap pointer -- that is ServiceBusBackend-only behavior', () => {
    const raw = { messageId: 'mid-1', body: JSON.stringify({ swapBucket: 'b', swapKey: 'k.json' }) };
    const message = toReceivedMessage(raw);
    assert.strictEqual(message.raw, raw);
    assert.strictEqual(raw.swapKey, undefined);
  });
});
