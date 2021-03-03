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
process.env.HELIX_FETCH_FORCE_HTTP1 = 'true';

const assert = require('assert');
const fs = require('fs-extra');
const nock = require('nock');
const path = require('path');
const fetchAPI = require('@adobe/helix-fetch');
const url = require('url');
const YAML = require('yaml');

const Condition = require('../src/Condition.js');

const SPEC_ROOT = path.resolve(__dirname, 'specs/conditions');
const DEFAULT_SERVER = 'https://www.example.com';

const { fetch } = process.env.HELIX_FETCH_FORCE_HTTP1
  ? fetchAPI.context({
    alpnProtocols: [fetchAPI.ALPN_HTTP1_1],
  })
  /* istanbul ignore next */
  : fetchAPI;

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
      const result = cond.match(expressify(this.req));
      return [200, `${JSON.stringify(result)}`];
    });
  const response = await (await fetch(`${DEFAULT_SERVER}/index.html`)).text();
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
        const result = cond.match(expressify(this.req));
        return [200, `${JSON.stringify(result)}`];
      });
    const stdopts = { uri: `${DEFAULT_SERVER}/index.html` };
    const opts = { ...stdopts, ...sample };
    const response = await (await fetch(opts.uri, opts)).text();
    assert.deepEqual(JSON.parse(response), opts.match);
  }));
}

describe('Condition tests', () => {
  before(() => {
    nock.restore();
    nock.cleanAll();
    nock.activate();
  });

  afterEach(() => {
    nock.restore();
    nock.cleanAll();
    nock.activate();
  });

  after(() => {
    nock.restore();
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
        if (cfg.vcl_path_fn !== undefined) {
          const vclPath = cond.toVCLPath((_vclpath, subpath) => `# Rewrite the URL to include the proxy path
set req.url = regsub(req.url, "^/oldpath", "${subpath}");
`);
          assert.equal(vclPath, cfg.vcl_path_fn);
        }
        if (cfg.samples !== undefined) {
          await assertMatch(cond, cfg.samples);
        } else {
          await assertOK(cond);
        }
        if (cfg.json !== undefined) {
          assert.equal(cfg.json, cond.toJSON());
        }
        const sticky = cfg.sticky || false;
        assert.equal(cond.sticky(), sticky);

        const actual = cond.toJSON();
        const expected = cfg.condition;
        assert.deepEqual(actual, expected);
      } catch (e) {
        if (e.message !== cfg.error) {
          throw e;
        }
      }
    });
  });

  it('covering url expression evaluation with empty request', () => {
    try {
      const cond = new Condition({ url: '/test' });
      assert.equal(cond.match({}), false);
    } catch (e) {
      assert.fail(e.message);
    }
  });

  it('covering url expression evaluation with no protocol', () => {
    try {
      const cond = new Condition({ url: 'http://myhost/test' });
      assert.equal(cond.match({ headers: { host: 'myhost' } }), false);
    } catch (e) {
      assert.fail(e.message);
    }
  });

  it('toYAMLNode() of an empty condition should return null', () => {
    try {
      const cond = new Condition();
      assert.equal(cond.toYAMLNode(), null);
    } catch (e) {
      assert.fail(e.message);
    }
  });
});
