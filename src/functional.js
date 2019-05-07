/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/** Generic library for functional programming & working with function */

/**
 * Immediately execute the given function.
 * Mostly used as a way to open a scope.
 */
const exec = fn => fn();

/** Just a function that returns it's argument! */
const identity = a => a;

/**
 * Pipeline a value through multiple function calls.
 *
 * ```
 * console.log(pipe(
 *   4,
 *   (x) => x+2,
 *   (x) => x*3
 * ));
 * // => 18
 * ```
 *
 * @param {Any} val The value to pipe through the functions
 * @param {Function} fns Multiple functions
 * @returns {Any}
 */
const pipe = (val, ...fns) => fns.reduce((v, fn) => fn(v), val);

/**
 * Function composition.
 *
 * ```
 * const fn = compose(
 *   (x) => x+2,
 *   (x) => x*3
 * );
 *
 * console.log(fn(4)); // => 18
 * ```
 *
 * @param {Function} fns Multiple functions
 * @returns {Function} All the functions in the sequence composed into one
 */
const compose = (...fns) => val => pipe(val, ...fns);

/**
 * Manually assign a name to a function.
 * @param {String} name The new name of the function.
 * @param {Function} fn The function to assign a name to
 * @param {Function} Just returns `fn` again.
 */
const withFunctionName = (name, fn) => {
  Object.defineProperty(fn, 'name', { value: name });
  return fn;
};

/**
 * Autocurry a function!
 *
 * https://en.wikipedia.org/wiki/Currying
 *
 * Any function that has a fixed number of parameters may be curried!
 * Curried parameters will be in reverse order. This is useful for
 * functional programming, because it allows us to use function parameters
 * in the suffix position when using no curring:
 *
 * ```
 * const toNumber = (seq) => map(seq, n => Number(n));
 *
 * // is the same as
 *
 * const toNumber = map(n => Number(n))
 *
 * // or even
 *
 * const toNumber = map(Number);
 * ```
 *
 * Note how in the second version we specified the last parameter
 * first due to currying.
 *
 * Reverse order only applies in separate invocations:
 *
 * ```
 * const sum = (seq) => foldl(seq, 0, (a, b) => a+b);
 *
 * // is the same as
 *
 * const sum = foldl(0, (a, b) => a+b);
 *
 * // or even
 *
 * concat = sum = foldl(0, plus);
 * ```
 *
 * Note how in version two, we specify the parameters in order 2, 3, and then 1:
 *
 * `fn(a, b, c) <=> fn(c)(b)(a) <=> fn(b, c)(a)`
 */
const curry = (name, fn) => curry.impl(name, fn, fn.length, []);
curry.impl = (name, fn, arity, got) => withFunctionName(`${name} [CURRY]`, (...args) => {
  args.push(...got);
  if (args.length === arity) {
    return fn(...args);
  } else if (args.length < arity) {
    return curry.impl(name, fn, arity, args);
  } else {
    throw new Error(`Too many arguments passed to ${name}; `
                    + `got ${args.length}; expected ${arity}`);
  }
});

module.exports = {
  exec, identity, pipe, compose, withFunctionName, curry,
};
