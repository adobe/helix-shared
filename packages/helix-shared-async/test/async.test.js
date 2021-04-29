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

const assert = require('assert');
const { exec } = require('ferrum');
const { nextTick, sleep } = require('../src/async.js');

describe('Async Tests', () => {
  it('sleep', async () => {
    const t0 = new Date().getTime();
    await sleep(20);
    const t = new Date().getTime() - t0;
    assert(t >= 20 && t <= 40);
  });

  it('nextTick', async () => {
    let x = 42;
    const p = exec(async () => {
      await nextTick();
      assert.strictEqual(x, 23);
    });
    x = 23;
    await p;
  });
});
