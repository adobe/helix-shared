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
/* eslint-disable class-methods-use-this */

const assert = require('assert');
const {
  identity, compose, composeSeq, pipe, withFunctionName, curry,
  and, or, not, nand, nor, xor, xnor, is, aint, plus, mul, Size,
  SizeNotImplemented, size, empty, SequenceNotImplemented, iter,
  range, range0, repeat, extend, extend1, flattenTree,
  IteratorEnded, next, nth, first, second, each, count, list,
  uniq, join, into, foldl, foldr, any, all, sum, product, map,
  filter, reverse, enumerate, trySkip, skip, skipWhile, tryTake,
  takeWhile, takeUntilVal, takeDef, flat, concat, prepend,
  append, mapSort, exec, zipLeast, zip, zipLongest,
} = require('../src/index.js').sequence;

const ckThrows = (cls, fn) => assert.throws(fn, cls);

it('exec()', () => {
  assert.strictEqual(exec(() => 42), 42);
});

it('identity()', () => {
  assert.deepStrictEqual(identity(2), 2);
});

it('withFunctionName()', () => {
  const fn = withFunctionName('ford prefect!', () => null);
  assert.strictEqual(fn.name, 'ford prefect!');
});

it('compose(), compseSeq(), pipe()', () => {
  const ck = (ini, fns, expect) => {
    assert.strictEqual(compose(...fns)(ini), expect);
    assert.strictEqual(composeSeq(fns)(ini), expect);
    assert.strictEqual(pipe(ini, ...fns), expect);
  };
  ck(2, [], 2);
  ck(null, [], null);
  ck(3, [mul(2)], 6);
  ck(3, [mul(2), plus(1)], 7);
  ck(3, [plus(1), mul(3)], 12);
});

it('curry()', () => {
  const fn = curry('foobar', (a, b, c, d) => (a + b * c) * d);
  const ck = (res) => {
    assert.deepStrictEqual(res, 28);
  };

  ck(fn(1, 2, 3, 4));
  ck(fn()(1, 2, 3, 4));

  ck(fn(4)(1, 2, 3));
  ck(fn(4)()(1, 2, 3));
  ck(fn(2, 3, 4)(1));
  ck(fn()(2, 3, 4)()(1));

  ck(fn(3, 4)(1, 2));
  ck(fn(4)(3)(1, 2));
  ck(fn(4)(2, 3)(1));

  ck(fn(4)()(3)(2)()(1));

  assert(fn.name.match(/foobar/));

  assert.throws(() => fn(1, 2, 3, 4, 5));
});

const ckCurry = (fn, ...args) => {
  const a = fn(...args);
  const b = foldr(args, fn, (f, v) => f(v));
  assert.deepStrictEqual(a, b);
  return a;
};

it('and()', () => {
  const ck = (expect, ...args) => assert.strictEqual(ckCurry(and, ...args), expect);
  ck(null, null, null);
  ck(null, true, null);
  ck(0, 0, true);
  ck(true, 1, true);
});

it('or()', () => {
  const ck = (expect, ...args) => assert.strictEqual(ckCurry(or, ...args), expect);
  ck(null, null, null);
  ck(true, true, true);
  ck(1, 0, 1);
  ck(true, 0, true);
});

it('not()', () => {
  assert.strictEqual(not(1), false);
  assert.strictEqual(not(null), true);
});

it('nand()', () => {
  const ck = (expect, ...args) => assert.strictEqual(ckCurry(nand, ...args), expect);
  ck(true, null, null);
  ck(true, true, null);
  ck(true, 0, 1);
  ck(false, 1, true);
});

it('nor()', () => {
  const ck = (expect, ...args) => assert.strictEqual(ckCurry(nor, ...args), expect);
  ck(true, null, null);
  ck(false, true, null);
  ck(false, 0, 1);
  ck(false, 1, true);
});

it('xor()', () => {
  const ck = (expect, ...args) => assert.strictEqual(ckCurry(xor, ...args), expect);
  ck(false, null, null);
  ck(true, true, null);
  ck(true, 0, 1);
  ck(false, 1, true);
});

it('xnor()', () => {
  const ck = (expect, ...args) => assert.strictEqual(ckCurry(xnor, ...args), expect);
  ck(true, null, null);
  ck(false, true, null);
  ck(false, 0, 1);
  ck(true, 1, true);
});

it('is()', () => {
  const ck = (expect, ...args) => assert.strictEqual(ckCurry(is, ...args), expect);
  ck(true, null, null);
  ck(false, true, null);
  ck(false, 0, 1);
  ck(false, 1, true);
});

it('aint()', () => {
  const ck = (expect, ...args) => assert.strictEqual(ckCurry(aint, ...args), expect);
  ck(false, null, null);
  ck(true, true, null);
  ck(true, 0, 1);
  ck(true, 1, true);
});

it('plus()', () => {
  const ck = (expect, ...args) => assert.strictEqual(ckCurry(plus, ...args), expect);
  ck(5, 2, 3);
  ck(0, 1, -1);
});

it('mul()', () => {
  const ck = (expect, ...args) => assert.strictEqual(ckCurry(mul, ...args), expect);
  ck(-2, 2, -1);
  ck(0, 17, 0);
});

it('size(), empty(), count()', () => {
  const ck = (arg, expect) => {
    assert.strictEqual(size(arg), expect);
    assert.strictEqual(count(arg), expect);
    assert.strictEqual(empty(arg), expect === 0);
  };
  class Foo {}
  class Bar {
    [Size]() { return 42; }
  }
  class Bang extends Bar {}
  class Baz {}
  size.impl.set(Baz, () => 23);

  ck([1, 2, 3], 3);
  ck([], 0);
  ck({}, 0);
  ck({ foo: 42 }, 1);
  ck(new Set([1, 2, 3]), 3);
  ck(new Map(), 0);
  ck(new Map([[1, 2]]), 1);
  ck('assd', 4);
  ck(new Bar(), 42);
  ck(new Bang(), 42);
  ck(new Baz(), 23);

  each([new Foo(), 0, null], (val) => {
    each([size, count, empty], (fn) => {
      ckThrows(SizeNotImplemented, () => fn(val));
    });
  });
});

it('count()', () => {
  const ck = (seq, expect) => assert.strictEqual(count(seq), expect);
  ck(iter({}), 0);
  ck(iter([1, 2, 3]), 3);
});

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
function* gen() {
  yield null;
  yield undefined;
  yield 42;
}

const ckEqSeq = (a, b) => assert.deepStrictEqual(list(a), list(b));

describe('iter()', () => {
  it('yields iterators ', () => {
    [str, arr, obj, m, gen(), iter(str), '', {}, new Map()].forEach((seq) => {
      const fst = iter(seq).next();
      assert(Object.prototype.hasOwnProperty.call(fst, 'value'));
      assert(Object.prototype.hasOwnProperty.call(fst, 'done'));
      assert(fst.done.constructor === Boolean);
    });
  });

  it('iter() fails for types lacking iteration', () => {
    class Foo {}
    ckThrows(SequenceNotImplemented, () => iter(new Foo()));
  });
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
  checkEach(m, [['tardigrade', 'cute']]);
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

it('range(), range0()', () => {
  const ck = (a, b, l) => assert.deepStrictEqual(list(range(a, b)), list(l));
  ck(0, 5, [0, 1, 2, 3, 4]);
  ck(0, -1, []);
  ck(0, 0, []);
  ck(7, 9, [7, 8]);
  assert.deepStrictEqual(list(range0(4)), [0, 1, 2, 3]);
});

it('repeat()', () => {
  ckEqSeq(tryTake(repeat(2), 4), [2, 2, 2, 2]);
});

it('extend(), extend1()', () => {
  ckEqSeq(tryTake(extend(mul(2))(3), 4), [3, 6, 12, 24]);
  ckEqSeq(tryTake(extend1(mul(-1))(1), 4), [-1, 1, -1, 1]);
});

it('flattenTree()', () => {
  class Node {
    constructor(values, ...children) {
      this.values = values;
      this.children = children;
    }
  }

  const tree = new Node([1, 2, 3, 4],
    new Node([7, 14]),
    new Node(),
    new Node(undefined,
      new Node([1, 2, 3],
        new Node([1, 4]))),
    new Node('foo'));

  const flt = (node, recurse) => {
    let vals = [];
    if (node.values === undefined) {
      vals = [];
    } else if (node.values.constructor === Array) {
      vals = node.values;
    } else if (node.values.constructor === String) {
      vals = [node.values];
    }

    return concat(vals, recurse(node.children));
  };

  ckEqSeq(flattenTree(flt)(tree), [1, 2, 3, 4, 7, 14, 1, 2, 3, 1, 4, 'foo']);
});

it('next(), first()', () => {
  each([next, first], (fn) => {
    assert.deepStrictEqual(fn({ foo: 42 }), ['foo', 42]);
    each([{}, [], ''], (cont) => {
      ckThrows(IteratorEnded, () => fn(cont));
    });
  });
});

it('nth()', () => {
  ckThrows(IteratorEnded, () => nth([1, 2, 3, 4], 5));
  assert.strictEqual(nth([1, 2, 3, 4], 2), 3);
});

it('second()', () => {
  ckThrows(IteratorEnded, () => second([4]));
  assert.strictEqual(second([4, 3]), 3);
});

it('into(), list()', () => {
  each([list, into(Array)], (fn) => {
    assert.deepStrictEqual(fn({ a: 42 }), [['a', 42]]);
  });
});

it('into(), uniq()', () => {
  each([uniq, into(Set)], (fn) => {
    const v = fn([1, 1, 3, 1, 4]);
    assert(v.constructor === Set);
    ckEqSeq(list(v).sort(), [1, 3, 4]);
  });
});

it('join()', () => {
  assert.deepStrictEqual(join(['Hello', 'World'], ' '), 'Hello World');
  assert.deepStrictEqual(into(String)(['Hello', 'World']), 'HelloWorld');
});

it('into()', () => {
  const o = into(Object)([['foo', 42], ['bar', 23], ['foo', 11]]);
  assert.strictEqual(o.foo, 11);
  assert.strictEqual(o.bar, 23);
  const mo = into(Map)(o);
  assert.strictEqual(size(mo), 2);
  assert.strictEqual(mo.get('foo'), 11);
  assert.strictEqual(mo.get('bar'), 23);
});

it('fold', () => {
  each([any, foldl(null, or), foldl(or)(null)], (fn) => {
    assert.strictEqual(fn([]), null);
    assert.strictEqual(fn([1]), 1);
    assert.strictEqual(fn([1, null]), 1);
    assert.strictEqual(fn([0, true, null]), true);
  });
  each([all, foldl(true, and)], (fn) => {
    assert.strictEqual(fn([]), true);
    assert.strictEqual(fn([1]), 1);
    assert.strictEqual(fn([1, null]), null);
    assert.strictEqual(fn([null, true, 0]), null);
  });
  each([sum, foldl(0, plus)], (fn) => {
    assert.strictEqual(fn([]), 0);
    assert.strictEqual(fn([1, 0]), 1);
    assert.strictEqual(fn([2, 3, 4]), 9);
  });
  each([product, foldl(1, mul)], (fn) => {
    assert.strictEqual(fn([]), 1);
    assert.strictEqual(fn([1, 0]), 0);
    assert.strictEqual(fn([2, 3, 4]), 24);
  });
  assert.strictEqual(
    foldr(['foo', 'bar'], 'Helo', (a, b) => `${a} ${b}`),
    'Helo bar foo',
  );
});

it('map()', () => {
  ckEqSeq(map(first)({ foo: 42 }), ['foo']);
});

it('filter()', () => {
  ckEqSeq(filter(second)({ foo: false, bar: '42' }), [['bar', '42']]);
});

it('reverse()', () => {
  const v = reverse(iter([4, 3, 2, 1]));
  assert(v.constructor === Array);
  ckEqSeq(v, [1, 2, 3, 4]);
});

it('trySkip', () => {
  ckEqSeq(trySkip(2)([]), []);
  ckEqSeq(trySkip(2)([1, 2, 3, 4]), [3, 4]);
});

it('skip', () => {
  ckThrows(IteratorEnded, () => ckEqSeq(skip(1)([]), []));
  ckEqSeq(skip(0)([]), []);
  ckEqSeq(skip(2)([1, 2, 3, 4]), [3, 4]);
});

it('skipWhile', () => {
  ckEqSeq(skipWhile(x => x < 4)(range0(10)), [4, 5, 6, 7, 8, 9]);
  ckEqSeq(skipWhile(x => x < 4)([]), []);
});

it('tryTake', () => {
  ckEqSeq(tryTake(4)(range0(10)), [0, 1, 2, 3]);
  ckEqSeq(tryTake(4)(range0(2)), [0, 1]);
});

it('takeWhile()', () => {
  ckEqSeq(takeWhile(x => x < 4)(range0(10)), [0, 1, 2, 3]);
});

it('takeUntilVal', () => {
  ckEqSeq(takeUntilVal(44)(range0(6)), [0, 1, 2, 3, 4, 5]);
  ckEqSeq(takeUntilVal(2)(range0(6)), [0, 1]);
});

it('takeDef', () => {
  ckEqSeq(takeDef([1, 2, 3, undefined, 4, 5, 6]), [1, 2, 3]);
  ckEqSeq(takeDef([1, 2, 3, null, 4, 5, 6]), [1, 2, 3]);
  ckEqSeq(takeDef(range0(6)), [0, 1, 2, 3, 4, 5]);
});

it('flat(), concat()', () => {
  each([flat, a => concat(...a)], (fn) => {
    ckEqSeq(
      fn(iter([iter([1, 2, 3, 4]), { foo: 42 }])),
      [1, 2, 3, 4, ['foo', 42]],
    );
  });
});

it('prepend(), append()', () => {
  ckEqSeq(append(42)(prepend(3)({ foo: 42 })), [3, ['foo', 42], 42]);
});

it('mapSort()', () => {
  const a = { id: 42 };
  const b = { id: 23 };
  const c = { id: 11 };

  const v = mapSort(({ id }) => id)([a, b, c]);
  ckEqSeq(v, [c, b, a]);
  const u = mapSort([a, c, b], ({ id }) => -id);
  ckEqSeq(u, [a, b, c]);
});

it('zipLeast', () => {
  ckEqSeq(zipLeast([]), []);
  ckEqSeq(zipLeast([['foo', 'bar']]), [['foo'], ['bar']]);
  ckEqSeq(
    zipLeast([[1, 2, 3], ['x', 'y'], [-1, -2, -3, -4]]),
    [[1, 'x', -1], [2, 'y', -2]],
  );
});

it('zip', () => {
  ckEqSeq(zip([]), []);
  ckEqSeq(zip([['foo', 'bar']]), [['foo'], ['bar']]);
  ckEqSeq(
    zip([[1, 2], ['x', 'y'], [-1, -2]]),
    [[1, 'x', -1], [2, 'y', -2]],
  );
  ckThrows(IteratorEnded, () => list(zip([[1, 2], [1]])));
});

it('zipLongest', () => {
  ckEqSeq(zipLongest(null)([]), []);
  ckEqSeq(zipLongest(null)([['foo', 'bar']]), [['foo'], ['bar']]);
  ckEqSeq(
    zipLongest(null)([[1, 2, 3], ['x', 'y'], [-1, -2, -3, -4]]),
    [[1, 'x', -1], [2, 'y', -2], [3, null, -3], [null, null, -4]],
  );
});
