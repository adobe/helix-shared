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
const Origin = require('../src/Origin');

describe('Origin Config', () => {
  it('complains about empty config', (done) => {
    try {
      const o = new Origin();
      assert.ok(o);
      done('Should fail when no configuration object is given');
    } catch (e) {
      done();
    }
  });

  it('complains about invalid URLs', (done) => {
    try {
      const o = new Origin('htt');
      assert.ok(o);
      done('Should fail when invalid URL is given');
    } catch (e) {
      done();
    }
  });

  it('Keeps provided name in place', () => {
    const origin = new Origin({ name: 'foo' });
    assert.equal(origin.name, 'foo');
  });

  it('Generates a name for unnamed strains', () => {
    const origin = new Origin('http://example.com');
    assert.equal(origin.name, 'Proxyexamplecombe60');
  });

  it('Keeps the correct port number', () => {
    const origin = new Origin('http://example.com:4503');
    assert.equal(origin.port, 4503);
  });

  it('Generates a name for unnamed strains', () => {
    const origin = new Origin({ hostname: 'example.com' });
    assert.equal(origin.name, 'Proxyexamplecom4e71');
  });
});
