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
process.env.HELIX_FETCH_FORCE_HTTP1 = 'true';

const assert = require('assert');
const { Response, Request } = require('@adobe/helix-fetch');
const { wrap, optionalConfig, requiredConfig } = require('../src/index');
const { setupPolly } = require('./utils.js');

const log = {
  info: console.log,
  warn: console.log,
  error: console.error,
  debug: console.log,
};

describe('Required Config Loading Wrapper', () => {
  setupPolly({
    recordIfMissing: true,
    logging: false,
  });

  it('Missing owner, repo, ref returns a 400', async () => {
    const universalfunct = async (request, context) => {
      assert.equal(context.config.redirect, undefined, 'redirect config should be undefined if loading is impossible');
      assert.equal(await request.text(), 'empty', 'request body should be readable');
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(requiredConfig, 'redirect');
    const response = await actualfunct(new Request('http://localhost', {
      body: 'empty',
      method: 'POST',
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 400, 'universal function should not be executed');
  });

  it('Unloadable required config causes status 502', async function get() {
    const { server } = this.polly;
    server.get('https://raw.githubusercontent.com/:path').intercept((req, res) => {
      res.send(500);
    });

    const universalfunct = async (request, context) => {
      assert.ok(context.config.redirect, 'redirect config should be available if loaded');
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(requiredConfig, 'redirect');
    const response = await actualfunct(new Request('http://localhost', {
      body: '{"owner": "adobe", "repo": "theblog", "ref": "non-existing"}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 502, 'universal function should not be executed');
  });
});

describe('Optional Config Loading Wrapper', () => {
  setupPolly({
    recordIfMissing: true,
    logging: false,
  });

  it('Missing owner, repo, ref is ignored', async () => {
    const universalfunct = async (request, context) => {
      assert.equal(context.config.redirect, undefined, 'redirect config should be undefined if loading is impossible');
      assert.equal(await request.text(), 'empty', 'request body should be readable');
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(optionalConfig, 'redirect');
    const response = await actualfunct(new Request('http://localhost', {
      body: 'empty',
      method: 'POST',
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 200, 'universal function should be executed');
  });

  it('Config is loaded when request is a JSON body', async () => {
    const universalfunct = async (request, context) => {
      assert.ok(context.config.redirect, 'redirect config should be available if loaded');
      assert.equal(context.config.redirect.redirects.length, 34);
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(optionalConfig, 'redirect');
    const response = await actualfunct(new Request('http://localhost', {
      body: '{"owner": "adobe", "repo": "theblog", "ref": "10c716c1ddaa8df482aea4220b36a4a578da5b2c"}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 200, 'universal function should be executed');
  });

  it('Config is loaded when request is a Form body', async () => {
    const universalfunct = async (request, context) => {
      assert.ok(context.config.redirect, 'redirect config should be available if loaded');
      assert.equal(context.config.redirect.redirects.length, 34);
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(optionalConfig, 'redirect');
    const response = await actualfunct(new Request('http://localhost', {
      body: 'owner=adobe&repo=theblog&ref=10c716c1ddaa8df482aea4220b36a4a578da5b2c',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 200, 'universal function should be executed');
  });
});
