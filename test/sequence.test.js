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

/* global describe, it */

const assert = require('assert');
const { iter, each, enumerate } = require('../src/index.js').sequence;

describe('sequence lib', () => {
  const str = 'Hello World';
  const arr = [42, 23];
  const obj = { foo: 42 };
  const map = new Map([['tardigrade', 'cute']]);
  const richObj = {
    [Symbol.iterator]: function* generate() {
      yield 42;
      yield 23;
    },
  };
  function* gen() {
    yield null;
    yield undefined;
    yield 42;
  }

  it('iter() yields iterators ', () => {
    [str, arr, obj, map, gen(), iter(str), '', {}, new Map()].forEach((seq) => {
      const fst = iter(seq).next();
      assert(Object.prototype.hasOwnProperty.call(fst, 'value'));
      assert(Object.prototype.hasOwnProperty.call(fst, 'done'));
      assert(fst.done.constructor === Boolean);
    });
  });

  it('iter() fails for types lacking iteration', () => {
    class Foo {}
    assert.throws(() => iter(new Foo()));
  });

  it('each() can iterate the sequences', () => {
    const checkEach = (seq, expected) => {
      const actual = [];
      each(seq, v => actual.push(v));
      assert.deepStrictEqual(actual, expected);
    };
    checkEach(str, Array.from(str));
    checkEach(arr, arr);
    checkEach(obj, [['foo', 42]]);
    checkEach(map, [['tardigrade', 'cute']]);
    checkEach(richObj, [42, 23]);
    checkEach(gen(), [null, undefined, 42]);
    checkEach('', []);
    checkEach([], []);
    checkEach({}, []);
  });

  it('enumerate()', () => {
    assert.deepStrictEqual(
      Array.from(enumerate('abc')),
      [[0, 'a'], [1, 'b'], [2, 'c']],
    );
  });
});
