/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable no-restricted-syntax, guard-for-in */

/**
 * Turn any object into an iterator.
 * Takes objects that implement the iterator protocol.
 * Plain objects are treated as key-value stores and yield
 * a sequence of their key value bytes, represented as size-2 arrays.
 *
 * Any value that is allowed as a parameter for this function shall be
 * considered to be a `Sequence` for the purpose of this file.
 * This term shall be distinguished from `Iterable` in that iterables
 * must implement the iterator protocol `iterable[Symbol.iterator]()`.
 *
 * @param {Object|Iterable|Iterator} obj
 * @returns {Iterator}
 * @yields The data from the given elements
 */
const iter = (obj) => {
  function* objIter() {
    for (const key in obj) {
      yield [key, obj[key]];
    }
  }
  if (obj[Symbol.iterator]) {
    return obj[Symbol.iterator]();
  } if (obj.constructor === Object) {
    return objIter(obj);
  }
  throw new TypeError(`The iterator protocol is not implemented for ${obj} of type ${obj.constructor}`);
};

/**
 * Iterate over sequences: Apply the give function to
 * every element in the sequence
 *
 * @param {Sequence} seq Any sequence for which iter() is defined
 * @param {Function} fn Function taking a single parameter
 */
const each = (seq, fn) => {
  for (const val of iter(seq)) {
    fn(val);
  }
};

/**
 * Extend the given sequences with indexes:
 * Takes a sequence of values and generates
 * a sequence where each element is a pair [index, element];
 *
 * @param {Sequence} seq Any sequence for which iter() is defined
 * @returns {Iterator}
 */
function* enumerate(seq) {
  let idx = -1;
  for (const val of iter(seq)) {
    idx += 1;
    yield [idx, val];
  }
}

module.exports = { iter, each, enumerate };
