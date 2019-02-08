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
const {
  iter, each, list, enumerate, map, flat, concat, foldl, all,
} = require('../src/index.js').sequence;

describe('sequence lib', () => {
  const str = 'Hello World';
  const arr = [42, 23];
  const obj = { foo: 42 };
  const m = new Map([['tardigrade', 'cute']]);
  const richObj = {
    [Symbol.iterator]: function* generate() {
      yield 42;
      yield 23;
    },
  };
  function* g() {
    yield null;
    yield undefined;
    yield 42;
  }

  const getExampleGenerators = () => [
    () => str, () => arr, () => obj, () => m, g, () => iter(str),
    () => '', () => ({}), () => new Map(),
  ];
  const getExamples = () => getExampleGenerators().map(fn => fn());

  const checkEq = (a, b) => {
    assert.deepStrictEqual(list(a), list(b));
  };

  it('iter() yields iterators ', () => {
    getExamples().forEach((seq) => {
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
      checkEq(actual, expected);
    };
    checkEach(str, str);
    checkEach(arr, arr);
    checkEach(obj, [['foo', 42]]);
    checkEach(m, [['tardigrade', 'cute']]);
    checkEach(richObj, [42, 23]);
    checkEach(g(), [null, undefined, 42]);
    checkEach('', []);
    checkEach([], []);
    checkEach({}, []);
  });

  it('map()', () => {
    const ckExample = (seq, expected, fn) => {
      checkEq(map(seq, fn), expected);
    };

    // These just test basic transforms
    ckExample([1, 2, 3, 4], [2, 4, 6, 8], v => v * 2);
    ckExample([true, 2, 'foo'], [null, null, null], v => v && null);

    // These ensure that arbitrary types are supported
    each(getExampleGenerators(), (gen) => {
      const fn = x => ({ foo: x });
      checkEq(map(gen(), fn), list(gen()).map(fn));
    });
  });

  it('enumerate()', () => {
    checkEq(enumerate('abc'), [[0, 'a'], [1, 'b'], [2, 'c']]);
  });

  it('flat', () => {
    // Basic examples
    checkEq(flat(['foo', [1, 2, 3], { foo: 42 }]), ['f', 'o', 'o', 1, 2, 3, ['foo', 42]]);
    checkEq(
      flat(concat({ foo: 42, bar: 23 }, new Map([[2, 3]]), enumerate('helo'))),
      ['foo', 42, 'bar', 23, 2, 3, 0, 'h', 1, 'e', 2, 'l', 3, 'o'],
    );

    // Automatically generated examples over many types
    const ref = getExamples().reduce((a, b) => a.concat(list(b)), []);
    checkEq(flat(getExamples()), ref);
    checkEq(flat(iter(getExamples())), ref);
  });

  it('foldl', () => {
    // Basic examples
    assert(all([true, false, true]) === false);
    assert(all(iter([1, { foo: 42 }])) === true);

    // Generated examples
    assert(all(concat([0], flat(getExamples()))) === false);
    each(getExampleGenerators(), (gen) => {
      // This pretty much reimplements list more inefficiently
      // Using this test here, because in contrast to all() this does
      // not discard information contained in the input sequence...
      checkEq(foldl(gen(), [], (a, b) => a.concat([b])), list(gen()));
    });
  });
});
