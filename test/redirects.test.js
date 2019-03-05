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

/* eslint-env mocha */

const assert = require('assert');
const { AssertionError } = require('assert');
const Redirect = require('../src/Redirect');

describe('Redirect test', () => {
  it('Redirects cannot be created without arguments', () => {
    try {
      // eslint-disable-next-line no-new
      new Redirect();
      assert.fail('expected exception not thrown'); // this throws an AssertionError
    } catch (e) { // this catches all errors, those thrown by the function under test
      // and those thrown by assert.fail
      if (e instanceof AssertionError) {
        // bubble up the assertion error
        throw e;
      }
    }
  });

  it('Redirects cannot be created from invalid regex', () => {
    try {
      // eslint-disable-next-line no-new
      new Redirect({
        from: '/(',
        to: '/invalid',
      });
      assert.fail('expected exception not thrown'); // this throws an AssertionError
    } catch (e) { // this catches all errors, those thrown by the function under test
      // and those thrown by assert.fail
      if (e instanceof AssertionError) {
        // bubble up the assertion error
        throw e;
      }
    }
  });

  it('Redirects work', () => {
    const before = {
      from: '\\/foo',
      to: '/bar',
    };

    const r = new Redirect(before);

    assert.equal(r.from, before.from);
    assert.equal(r.to, before.to);
    assert.deepStrictEqual(r.toJSON(), before);
  });
});
