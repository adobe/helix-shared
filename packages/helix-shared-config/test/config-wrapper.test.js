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

/* eslint-disable no-console */

/* eslint-env mocha */
import assert from 'assert';
import { Request, Response } from '@adobe/fetch';

import wrap from '@adobe/helix-shared-wrap';
import { optionalConfig, requiredConfig } from '../src/index.js';

import { setupPolly } from './utils.js';
import { getData } from '../src/config-wrapper.js';

const log = {
  info: console.log,
  warn: console.log,
  error: console.error,
  debug: console.log,
};

describe('Unit tests for getData()', () => {
  it('Form Data', async () => {
    const formrequest = new Request('http://localhost', {
      body: 'owner=adobe&repo=theblog&ref=non-existing&version=1',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    assert.deepStrictEqual(await getData(formrequest, 'owner', 'repo', 'ref', 'version', 'name'), {
      owner: 'adobe',
      repo: 'theblog',
      ref: 'non-existing',
      version: 1,
    });
  });
  it('JSON Data', async () => {
    const jsonrequest = new Request('http://localhost', {
      body: '{"owner": "adobe", "repo": "theblog", "ref": "non-existing", "version": 1}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    assert.deepStrictEqual(await getData(jsonrequest, 'owner', 'repo', 'ref', 'version', 'name'), {
      owner: 'adobe',
      repo: 'theblog',
      ref: 'non-existing',
      version: 1,
    });
  });
  it('URL Data', async () => {
    const getrequest = new Request('http://localhost?owner=adobe&repo=theblog&ref=non-existing&version=1', {
      method: 'GET',
    });

    assert.deepStrictEqual(await getData(getrequest, 'owner', 'repo', 'ref', 'version', 'name'), {
      owner: 'adobe',
      repo: 'theblog',
      ref: 'non-existing',
      version: 1,
    });
  });
});

describe('Required Config Loading Wrapper', () => {
  setupPolly({
    recordIfMissing: false,
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

    const actualfunct = wrap(universalfunct).with(requiredConfig, 'index');
    const response = await actualfunct(new Request('http://localhost', {
      body: '{"owner": "adobe", "repo": "theblog", "ref": "non-existing"}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'token none',
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
    recordIfMissing: false,
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

  it('Unloadable optional config is ignored', async function get() {
    const { server } = this.polly;
    server.get('https://raw.githubusercontent.com/:path').intercept((req, res) => {
      res.send(500);
    });

    const universalfunct = async () => new Response('ok');

    const actualfunct = wrap(universalfunct).with(optionalConfig, 'redirect');
    const response = await actualfunct(new Request('http://localhost', {
      body: '{"owner": "adobe", "repo": "theblog", "ref": "non-existing"}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Github-Token': 'none',
      },
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 200, 'universal function should be executed');
  });

  it('Config is loaded when request is a JSON body', async () => {
    const universalfunct = async (request, context) => {
      assert.ok(context.config.index, 'index config should be available if loaded');
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(optionalConfig, 'index');
    const response = await actualfunct(new Request('http://localhost', {
      body: '{"owner": "adobe", "repo": "blog", "ref": "main"}',
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
      assert.ok(context.config.index, 'index config should be available if loaded');
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(optionalConfig, 'index');
    const response = await actualfunct(new Request('http://localhost', {
      body: 'owner=adobe&repo=blog&ref=main',
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
