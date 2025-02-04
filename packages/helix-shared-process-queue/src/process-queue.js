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

import { sleep } from '@adobe/helix-shared-async';

/**
 * Simple dequeing iterator.
 * @param queue
 * @returns {Generator<*, void, *>}
 */
function* dequeue(queue) {
  while (queue.length) {
    yield queue.shift();
  }
}

/**
 * Creates a token bucket rate limiter.
 *
 * The token bucket algorithm controls the rate of operations by maintaining a "bucket"
 * that holds a fixed number of tokens. Each operation that wishes to proceed must first
 * acquire a token. The bucket is initially filled with `limit` tokens and is refilled
 * back to that level after every `interval` milliseconds.
 *
 * The returned async function, `waitForToken`, implements this logic:
 * - It checks if enough time has elapsed since the last refill. If so, it refills the bucket
 * - If a token is available, it decrements the token count and returns immediately
 * - If no tokens are available, it waits for a short period before trying to refill
 *
 * This guarantes that no more than `limit` operations are performed within any
 * given `interval`, thus enforcing the specified rate limit.
 *
 * @param {number} limit Maximum tokens (operations) allowed per interval
 * @param {number} interval Time period in ms after which the token bucket is refilled
 * @returns {Function} An async function that waits until a token is available
 */
function createRateLimiter(limit, interval) {
  let numTokens = limit;
  let lastRefill = Date.now();

  return async function waitForToken() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const now = Date.now();

      // Refill tokens if the interval has passed
      const delta = now - lastRefill;
      if (delta >= interval) {
        numTokens = limit;
        lastRefill = now;
      }

      // If a token is available, consume one and exit
      if (numTokens > 0) {
        numTokens -= 1;
        return;
      }

      // Else, wait before checking again
      // eslint-disable-next-line no-await-in-loop
      await sleep(interval - delta);
    }
  };
}

/**
 * Processes the given queue concurrently, optionally enforcing rate limits via a Token Bucket.
 * The handler function may add more items to the queue as needed.
 *
 * @param {Iterable|Array} queue A list of tasks
 * @param {ProcessQueueHandler} fn A handler function `fn(task:any, queue:array, results:array)`
 * @param {RateLimitOptions|number} [rateLimitOptions=null] Optional rate limiting options
 * @returns {Promise<Array>} the results
 */
export default async function processQueue(
  queue,
  fn,
  rateLimitOptions,
) {
  if (typeof queue !== 'object') {
    throw Error('invalid queue argument: iterable expected');
  }

  if (rateLimitOptions !== undefined && typeof rateLimitOptions !== 'object' && typeof rateLimitOptions !== 'number') {
    throw Error('invalid rate limit options argument: object or number expected');
  }

  const {
    limit,
    interval,
    maxConcurrent = 8,
    abortSignal,
  } = typeof rateLimitOptions === 'object'
    ? rateLimitOptions
    : { maxConcurrent: rateLimitOptions || 8 };

  const waitForToken = (limit > 0 && interval > 0)
    ? createRateLimiter(limit, interval, abortSignal)
    : async () => {};

  const running = [];
  const results = [];

  const handler = (entry) => {
    const task = fn(entry, queue, results);
    if (task?.then) {
      running.push(task);
      task
        .then((r) => {
          if (r !== undefined) {
            results.push(r);
          }
        })
        .catch(() => {})
        .finally(() => {
          running.splice(running.indexOf(task), 1);
        });
    } else if (task !== undefined) {
      results.push(task);
    }
  };

  const iter = Array.isArray(queue)
    ? dequeue(queue)
    : queue;
  if (!iter || !('next' in iter)) {
    throw Error('invalid queue argument: iterable expected');
  }

  for await (const value of iter) {
    await waitForToken();

    if (abortSignal?.aborted) {
      return results;
    }

    while (running.length >= maxConcurrent) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.race(running);
    }
    handler(value);
  }
  // wait until remaining tasks have completed
  await Promise.all(running);
  return results;
}
