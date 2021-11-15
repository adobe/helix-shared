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

/**
 * Processes the given queue concurrently. The handler functions can add more items to the queue
 * if needed.
 *
 * @param {Iterable|Array} queue A list of tasks
 * @param {ProcessQueueHandler} fn A handler function `fn(task:any, queue:array, results:array)`
 * @param {number} [maxConcurrent = 8] Concurrency level
 * @returns the results
 */
async function processQueue(queue, fn, maxConcurrent = 8) {
  if (typeof queue !== 'object') {
    throw Error('invalid queue argument: iterable expected');
  }

  const running = [];
  const results = [];

  const handler = (entry) => {
    const task = fn(entry, queue, results);
    if (task && task.then) {
      running.push(task);
      task
        .catch(() => {})
        .finally(() => {
          running.splice(running.indexOf(task), 1);
        });
    }
  };

  // when using array, dequeue the entries
  if (Array.isArray(queue)) {
    while (queue.length || running.length) {
      if (running.length < maxConcurrent && queue.length) {
        handler(queue.shift());
      } else {
        // eslint-disable-next-line no-await-in-loop
        await Promise.race(running);
      }
    }
    return results;
  }

  if ('next' in queue) {
    let next = queue.next();
    while (!next.done || running.length) {
      if (running.length < maxConcurrent && !next.done) {
        handler(next.value);
        next = queue.next();
      } else {
        // eslint-disable-next-line no-await-in-loop
        await Promise.race(running);
      }
    }
    return results;
  }

  throw Error('invalid queue argument: iterable expected');
}

module.exports = processQueue;
