/*
 * Copyright 2021 Adobe. All rights reserved.
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
import timing, { create } from '../src/timing-wrapper.js';

describe('Timing wrapper tests', () => {
  it('create() returns timer with update and report', () => {
    const timer = create();
    assert.strictEqual(typeof timer.update, 'function');
    assert.strictEqual(typeof timer.report, 'function');
  });

  it('timer.update() records steps and report() returns timing string', () => {
    const timer = create();
    const context = { log: { debug: () => {} } };
    timer.update('step1');
    timer.update('step2');
    const timingHeader = timer.report(context);
    assert.match(timingHeader, /total;dur=/);
    assert.match(timingHeader, /desc=step1/);
    assert.match(timingHeader, /desc=step2/);
  });

  it('serverTiming adds timer to context and sets server-timing header', async () => {
    const context = { log: { debug: () => {} } };
    const fakeHandler = async (req, ctx) => {
      ctx.timer.update('step1');
      return {
        headers: new Map(),
        body: 'ok',
      };
    };
    const wrapped = timing(fakeHandler);
    const resp = await wrapped({}, context);
    assert.ok(resp.headers.has('server-timing'));
    assert.match(resp.headers.get('server-timing'), /desc=step1/);
    assert.match(resp.headers.get('server-timing'), /total;dur=/);
  });

  it('serverTiming does not overwrite existing server-timing header', async () => {
    const context = { log: { debug: () => {} } };
    const fakeHandler = async () => {
      const headers = new Map();
      headers.set('server-timing', 'foo');
      return { headers, body: 'ok' };
    };
    const wrapped = timing(fakeHandler);
    const resp = await wrapped({}, context);
    assert.strictEqual(resp.headers.get('server-timing'), 'foo');
  });
});
