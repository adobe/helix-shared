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
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon from 'sinon';
import processQueue from '../src/process-queue.js';

const nop = () => {};

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

async function* sleepOver(nights) {
  for (let i = 0; i < nights; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
    yield i;
  }
}

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

  async function recordTask(task) {
    task.timestamps.push(Date.now());
    return task;
  }

  beforeEach(() => {
    maxConcurrency = 0;
    concurrency = 0;
  });

  it('works with empty queue', async () => {
    const result = await processQueue([], nop);
    assert.deepStrictEqual(result, []);
  });

  it('works with non async function', async () => {
    const result = await processQueue([5], (n, queue, results) => {
      results.push(n * n);
    });
    assert.deepStrictEqual(result, [25]);
  });

  it('return values are added as results', async () => {
    const result = await processQueue([1, 2, 3, 4], (n) => n * n);
    assert.deepStrictEqual(result, [1, 4, 9, 16]);
  });

  it('return values are added as results (async)', async () => {
    const result = await processQueue([1, 2, 3, 4], async (n) => n * n);
    assert.deepStrictEqual(result, [1, 4, 9, 16]);
  });

  it('processes queue', async () => {
    const result = await processQueue([{
      time: 100,
      number: 4,
    }, {
      time: 50,
      number: 3,
    }], testFunction);
    assert.deepStrictEqual(result, [9, 16]);
  });

  it('processes queue can add more items to the queue', async () => {
    const result = await processQueue([2, 7, 3, 10], (n, queue, results) => {
      if (n > 0) {
        queue.push(n - 1);
      } else {
        results.push(0);
      }
    });
    assert.deepStrictEqual(result, [0, 0, 0, 0]);
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
    assert.deepStrictEqual(result.sort((a, b) => a - b), expected);
    assert.strictEqual(maxConcurrency, 8);
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
    assert.deepStrictEqual(result, [0, 1, 4, 9, 16]);
    assert.deepStrictEqual(maxConcurrency, 5);
  });

  it('iterators respect concurrency', async () => {
    const result = await processQueue(fibonacci(), testFunction, 4);
    assert.deepStrictEqual(result, [4, 9, 25, 64, 169, 441, 1156, 3025, 7921]);
    assert.deepStrictEqual(maxConcurrency, 4);
  });

  it('iterators add return value to result', async () => {
    const result = await processQueue(fibonacci(), ({ number }) => number);
    assert.deepStrictEqual(result, [2, 3, 5, 8, 13, 21, 34, 55, 89]);
  });

  it('async iterators add return value to results', async () => {
    const result = await processQueue(await sleepOver(5), (number) => number);
    assert.deepStrictEqual(result, [0, 1, 2, 3, 4]);
  });

  describe('Rate Limiting', () => {
    it('spacing between tasks is consistent and respects maxConcurrent', async () => {
      const clock = sinon.useFakeTimers();

      const timestamps = [];

      let currentConcurrency = 0;
      let maxConcurrencyObserved = 0;

      async function simulateLongRunningTask() {
        timestamps.push(clock.now);

        currentConcurrency += 1;
        maxConcurrencyObserved = Math.max(maxConcurrencyObserved, currentConcurrency);

        // Simulate task processing time (2000ms) so tasks overlap.
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 2000));

        currentConcurrency -= 1;
      }

      const numTasks = 100;
      const tasks = Array.from({ length: numTasks }, (_, i) => ({ number: i }));

      const options = {
        maxConcurrent: 20,
        limit: 50,
        interval: 30000,
      };

      const processPromise = processQueue(tasks, simulateLongRunningTask, options);

      // 600ms spacing between task starts, 100 tasks should span roughly 100 * 600 = 60000ms.
      // Add a bit more to allow all tasks to have been started.
      await clock.tickAsync(65000);
      await processPromise;
      clock.restore();

      // calculate differences between start times.
      const differences = [];
      for (let i = 1; i < timestamps.length; i += 1) {
        differences.push(timestamps[i] - timestamps[i - 1]);
      }

      // compute the average spacing, should be 600ms
      let sum = 0;
      for (const diff of differences) {
        sum += diff;
      }
      const averageSpacing = sum / differences.length;

      // average spacing should be 600ms
      assert(averageSpacing === 600);

      // Max concurrency should be greater than 1 (tasks overlapped)
      // and does not exceed the specified maxConcurrent (20).
      assert(maxConcurrencyObserved > 1);
      assert(maxConcurrencyObserved <= 20);
    });

    it('check that token release partially refunds wait time in processQueue, reducing start delay for some tasks', async () => {
      const clock = sinon.useFakeTimers();
      const timestamps = [];

      async function testTask(task, queue, results, token) {
        timestamps.push(clock.now);
        if (task.number % 5 === 4) {
          token.release();
        }
      }

      const numTasks = 20;
      const tasks = Array.from({ length: numTasks }, (_, i) => ({ number: i }));

      // Copy the tasks for reference since processQueue consumes the array.
      const originalTasks = Array.from(tasks);

      const options = {
        maxConcurrent: 1,
        limit: 50,
        interval: 30000,
      };

      const processPromise = processQueue(tasks, testTask, options);

      // Advance the fake clock by 15000ms to allow all 20 tasks to start.
      await clock.tickAsync(15000);

      await processPromise;
      clock.restore();

      // Compute the difference/gap between task start times.
      const differences = [];
      for (let i = 1; i < timestamps.length; i += 1) {
        differences.push(timestamps[i] - timestamps[i - 1]);
      }

      differences.forEach((diff, i) => {
        const precedingTask = originalTasks[i];
        if (precedingTask.number % 5 === 4) {
          // gap should be < 100ms
          assert(
            diff < 100,
            `Expected gap after task ${precedingTask.number} (refunded token) to be < 100ms, but got ${differences[i]}ms`,
          );
        } else {
          // gap should be around 600ms
          assert(
            Math.abs(diff - 600) < 100,
            `Expected gap after task ${precedingTask.number} to be around 600ms, but got ${differences[i]}ms`,
          );
        }
      });
    });

    it('check that released tokens do not count against the limit', async () => {
      const clock = sinon.useFakeTimers();
      const timestamps = [];

      async function refundTask(task, queue, results, token) {
        timestamps.push(clock.now);

        // Refund the first 25 tasks.
        if (task.number < 25) {
          token.release();
        }
      }

      const numTasks = 100;
      const tasks = Array.from({ length: numTasks }, (_, i) => ({ number: i }));

      const options = {
        maxConcurrent: 1,
        limit: 50,
        interval: 30000,
      };

      const processPromise = processQueue(tasks, refundTask, options);

      // Advance the fake clock by 30000ms (first window)
      await clock.tickAsync(3000000);
      await processPromise;
      clock.restore();

      // We released the first 25 tokens, so we expect 75 tasks in the first window
      // 50 limit + the 25 released tokens.
      const tasksInFirstWindow = timestamps.filter((t) => t <= 30000).length;
      assert(tasksInFirstWindow === 75);
    });

    it('processes queue while enforcing rate limits', async () => {
      // Use fake timers to simulate time passing
      const clock = sinon.useFakeTimers();
      const timestamps = [];

      async function recordTestFunction(task) {
        timestamps.push(clock.now);
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, task.time));
        return task.number * task.number;
      }

      // Create 100 tasks with a duration of 100ms each
      const tasks = [];
      for (let i = 0; i < 100; i += 1) {
        tasks.push({ time: 100, number: i });
      }

      // Concurrency of 2, 20 operations per 30000ms (30 seconds)
      const processPromise = processQueue(tasks, recordTestFunction, {
        maxConcurrent: 2,
        limit: 20,
        interval: 30000,
      });

      // Increase time enough so that all tasks can complete
      await clock.tickAsync(160000);

      const result = await processPromise;
      clock.restore();

      assert.strictEqual(result.length, 100);

      // With the rate limit, tasks 0-19 should start near time 0
      // Tasks 20-39 should not start until after 30000ms
      // Tasks 40-59 after 60000ms
      // Tasks 60-79 after 90000ms
      // Tasks 80-99 after 120000ms
      assert(timestamps[20] >= 30000);
      assert(timestamps[40] >= 60000);
      assert(timestamps[60] >= 90000);
      assert(timestamps[80] >= 120000);
    });

    it('rate limited queue can be aborted', async () => {
      const abortController = new AbortController();
      const timestamps = [];

      async function recordTestFunction(task) {
        if (task.number === 50) {
          abortController.abort();
          return;
        }
        timestamps.push(task.number);

        // eslint-disable-next-line no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 1));

        // eslint-disable-next-line consistent-return
        return true;
      }

      // Create 100 tasks with a duration of 100ms each
      const tasks = [];
      for (let i = 0; i < 100; i += 1) {
        tasks.push({ number: i });
      }

      const result = await processQueue(tasks, recordTestFunction, {
        maxConcurrent: 7,
        abortController,
      });

      // since the 50th test is aborted, tasks 0 - 49 should complete
      assert.strictEqual(result.length, 50);

      // Tasks 50-99 should never start
      for (let i = 0; i < 100; i += 1) {
        if (i < 50) {
          assert.strictEqual(timestamps[i], i);
        } else {
          assert.strictEqual(timestamps[i], undefined);
        }
      }
    });

    it('falls back to no rate limit if partial options', async () => {
      const timestamps = [];
      const tasks = [
        { id: 1, timestamps },
        { id: 2, timestamps },
        { id: 3, timestamps },
      ];

      await processQueue(tasks, recordTask, 10, { maxRequests: 2 });
      assert.strictEqual(timestamps.length, 3);

      const delay = timestamps[2] - timestamps[0];
      assert(delay < 100, `Expected delay < 100ms, got ${delay}ms`);
    });

    it('falls back to no rate limit if empty rate limit options are provided', async () => {
      const timestamps = [];
      const tasks = [
        { id: 1, timestamps },
        { id: 2, timestamps },
        { id: 3, timestamps },
      ];

      await processQueue(tasks, recordTask, 10, {});
      assert.strictEqual(timestamps.length, 3);

      const delay = timestamps[2] - timestamps[0];
      assert(delay < 100, `Expected delay < 100ms, got ${delay}ms`);
    });

    it('throws error if invalid rate limit options are provided', async () => {
      const timestamps = [];
      const tasks = [
        { id: 1, timestamps },
        { id: 2, timestamps },
        { id: 3, timestamps },
      ];

      await assert.rejects(processQueue(tasks, recordTask, 'invalid'));
    });
  });
});
