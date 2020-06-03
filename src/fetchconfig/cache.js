/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const QuickLRU = require('quick-lru');

let lru = new QuickLRU({ maxSize: 1000 });

/**
 * Returns a memoized version of the function `fn`.
 * @param {function} fn a function to memoize
 * @param {object} opts caching options
 * @param {function} opts.hash a hash function to build a cache key.
 * The hash function will be called with the `fn` and a list of
 * it's arguments. A good hashing function will discard irrelevant
 * arguments and join the resulting arguments
 * @param {function} opts.cacheresult a predicate function that will be called
 * with the result of the function execution. Only when this function returns
 * `true` will the result be cached. The default is that all results are
 * cached.
 * @param {function} opts.cacheerror a predicate function that will be called
 * with the error that the function execution throws. Only when this
 * function returns `true` will the error be cached. The default is that
 * errors are never cached, so that each new invocation will be uncached.
 */
function cache(fn, opts = {}) {
  const {
    hash = (...args) => args.join(),
    cacheresult = () => true,
    cacheerror = () => false,
  } = opts;
  return async function cached(...args) {
    const key = hash(fn, ...args);
    if (lru.has(key)) {
      // if it's cached, just return it
      const result = lru.get(key);
      if (result.ok !== undefined) {
        return result.ok;
      }
      throw result.err;
    }
    try {
      // invoke the function
      const result = await fn(...args);
      if (cacheresult(result)) {
        // store the result under ok if permitted
        lru.set(key, { ok: result });
      }
      // and return the result
      return result;
    } catch (err) {
      if (cacheerror(err)) {
        // store the error under err if permitted
        lru.set(key, { err });
      }
      // and throw the error
      throw err;
    }
  };
}

/**
 * Resets the QuickLRU cache with new options. Existing cache entries
 * will be cleared.
 * @param {object} opts options
 * @param {integer} opts.maxSize maximum size of the cache
 */
cache.options = (opts) => {
  lru = new QuickLRU(opts);

  return cache;
};

module.exports = cache;
