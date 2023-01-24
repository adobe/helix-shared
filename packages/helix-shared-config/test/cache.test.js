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

/* eslint-env mocha */

const assert = require('assert');
const cache = require('../src/fetchconfig/cache.js').options({ max: 10 });

let errcounter = 0;
const errfn = () => {
  errcounter += 1;
  throw new Error(`This is error #${errcounter}`);
};

let counter = 0;
const countfn = () => {
  counter += 1;
  return counter;
};

describe('Cache Tests', () => {
  it('Errors do not get cached by default', async () => {
    errcounter = 0;
    const cached = cache(errfn);

    try {
      await cached();
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'This is error #1');
    }

    try {
      await cached();
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'This is error #2');
    }

    try {
      await cached();
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'This is error #3');
    }
  });

  it('Errors do not get cached when I want it', async () => {
    errcounter = 0;
    const cached = cache(errfn, {
      cacheerror: () => true,
    });

    try {
      await cached();
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'This is error #1');
    }

    try {
      await cached();
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'This is error #1');
    }

    try {
      await cached();
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'This is error #1');
    }
  });

  it('Some results do not get cached when I do not want it', async () => {
    counter = 0;
    const cached = cache(countfn, {
      cacheresult: (value) => value % 3 === 0,
    });

    assert.equal(await cached(), 1);
    assert.equal(await cached(), 2);
    assert.equal(await cached(), 3);
    assert.equal(await cached(), 3);
    assert.equal(await cached(), 3);
  });

  it('Even falsy values can get cached', async () => {
    let start = true;

    function flip() {
      // eslint-disable-next-line no-bitwise
      start = Boolean(start ^ true);
      return start;
    }

    const cached = cache(flip);

    assert.equal(await flip(), false);
    assert.equal(await flip(), true);
    assert.equal(await flip(), false);
    assert.equal(await flip(), true);

    assert.equal(await cached(), false);
    assert.equal(await cached(), false, 'flip got called again');
  });
});
