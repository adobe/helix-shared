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
 * Creates a rate limiter that enforces an even spacing between task executions using a
 * sliding window algorithm.
 *
 * The limiter calculates the required delay between tasks as `interval / limit` and
 * ensures that each token is only granted permission to proceed after this
 * minimum delay. It keeps track of the time when the last token was issued and,
 * upon each request, waits if necessary to maintain the steady rate.
 *
 * It returns a token object with a `release()` method that can be called to refund the token
 * if the task didn't actually consume a resource (for example, when a resource is not modified).
 *
 * @param {number} limit Maximum tokens (operations) allowed per interval
 * @param {number} interval Time period in ms over which `limit` tokens are permitted.
 * @returns {Function} An async function that waits until a token is available
 * and returns a token object.
 */
function createRateLimiter(limit, interval) {
  // Calculate how much time should elapse between tasks.
  const perTaskInterval = interval / limit;
  let lastTokenTime = Date.now();

  return async function waitForToken() {
    const now = Date.now();
    // Determine the earliest time the next token can be issued.
    // Using max we prevent scheduling tasks in the past if there's been a long gap
    const nextAllowedTime = Math.max(lastTokenTime + perTaskInterval, now);
    const waitTime = nextAllowedTime - now;
    if (waitTime > 0) {
      await sleep(waitTime);
    }
    // Update lastTokenTime to reflect when this token was granted.
    lastTokenTime = nextAllowedTime;

    // Return a token object that allows "releasing" the token if needed.
    let refunded = false;
    return {
      /**
       * Calling release() refunds the token by reducing the delay for subsequent tokens.
       * Useful when a task did not consume a resource (unmodified resource)
       * and should not count against the rate limit.
       */
      release() {
        if (!refunded) {
          // Refund token: rewind lastTokenTime by perTaskInterval
          lastTokenTime = Date.now() - perTaskInterval;
          refunded = true;
        }
      },
    };
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
    abortController,
  } = typeof rateLimitOptions === 'object'
    ? rateLimitOptions
    : { maxConcurrent: rateLimitOptions || 8 };

  const waitForToken = (limit > 0 && interval > 0)
    ? createRateLimiter(limit, interval)
    : async () => {};

  const running = [];
  const results = [];

  const handler = (entry, token) => {
    const task = fn(entry, queue, results, token);
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
    const token = await waitForToken();

    if (abortController?.signal?.aborted) {
      return results;
    }

    while (running.length >= maxConcurrent) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.race(running);
    }
    handler(value, token);
  }
  // wait until remaining tasks have completed
  await Promise.all(running);
  return results;
}
