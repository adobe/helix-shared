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
const processQueue = require('../src/process-queue.js');

const nop = () => {};

describe('Process Queue', () => {
  let concurrency = 0;
  let maxConcurrency = 0;

  async function testFunction({ time, number, error }, queue, results) {
    concurrency += 1;
    maxConcurrency = Math.max(maxConcurrency, concurrency);
    await new Promise((resolve) => {
      setTimeout(resolve, time);
    });
    concurrency -= 1;
    if (error) {
      throw error;
    }
    results.push(number * number);
  }

  beforeEach(() => {
    maxConcurrency = 0;
    concurrency = 0;
  });

  it('works with empty queue', async () => {
    const result = await processQueue([], nop);
    assert.deepEqual(result, []);
  });

  it('works with non async function', async () => {
    const result = await processQueue([5], (n, queue, results) => results.push(n * n));
    assert.deepEqual(result, [25]);
  });

  it('processes queue', async () => {
    const result = await processQueue([{
      time: 100,
      number: 4,
    }, {
      time: 50,
      number: 3,
    }], testFunction);
    assert.deepEqual(result, [9, 16]);
  });

  it('processes queue can add more items to the queue', async () => {
    const result = await processQueue([2, 7, 3, 10], (n, queue, results) => {
      if (n > 0) {
        queue.push(n - 1);
      } else {
        results.push(0);
      }
    });
    assert.deepEqual(result, [0, 0, 0, 0]);
  });

  it('respects concurrency', async () => {
    const tasks = [];
    const expected = [];
    for (let i = 0; i < 32; i += 1) {
      tasks.push({
        time: 5,
        number: i,
      });
      expected.push(i * i);
    }
    const result = await processQueue(tasks, testFunction);
    assert.deepEqual(result.sort((a, b) => a - b), expected);
    assert.equal(maxConcurrency, 8);
  });

  it('aborts queue on early error', async () => {
    await assert.rejects(processQueue([{
      time: 100,
      number: 4,
    }, {
      time: 50,
      number: 3,
      error: new Error('aborted'),
    }], testFunction));
  });

  it('rejects error for non object', async () => {
    await assert.rejects(processQueue(1), Error('invalid queue argument: iterable expected'));
  });

  it('rejects error for non iterable', async () => {
    await assert.rejects(processQueue({ }), Error('invalid queue argument: iterable expected'));
  });

  it('works with iterators', async () => {
    function* counter() {
      for (let i = 0; i < 5; i += 1) {
        yield {
          time: i + 10 + 5,
          number: i,
        };
      }
    }

    const result = await processQueue(counter(), testFunction);
    assert.deepEqual(result, [0, 1, 4, 9, 16]);
    assert.deepEqual(maxConcurrency, 5);
  });

  it('iterators respect concurrency', async () => {
    function* fibonacci() {
      let a = 1;
      let b = 1;
      while (a < 50) {
        const c = a + b;
        a = b;
        b = c;
        yield {
          time: 10,
          number: c,
        };
      }
    }

    const result = await processQueue(fibonacci(), testFunction, 4);
    assert.deepEqual(result, [4, 9, 25, 64, 169, 441, 1156, 3025, 7921]);
    assert.deepEqual(maxConcurrency, 4);
  });
});
