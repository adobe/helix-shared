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
const url = require('url');
const YAML = require('yaml');

const Condition = require('../src/Condition.js');

const SPEC_ROOT = path.resolve(__dirname, 'specs/conditions');
const DEFAULT_SERVER = 'https://www.example.com';

/**
 * Adorn our mock up request with fields/methods exposed by an express-style request.
 *
 * @param {Object} req request
 */
function expressify(req) {
  return {
    get: (name) => req.headers[name],
    hostname: req.headers.host,
    params: url.parse(req.path, true).query,
    protocol: 'https',
    originalUrl: req.path,
    ...req,
  };
}

/**
 * Creates one mock request for a condition and evaluates
 * the response without verifying. Needed for testing
 * validity of time based conditions.
 *
 * @param {Object} cond condition
 */
async function assertOK(cond) {
  nock(DEFAULT_SERVER)
    .get(() => true)
    .reply(function intercept() {
      const fn = cond.toFunction();
      const result = fn(expressify(this.req));
      return [200, `${JSON.stringify(result)}`];
    });
  const response = await request(`${DEFAULT_SERVER}/index.html`);
  assert.ok(response);
}

/**
 * Creates mock requests for every sample definition found
 * and verifies the expected match
 *
 * @param {Object} cond condition
 * @param {Array} samples array of samples to verify
 */
async function assertMatch(cond, samples) {
  await Promise.all(samples.map(async (sample) => {
    nock(DEFAULT_SERVER)
      .get(() => true)
      .reply(function intercept() {
        const fn = cond.toFunction();
        const result = fn(expressify(this.req));
        return [200, `${JSON.stringify(result)}`];
      });
    const stdopts = { uri: `${DEFAULT_SERVER}/index.html` };
    const opts = { ...stdopts, ...sample };
    const response = await request(opts);
    assert.deepEqual(JSON.parse(response), opts.match);
  }));
}

describe('Condition tests', () => {
  afterEach(() => {
    nock.restore();
    nock.cleanAll();
    nock.activate();
  });

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
        if (cfg.vcl !== undefined) {
          const vcl = cond.toVCL();
          assert.equal(vcl, cfg.vcl);
          assert.equal(null, cfg.error);
        }
        if (cfg.vcl_path !== undefined) {
          const vclPath = cond.toVCLPath(cfg.param_name);
          assert.equal(vclPath, cfg.vcl_path);
        }
        if (cfg.samples !== undefined) {
          await assertMatch(cond, cfg.samples);
        } else {
          await assertOK(cond);
        }
        if (cfg.empty !== undefined) {
          assert.equal(cfg.empty, cond.isEmpty());
        }
        if (cfg.json !== undefined) {
          assert.equal(cfg.json, cond.toJSON());
        }
        const actual = cond.toJSON();
        const expected = cfg.condition;
        assert.deepEqual(actual, expected);
      } catch (e) {
        if (e.message !== cfg.error) {
          assert.fail(e.message);
        }
      }
    });
  });
});
