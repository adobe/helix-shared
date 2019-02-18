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

/**
 * Generic library for functional programming and advanced utilization
 * of es6 iterators.
 *
 * map, fold and so on...
 *
 * sequence.js functions are fully lazy and work with anything implementing
 * the iterator protocol; in addition, all functions also support treating
 * plain objects as sequences!
 *
 * The advantage of lazy implementations is that these functions work efficiently
 * with very long or even infinite sequences; assuming the following example is
 * given a sequence with ten billion elements, it would still start printing it's
 * output immediately and would not require creating another billion element array
 * as `Array.map` would do.
 * In practice the `x*2` would be calculated immediately before the result is printed.
 *
 * ```
 * each(map(sequence, (x) => x*2), console.log)
 * ```
 *
 * A disadvantage of lazyness is that side effects (e.g. a console.log inside a map())
 * are not executed, before the resulting sequence is actually being consumed by a
 * for loop or each() or fold() or similar functions…
 * So if you need to perform side effects, remember to use one of these
 * instead of lazy functions like map();
 *
 * sequence.js functions also support passing functions as the last argument:
 *
 * ```
 * each(seq, (elm) => {
 *   doSomething(elm);
 *   console.log(elm);
 * });
 * ```
 *
 * is much more readable then the example below; especially when you
 * are using multiple nested each/map/fold calls and the function bodies
 * grow long!
 *
 * ```
 * each((elm) => {
 *   doSomething(elm);
 *   console.log(elm);
 * }, seq);
 * ```
 *
 * Some of the utilities in here can *mostly* be implemented with
 * standard js6.
 * The emphasis here is on mostly, since sequence.js functions are
 * designed to have fewer edge cases that classical es6 pendants and
 * therefor make for a smoother coding experience.
 *
 * Examples:
 *
 * # Iteration
 *
 * ```
 * > for (const v of {foo: 42, bar: 23}) console.log(v);
 * TypeError: {(intermediate value)(intermediate value)} is not iterable
 * ```
 *
 * Does not work because plain objects do not implement the iterator protocol.
 *
 * # Replace With
 *
 * ```
 * > each([1,2,3,4], console.log);
 * 1
 * 2
 * 3
 * 4
 * ```
 *
 * or
 *
 * ```
 * > each({foo: 42}, v => console.log(v));
 * [ 'foo', 42 ]
 * ```
 *
 * or the following if the full power of a for loop is really required..
 *
 * ```
 * for (const v of iter({foo: 42})) console.log(v);
 *[ 'foo', 42 ]
 * ```
 *
 * # Array.forEach
 *
 * ````
 * > [1,2,3,4].forEach(console.log)
 * 1 0 [ 1, 2, 3, 4 ]
 * 2 1 [ 1, 2, 3, 4 ]
 * 3 2 [ 1, 2, 3, 4 ]
 * 4 3 [ 1, 2, 3, 4 ]
 * ```
 *
 * Unexpectedly yields a lot of output; that is because forEach also passes
 * the index in the array as well as the `thisArgument`.
 * This behaviour is often unexpected and forces us to define an intermediate
 * function.
 *
 * ## Replace With
 *
 * ```
 * > each([1,2,3,4], console.log);
 * 1
 * 2
 * 3
 * 4
 * ```
 *
 * If the index is really needed, `enumerate()` may be used:
 *
 * ```
 * each(enumerate([42, 23]), console.log)
 * [ 0, 42 ]
 * [ 1, 23 ]
 * ```
 *
 * As a sidenote this also effortlessly fits the concept of a key/value
 * container; the output of `enumerate([42, 23])` could easily passed
 * into `new Map(...)`;
 *
 * The full behaviour of for each
 */

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
    for (const key in obj) { // eslint-disable-line guard-for-in, no-restricted-syntax
      yield [key, obj[key]];
    }
  }
  if (obj[Symbol.iterator]) {
    return obj[Symbol.iterator]();
  } else if (obj.constructor === Object) {
    return objIter(obj);
  } else {
    throw new TypeError(`The iterator protocol is not implemented for ${obj} of type ${obj.constructor}`);
  }
};

class IteratorEnded extends Error {};

/// Extracts the next element from the iterator
const tryNext => (seq, fallback) {
  const {done, value} = iter(seq).next();
  return done ? fallback : value;
}

const next = (seq) => {
  const {done, value} = iter(seq).next();
  if (done) {
    throw new IteratorEnded();
  } else {
    return value;
  }
}

const tryFirst = tryNext;
const first = next;

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
 * Lazily transform all the values in a sequence.
 *
 * ```
 * into(map([1,2,3,4], n => n*2), Array) # [2,4,6,8]
 * ```
 *
 * @param {Sequence} seq Any sequence for which iter() is defined
 * @param {Function} fn The function that transforms all the values in the sequence
 * @returns {Iterator}
 */
function* map(seq, fn) {
  for (const val of iter(seq)) {
    yield fn(val);
  }
}


/**
 * Turns any sequence into a list.
 *
 * Short hand for Array.from(iter())
 */
const list = seq => Array.from(iter(seq));

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

/**
 * Flattens a sequence of sequences.
 *
 * ```
 * into(flat([[1,2], [3,4]]), Array) # [1,2,3,4]
 * into(flat({foo: 42}), Array) # ["foo", 42]
 * ```
 *
 * @param {Sequence(Sequence)} seq Any sequence for which iter() is defined
 */
function* flat(seq) {
  for (const sub of iter(seq)) {
    for (const val of iter(sub)) {
      yield val;
    }
  }
}

/**
 * Concatenate any number of sequences.
 * This is just a variadic alias for `flat()`
 */
const concat = (...args) => flat(args);

/**
 * Combine all the values from a sequence into one value.
 *
 * This function is also often called reduce, because it reduces
 * multiple values into a single value.
 *
 * Here are some common use cases of the foldl function:
 *
 * ```
 * const all = (seq) => foldl(seq, true, (a, b) => a && b);
 * const any = (seq) => foldl(seq, false, (a, b) => a || b);
 * const sum = (seq) => foldl(seq, 0, (a, b) => a + b);
 * const product = (seq) => foldl(seq, 1, (a, b) => a * b);
 * ```
 *
 * Notice the pattern: We basically take an operator and apply
 * it until the sequence is empty: sum([1,2,3,4]) is pretty much
 * equivalent to `1 + 2 + 3 + 4`.
 *
 * (If you want to get very mathematical here...notice how we basically
 * have an operation and then just take the operation's neutral element
 * as the initial value?)
 *
 * @param {Sequence} seq The sequence to reduce
 * @param {initial} Any The initial value of the reduce operation.
 *   If the sequence is empty, this value will be returned.
 */
const foldl = (seq, initial, fn) => {
  let accu = initial;
  each(seq, (v) => {
    accu = fn(accu, v);
  });
  return accu;
};

/**
 * Test whether all elements in the given sequence are truthy
 */
const all = seq => Boolean(foldl(seq, true, (a, b) => a && b));

module.exports = {
  iter, each, map, list, enumerate, flat, concat, foldl, all,
};
