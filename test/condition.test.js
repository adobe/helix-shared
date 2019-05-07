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
const fs = require('fs-extra');
const nock = require('nock');
const path = require('path');
const request = require('request-promise-native');
const YAML = require('yaml');
const Condition = require('../src/Condition.js');

const SPEC_ROOT = path.resolve(__dirname, 'specs/conditions');

describe('Condition tests', () => {
  fs.readdirSync(SPEC_ROOT).forEach((filename) => {
    const source = fs.readFileSync(path.resolve(SPEC_ROOT, filename), 'utf8');
    const document = YAML.parseDocument(source, {
      merge: true,
      schema: 'core',
    });
    const cfg = document.toJSON() || {};
    it(`Testing ${filename}`, async () => {
      try {
        const cond = new Condition(cfg.condition);
        if (cfg.vcl) {
          const vcl = cond.toVCL();
          assert.equal(vcl, cfg.vcl);
          assert.equal(null, cfg.error);
        }
        nock('http://www.example.com')
          .get(() => true)
          .reply(function intercept() {
            const fn = cond.toFunction();
            return [200, `${fn(this.req)}`];
          });
        const response = await request('http://www.example.com/index.html?a=7');
        assert.ok(response);
      } catch (e) {
        if (e.message !== cfg.error) {
          assert.fail(e.message);
        }
      }
    });
  });
  it('Null condition', async () => {
    const cond = new Condition();
    assert.equal('', cond.toVCL());
    const fn = cond.toFunction();
    assert.equal(true, fn());
  });
});
