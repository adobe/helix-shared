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

/* eslint-env mocha */

const assert = require('assert');
const YAML = require('yaml');
const NamedMapProxy = require('../src/NamedMapProxy');

describe('NamedMapProxy Tests', () => {
  const yaml = YAML.parseDocument(`
basic:
  named1:
    foo: bar
  named2:
    foo: baz
arrays:
  named1:
    foo: bar
  named2:
    foo: 
      - baz
      - faz
types:
  named1:
    numprop: "1"
    boolprop: "true"
`);

  const basic = {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
      },
    },
  };

  const arrays = {
    type: 'object',
    properties: {
      foo: {
        type: 'array',
      },
    },
  };

  const types = {
    type: 'object',
    properties: {
      numprop: {
        type: 'number',
      },
      boolprop: {
        type: 'boolean',
      },
    },
  };

  it('NamedMapProxy accepts basic YAML', () => {
    const obj = NamedMapProxy(yaml, 'basic', basic);
    assert.equal(typeof obj, 'object');
    assert.equal(typeof obj.length, 'number');
    assert.equal(obj.length, 2);
    assert.equal(obj[0].foo, 'bar');
    assert.equal(obj[0].name, 'named1');
    assert.equal(obj[1].foo, 'baz');
    assert.deepEqual(obj.toJSON(), {
      named1: {
        foo: 'bar',
      },
      named2: {
        foo: 'baz',
      },
    });
  });

  it('NamedMapProxy treats missing values as empty lists', () => {
    const obj = NamedMapProxy(yaml, 'nothing', basic);
    assert.equal(typeof obj, 'object');
    assert.equal(typeof obj.length, 'number');
    assert.equal(obj.length, 0);
  });

  it('NamedMapProxy coerces types', () => {
    const obj = NamedMapProxy(yaml, 'types', types);
    assert.equal(typeof obj, 'object');
    assert.equal(typeof obj.length, 'number');
    assert.equal(obj.length, 1);
    assert.equal(typeof obj[1], 'undefined');
    assert.strictEqual(obj[0].numProp, 1);
    assert.strictEqual(obj[0].name, 'named1');
    // assert.strictEqual(obj[0].boolProp, true);
  });

  it('NamedMapProxy coerces arrays', () => {
    const obj = NamedMapProxy(yaml, 'arrays', arrays);
    assert.equal(typeof obj, 'object');
    assert.equal(typeof obj.length, 'number');
    assert.equal(obj.length, 2);
    assert.deepEqual(obj[0].foo, ['bar']);
    assert.equal(obj[0].name, 'named1');
    assert.deepEqual(obj[1].foo, ['baz', 'faz']);
  });
});
