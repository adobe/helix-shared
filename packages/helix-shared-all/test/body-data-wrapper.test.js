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
const { bodyData } = require('../src/body-data-wrapper');
const { wrap } = require('../src/index');

const log = {
  info: console.log,
  warn: console.log,
  error: console.error,
  debug: console.log,
};

describe('Body Data Wrapper Unit Tests (JSON Body)', () => {
  it('Loads JSON', async () => {
    const universalfunct = async (request, context) => {
      assert.deepStrictEqual(context.data, { foo: 'bar' });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
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
    assert.equal(response.status, 200, 'universal function should be executed');
  });
});

describe('Body Data Wrapper Unit Tests (URL Parameters)', () => {
  it('Loads URL Parameters', async () => {
    const universalfunct = async (request, context) => {
      assert.deepStrictEqual(context.data, { foo: 'bar' });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost?foo=bar', {
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 200, 'universal function should be executed');
  });

  it('Coerces Boolean from URL Parameters', async () => {
    const universalfunct = async (request, context) => {
      assert.deepStrictEqual(context.data, { foo: true, bar: 'untrue' });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData, { coerceBoolean: true });
    const response = await actualfunct(new Request('http://localhost?foo=true&bar=untrue', {
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 200, 'universal function should be executed');
  });

  it('Coerces Integers from URL Parameters', async () => {
    const universalfunct = async (request, context) => {
      assert.deepStrictEqual(context.data, { foo: 10, bar: '10.0', baz: '1.5' });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData, { coerceInt: true });
    const response = await actualfunct(new Request('http://localhost?foo=10&bar=10.0&baz=1.5', {
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 200, 'universal function should be executed');
  });

  it('Coerces Numbers from URL Parameters', async () => {
    const universalfunct = async (request, context) => {
      assert.deepStrictEqual(context.data, { foo: 10, bar: 10.0, baz: 1.5 });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData, { coerceNumber: true });
    const response = await actualfunct(new Request('http://localhost?foo=10&bar=10.0&baz=1.5', {
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 200, 'universal function should be executed');
  });

  it('Loads duplicate URL Parameters into arrays', async () => {
    const universalfunct = async (request, context) => {
      assert.deepStrictEqual(context.data, { foo: ['bar', 'baz'] });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost?foo=bar&foo=baz', {
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 200, 'universal function should be executed');
  });

  it('Loads indexed URL Parameters into arrays', async () => {
    const universalfunct = async (request, context) => {
      assert.deepStrictEqual(context.data, { foo: ['bar', 'baz'] });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost?foo[]=bar&foo[]=baz', {
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 200, 'universal function should be executed');
  });

  it('Loads numbered indexed URL Parameters into arrays', async () => {
    const universalfunct = async (request, context) => {
      const expected = [];
      expected[1] = 'bar';
      expected[2] = 'baz';
      assert.deepStrictEqual(context.data, { foo: expected });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost?foo[1]=bar&foo[2]=baz', {
    }), {
      log,
      invocation: {

      },
    });
    assert.equal(response.status, 200, 'universal function should be executed');
  });
});

describe('Body Data Wrapper Unit Tests (Form Data)', () => {
  it('Loads Form Data', async () => {
    const universalfunct = async (request, context) => {
      assert.deepStrictEqual(context.data, { foo: 'bar' });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost', {
      body: 'foo=bar',
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
