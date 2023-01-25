/*
 * Copyright 2022 Adobe. All rights reserved.
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
process.env.HELIX_FETCH_FORCE_HTTP1 = 'true';

const assert = require('assert');
const { Response, Request } = require('@adobe/fetch');
const wrap = require('@adobe/helix-shared-wrap');
const nock = require('nock');
const proxyquire = require('proxyquire');
const bounce = require('../src/bounce.js');

const log = {
  info: console.log,
  warn: console.log,
  error: console.error,
  debug: console.log,
};

describe('Bounce Wrapper Unit Tests', () => {
  it('Bounces the slow function, but still returns results if it is fast enough', async () => {
    let fastBounceId;
    let slowBounceId;

    const slowfunction = async (_, context) => new Promise((resolve) => {
      slowBounceId = context.invocation.bounceId;
      setTimeout(resolve, 500, new Response(`ok, job ${context.invocation.bounceId} completed.`));
    });

    const fastfunction = async (_, context) => {
      fastBounceId = context.invocation.bounceId;
      return new Response(`I am ready soon, check status at ${context.invocation.bounceId}`);
    };

    const actualfunct = wrap(slowfunction).with(bounce, { responder: fastfunction, timeout: 1000 });

    nock('http://localhost').post('/').reply(async function fakeruntime(uri, requestBody) {
      const request = new Request(`http://localhost${uri}`, {
        headers: this.req.headers,
        body: JSON.stringify((requestBody)),
        method: this.req.method,
      });

      const response = await actualfunct(request, {
        log,
        invocation: {
        },
      });
      const body = await response.text();
      return [response.status, body];
    });

    const response = await actualfunct(new Request('http://localhost', {
      body: JSON.stringify({ foo: 'bar' }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }), {
      log,
      invocation: {
      },
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
    assert.strictEqual(slowBounceId, fastBounceId);
    assert.ok((await response.text()).startsWith('ok, job '));
  });

  it('Bounces the slow function, returns pro forma response if too slow', async () => {
    let fastBounceId;
    let slowBounceId;

    const slowfunction = async (_, context) => new Promise((resolve) => {
      slowBounceId = context.invocation.bounceId;
      setTimeout(resolve, 2000, new Response(`ok, job ${context.invocation.bounceId} completed.`));
    });

    const fastfunction = async (_, context) => {
      fastBounceId = context.invocation.bounceId;
      return new Response(`I am ready soon, check status at ${context.invocation.bounceId}`);
    };

    const actualfunct = wrap(slowfunction).with(bounce, { responder: fastfunction });

    nock('http://localhost').post('/').reply(async function fakeruntime(uri, requestBody) {
      const request = new Request(`http://localhost${uri}`, {
        headers: this.req.headers,
        body: JSON.stringify((requestBody)),
        method: this.req.method,
      });

      const response = await actualfunct(request, {
        log,
      });
      const body = await response.text();
      return [response.status, body];
    });

    const response = await actualfunct(new Request('http://localhost', {
      body: JSON.stringify({ foo: 'bar' }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }), {
      log,
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
    assert.strictEqual(slowBounceId, fastBounceId);
    assert.ok((await response.text()).startsWith('I am ready soon, check status at '));
  });

  it('Bounces the slow function, error if pro forma function fails, too', async () => {
    const slowfunction = async (_, context) => new Promise((resolve) => {
      setTimeout(resolve, 2000, new Response(`ok, job ${context.invocation.bounceId} completed.`));
    });

    const fastfunction = async () => {
      throw new Error('I am so broken');
    };

    const actualfunct = wrap(slowfunction).with(bounce, { responder: fastfunction });

    nock('http://localhost').post('/').reply(async function fakeruntime(uri, requestBody) {
      const request = new Request(`http://localhost${uri}`, {
        headers: this.req.headers,
        body: JSON.stringify((requestBody)),
        method: this.req.method,
      });

      const response = await actualfunct(request, {
        log,
      });
      const body = await response.text();
      return [response.status, body];
    });

    const response = await actualfunct(new Request('http://localhost', {
      body: JSON.stringify({ foo: 'bar' }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }), {
      log,
    });
    assert.equal(response.status, 500, 'failure in quick response should be error 500');
    assert.ok((await response.text()).startsWith('Internal Server Error'));
  });

  it('Bounces the slow function, handles promise rejection in fetch', async () => {
    const slowfunction = async (_, context) => new Promise((resolve) => {
      setTimeout(resolve, 2000, new Response(`ok, job ${context.invocation.bounceId} completed.`));
    });

    const fastfunction = async (_, context) => new Response(`I am ready soon, check status at ${context.invocation.bounceId}`);

    const fakebounce = proxyquire('../src/bounce.js', {
      '@adobe/fetch': {
        fetch: () => { throw new Error('something went wrong'); },
      },
    });

    const actualfunct = wrap(slowfunction).with(fakebounce, { responder: fastfunction });

    nock('http://localhost').post('/').reply(async function fakeruntime(uri, requestBody) {
      const request = new Request(`http://localhost${uri}`, {
        headers: this.req.headers,
        body: JSON.stringify((requestBody)),
        method: this.req.method,
      });

      const response = await actualfunct(request, {
        log,
      });
      const body = await response.text();
      return [response.status, body];
    });

    const response = await actualfunct(new Request('http://localhost', {
      body: JSON.stringify({ foo: 'bar' }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }), {
      log,
    });
    assert.equal(response.status, 502, 'failing bounce should become 502');
  });

  it('Debounces with function', async () => {
    let slowBounceId;

    const slowfunction = async (_, context) => {
      slowBounceId = context.invocation.bounceId;
      return new Response(`ok, job ${context.invocation.bounceId} completed.`);
    };

    const actualfunct = wrap(slowfunction).with(bounce, { debounce: () => '1234' });

    nock('http://localhost').post('/').reply(async function fakeruntime(uri, requestBody) {
      const request = new Request(`http://localhost${uri}`, {
        headers: this.req.headers,
        body: JSON.stringify((requestBody)),
        method: this.req.method,
      });

      const response = await actualfunct(request, {
        log,
        invocation: {
        },
      });
      const body = await response.text();
      return [response.status, body];
    });

    const response = await actualfunct(new Request('http://localhost', {
      body: JSON.stringify({ foo: 'bar' }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }), {
      log,
      invocation: {
      },
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
    assert.strictEqual(slowBounceId, '1234');
    assert.ok((await response.text()).startsWith('ok, job '));
  });
});
