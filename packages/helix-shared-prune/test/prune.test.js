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

/* eslint-env mocha */

const assert = require('assert');
const pruneEmptyValues = require('../src/prune.js');

describe('Prune Empty Values Test', () => {
  it('removes empty values', () => {
    assert.deepEqual(pruneEmptyValues({
      foo: 'bar',
      empty: '',
      undef: undefined,
      zero: 0,
      fals: false,
      arr: [],
      obj: {},
    }), {
      foo: 'bar',
      obj: {},
    });
  });

  it('returns null if object is empty', () => {
    assert.deepEqual(pruneEmptyValues({
      empty: '',
    }), null);
  });
});
