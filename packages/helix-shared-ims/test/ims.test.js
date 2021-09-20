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

const wrap = require('@adobe/helix-shared-wrap');
const assert = require('assert');
const { Request, Response } = require('@adobe/helix-universal');
const { Nock } = require('./utils.js');
const ims = require('../src/ims.js');

const DEFAULT_CONTEXT = (suffix = '/') => ({
  log: console,
  env: {},
  pathInfo: {
    suffix,
  },
});

/**
 * test main function that returns the ims profile.
 */
async function main(request, ctx) {
  return new Response(JSON.stringify(ctx.ims.profile, null, 2), {
    headers: {
      'content-type': 'application/json',
    },
  });
}

function imsProfileHandler() {
  return function fn() {
    if (this.req.headers.authorization !== 'bearer foo') {
      return [401];
    }
    return [200, {
      name: 'Test User',
      email: 'test@example.com',
      userId: '112233',
    }];
  };
}

describe('IMS Wrapper test', () => {
  let nock;
  beforeEach(() => {
    nock = new Nock();
  });

  afterEach(() => {
    nock.done();
  });

  it('requires clientId', async () => {
    const fn = wrap(main).with(ims);
    await assert.rejects(
      fn(new Request('https://www.example.com/'), DEFAULT_CONTEXT()),
      new Error('ims wrapper missing config property \'clientId\'.'),
    );
  });

  it('ignores missing tokens by default', async () => {
    const fn = wrap(main).with(ims, { clientId: 'my-id' });
    const resp = await fn(new Request('https://www.example.com/'), DEFAULT_CONTEXT());

    assert.strictEqual(resp.status, 200);
    assert.deepStrictEqual(await resp.json(), null);
    assert.deepStrictEqual(resp.headers.plain(), {
      'content-type': 'application/json',
    });
  });

  it('supports dynamic options', async () => {
    const fn = wrap(main).with(ims, { clientId: () => 'my-id' });
    const resp = await fn(new Request('https://www.example.com/'), DEFAULT_CONTEXT());

    assert.strictEqual(resp.status, 200);
    assert.deepStrictEqual(await resp.json(), null);
    assert.deepStrictEqual(resp.headers.plain(), {
      'content-type': 'application/json',
    });
  });

  it('responds with 401 for enforced auth', async () => {
    const fn = wrap(main).with(ims, {
      clientId: 'my-id',
      forceAuth: true,
    });
    const resp = await fn(new Request('https://www.example.com/'), DEFAULT_CONTEXT());

    assert.strictEqual(resp.status, 401);
    assert.deepStrictEqual(resp.headers.plain(), {
      'content-type': 'text/plain; charset=utf-8',
    });
  });

  describe('login', () => {
    it('responds with login redirect', async () => {
      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/'), DEFAULT_CONTEXT('/login'));
      assert.strictEqual(resp.status, 302);
      assert.deepStrictEqual(resp.headers.plain(), {
        'cache-control': 'no-store, private, must-revalidate',
        location: 'https://ims-na1-stg1.adobelogin.com/ims/authorize/v1?client_id=my-id&response_type=token&scope=AdobeID%2Copenid&state=1234&redirect_uri=https%3A%2F%2Fnull%2Flogin%2Fack&response_mode=query&prompt=none',
        'content-type': 'text/plain; charset=utf-8',
      });
    });

    it('accepts redirect response and sets cookie', async () => {
      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/'), {
        ...DEFAULT_CONTEXT('/login/ack'),
        data: { access_token: 'foo' },
      });
      assert.strictEqual(resp.status, 302);
      assert.deepStrictEqual(resp.headers.plain(), {
        'cache-control': 'no-store, private, must-revalidate',
        location: '/',
        'content-type': 'text/plain; charset=utf-8',
        'set-cookie': 'ims_access_token=foo; Path=/; HttpOnly; Secure',
      });
    });

    it('rejects redirect response and sends 2nd login redirect', async () => {
      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/'), {
        ...DEFAULT_CONTEXT('/login/ack'),
        data: { error: 'rejected' },
      });
      assert.strictEqual(resp.status, 302);
      assert.deepStrictEqual(resp.headers.plain(), {
        'cache-control': 'no-store, private, must-revalidate',
        location: 'https://ims-na1-stg1.adobelogin.com/ims/authorize/v1?client_id=my-id&response_type=token&scope=AdobeID%2Copenid&state=1234&redirect_uri=https%3A%2F%2Fnull%2Flogin%2Fack2&response_mode=query',
        'content-type': 'text/plain; charset=utf-8',
      });
    });

    it('accepts 2nd redirect response and sets cookie', async () => {
      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/'), {
        ...DEFAULT_CONTEXT('/login/ack2'),
        data: { access_token: 'foo' },
      });
      assert.strictEqual(resp.status, 302);
      assert.deepStrictEqual(resp.headers.plain(), {
        'cache-control': 'no-store, private, must-revalidate',
        location: '/',
        'content-type': 'text/plain; charset=utf-8',
        'set-cookie': 'ims_access_token=foo; Path=/; HttpOnly; Secure',
      });
    });

    it('accepts 2nd redirect to configured route', async () => {
      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
        rootPath: '/myapi',
        routeLoginSuccess: '/profile',
      });

      const resp = await fn(new Request('https://www.example.com/'), {
        ...DEFAULT_CONTEXT('/login/ack2'),
        data: { access_token: 'foo' },
      });
      assert.strictEqual(resp.status, 302);
      assert.deepStrictEqual(resp.headers.plain(), {
        'cache-control': 'no-store, private, must-revalidate',
        location: '/myapi/profile',
        'content-type': 'text/plain; charset=utf-8',
        'set-cookie': 'ims_access_token=foo; Path=/myapi; HttpOnly; Secure',
      });
    });

    it('rejects 2nd redirect response and responds with 401', async () => {
      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/'), {
        ...DEFAULT_CONTEXT('/login/ack2'),
        data: { error: 'invalid' },
      });
      assert.strictEqual(resp.status, 401);
      assert.deepStrictEqual(resp.headers.plain(), {
        'content-type': 'text/plain; charset=utf-8',
      });
    });
  });

  describe('logout', () => {
    it('sends logout request and responds with 200', async () => {
      nock('https://ims-na1-stg1.adobelogin.com')
        .post('/ims/logout/v1?client_id=my-id&access_token=foo')
        .reply(200);

      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/?ims_access_token=foo'), {
        ...DEFAULT_CONTEXT('/logout'),
        data: { ims_access_token: 'foo' },
      });

      assert.strictEqual(resp.status, 200);
      assert.deepStrictEqual(resp.headers.plain(), {
        'cache-control': 'no-store, private, must-revalidate',
        'content-type': 'text/plain; charset=utf-8',
        'set-cookie': 'ims_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure',
      });
    });

    it('sends logout even with not token', async () => {
      nock('https://ims-na1-stg1.adobelogin.com')
        .post('/ims/logout/v1?client_id=my-id')
        .reply(200);

      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/?ims_access_token=foo'), DEFAULT_CONTEXT('/logout'));

      assert.strictEqual(resp.status, 200);
      assert.deepStrictEqual(resp.headers.plain(), {
        'cache-control': 'no-store, private, must-revalidate',
        'content-type': 'text/plain; charset=utf-8',
        'set-cookie': 'ims_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure',
      });
    });

    it('handles error from logout', async () => {
      nock('https://ims-na1-stg1.adobelogin.com')
        .post('/ims/logout/v1?client_id=my-id&access_token=foo')
        .reply(500);

      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/?ims_access_token=foo'), {
        ...DEFAULT_CONTEXT('/logout'),
        data: { ims_access_token: 'foo' },
      });

      assert.strictEqual(resp.status, 200);
      assert.deepStrictEqual(resp.headers.plain(), {
        'cache-control': 'no-store, private, must-revalidate',
        'content-type': 'text/plain; charset=utf-8',
        'set-cookie': 'ims_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure',
      });
    });

    it('handles fetch errors during logout', async () => {
      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
        apiHost: '/foo',
      });

      const resp = await fn(new Request('https://www.example.com/?ims_access_token=foo'), {
        ...DEFAULT_CONTEXT('/logout'),
        data: { ims_access_token: 'foo' },
      });

      assert.strictEqual(resp.status, 200);
      assert.deepStrictEqual(resp.headers.plain(), {
        'cache-control': 'no-store, private, must-revalidate',
        'content-type': 'text/plain; charset=utf-8',
        'set-cookie': 'ims_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure',
      });
    });
  });

  describe('profile', () => {
    it('fetches profile with provided token (params)', async () => {
      nock('https://ims-na1-stg1.adobelogin.com')
        .post('/ims/profile/v1')
        .reply(imsProfileHandler());

      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/?ims_access_token=foo'), {
        ...DEFAULT_CONTEXT(),
        data: {
          ims_access_token: 'foo',
        },
      });

      assert.strictEqual(resp.status, 200);
      assert.deepStrictEqual(await resp.json(), {
        name: 'Test User',
        email: 'test@example.com',
        userId: '112233',
      });
      assert.deepStrictEqual(resp.headers.plain(), {
        'content-type': 'application/json',
      });
    });

    it('fetches profile with provided token (cookie)', async () => {
      nock('https://ims-na1-stg1.adobelogin.com')
        .post('/ims/profile/v1')
        .reply(imsProfileHandler());

      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/?ims_access_token=foo', {
        headers: {
          cookie: 'ims_access_token=foo',
        },
      }), DEFAULT_CONTEXT());

      assert.strictEqual(resp.status, 200);
      assert.deepStrictEqual(await resp.json(), {
        name: 'Test User',
        email: 'test@example.com',
        userId: '112233',
      });
      assert.deepStrictEqual(resp.headers.plain(), {
        'content-type': 'application/json',
      });
    });

    it('fetches profile with provided token (existing cookie)', async () => {
      nock('https://ims-na1-stg1.adobelogin.com')
        .post('/ims/profile/v1')
        .reply(imsProfileHandler());

      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/?ims_access_token=foo'), {
        ...DEFAULT_CONTEXT(),
        cookies: {
          ims_access_token: 'foo',
        },
      });

      assert.strictEqual(resp.status, 200);
      assert.deepStrictEqual(await resp.json(), {
        name: 'Test User',
        email: 'test@example.com',
        userId: '112233',
      });
      assert.deepStrictEqual(resp.headers.plain(), {
        'content-type': 'application/json',
      });
    });

    it('responds with 401 if profile could not be fetched due to error', async () => {
      nock('https://ims-na1-stg1.adobelogin.com')
        .post('/ims/profile/v1')
        .reply(500);

      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/?ims_access_token=foo', {
        headers: {
          cookie: 'ims_access_token=foo',
        },
      }), DEFAULT_CONTEXT());

      assert.strictEqual(resp.status, 401);
      assert.deepStrictEqual(resp.headers.plain(), {
        'content-type': 'text/plain; charset=utf-8',
      });
    });

    it('responds with 401 if profile could not be fetched due to 401', async () => {
      nock('https://ims-na1-stg1.adobelogin.com')
        .post('/ims/profile/v1')
        .reply(401);

      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
      });

      const resp = await fn(new Request('https://www.example.com/?ims_access_token=foo', {
        headers: {
          cookie: 'ims_access_token=foo',
        },
      }), DEFAULT_CONTEXT());

      assert.strictEqual(resp.status, 401);
      assert.deepStrictEqual(resp.headers.plain(), {
        'content-type': 'text/plain; charset=utf-8',
      });
    });

    it('responds with 401 if profile could not be fetched due fetch error', async () => {
      const fn = wrap(main).with(ims, {
        clientId: 'my-id',
        forceAuth: true,
        apiHost: '/foo',
      });

      const resp = await fn(new Request('https://www.example.com/?ims_access_token=foo', {
        headers: {
          cookie: 'ims_access_token=foo',
        },
      }), DEFAULT_CONTEXT());

      assert.strictEqual(resp.status, 401);
      assert.deepStrictEqual(resp.headers.plain(), {
        'content-type': 'text/plain; charset=utf-8',
      });
    });
  });
});
