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
import YAML from 'yaml';
import { Request, Response } from '@adobe/fetch';

import wrap from '@adobe/helix-shared-wrap';
import bodyData from '../src/body-data-wrapper.js';

const log = {
  info: console.log,
  warn: console.log,
  error: console.error,
  debug: console.log,
};

describe('Body Data Wrapper Unit Tests (JSON Body)', () => {
  ['POST', 'post', 'PUT', 'PATCH', 'DELETE'].forEach((method) => {
    it(`Loads JSON (${method})`, async () => {
      const universalfunct = async (request, context) => {
        assert.deepStrictEqual(context.data, { foo: 'bar' });
        return new Response('ok');
      };

      const actualfunct = wrap(universalfunct).with(bodyData);
      const response = await actualfunct(new Request('http://localhost', {
        body: JSON.stringify({ foo: 'bar' }),
        method,
        headers: {
          'content-type': 'application/json',
        },
      }), {
        log,
      });
      assert.strictEqual(response.status, 200, 'universal function should be executed');
    });
  });

  it('Responds with 400 for invalid json body', async () => {
    const universalfunct = async (request, context) => {
      assert.deepStrictEqual(context.data, { foo: 'bar' });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost', {
      body: 'this is no jason?',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }), {
      log,
    });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.headers.get('x-error'), 'error parsing request body');
  });

  it('Responds with 400 for invalid json body and handles context with no log', async () => {
    const universalfunct = async (request, context) => {
      assert.deepStrictEqual(context.data, { foo: 'bar' });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost', {
      body: 'this is no jason?',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }), {
    });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.headers.get('x-error'), 'error parsing request body');
  });

  it('Ignores body for GET requests.', async () => {
    const universalfunct = async (request, context) => {
      assert.deepEqual(context.data, { });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost', {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
    }), {
      log,
    });
    assert.strictEqual(response.status, 200);
  });
});

describe('Body Data Wrapper Unit Tests (URL Parameters)', () => {
  it('Loads URL Parameters', async () => {
    const universalfunct = async (request, context) => {
      assert.deepEqual(context.data, { foo: 'bar' });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost?foo=bar', {
    }), {
      log,
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
  });

  it('Loads URL Parameters for POST requests', async () => {
    const universalfunct = async (request, context) => {
      assert.deepEqual(context.data, { foo: 'bar' });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost?foo=bar', {
      method: 'POST',
      headers: {
        'content-type': 'application/xml',
      },
    }), {
      log,
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
  });

  it('Coerces Boolean from URL Parameters', async () => {
    const universalfunct = async (request, context) => {
      assert.deepEqual(context.data, { foo: true, bar: 'untrue' });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData, { coerceBoolean: true });
    const response = await actualfunct(new Request('http://localhost?foo=true&bar=untrue', {
    }), {
      log,
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
  });

  it('Coerces Integers from URL Parameters', async () => {
    const universalfunct = async (request, context) => {
      assert.deepEqual(context.data, { foo: 10, bar: '10.0', baz: '1.5' });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData, { coerceInt: true });
    const response = await actualfunct(new Request('http://localhost?foo=10&bar=10.0&baz=1.5', {
    }), {
      log,
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
  });

  it('Coerces Numbers from URL Parameters', async () => {
    const universalfunct = async (request, context) => {
      assert.deepEqual(context.data, {
        foo: 10, bar: 10.0, baz: 1.5, date: '2021-09-30:13:00:00',
      });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData, { coerceNumber: true });
    const response = await actualfunct(new Request('http://localhost?foo=10&bar=10.0&baz=1.5&date=2021-09-30:13:00:00', {
    }), {
      log,
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
  });

  it('Loads duplicate URL Parameters into arrays', async () => {
    const universalfunct = async (request, context) => {
      assert.deepEqual(context.data, { foo: ['bar', 'baz'] });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost?foo=bar&foo=baz', {
    }), {
      log,
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
  });

  it('Loads indexed URL Parameters into arrays', async () => {
    const universalfunct = async (request, context) => {
      assert.deepEqual(context.data, { foo: ['bar', 'baz'] });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost?foo[]=bar&foo[]=baz', {
    }), {
      log,
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
  });

  it('Loads numbered indexed URL Parameters into arrays', async () => {
    const universalfunct = async (request, context) => {
      const expected = [];
      expected[1] = 'bar';
      expected[2] = 'baz';
      assert.deepEqual(context.data, { foo: expected });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost?foo[1]=bar&foo[2]=baz', {
    }), {
      log,
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
  });
});

describe('Body Data Wrapper Unit Tests (Form Data)', () => {
  it('Loads Form Data', async () => {
    const universalfunct = async (request, context) => {
      assert.deepEqual(context.data, { foo: 'bar' });
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
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
  });

  it('Loads Form Data for DELETE requests', async () => {
    const universalfunct = async (request, context) => {
      assert.deepEqual(context.data, { foo: 'bar' });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost', {
      body: 'foo=bar',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }), {
      log,
    });
    assert.strictEqual(response.status, 200, 'universal function should be executed');
  });
});

describe('Body Data Wrapper Unit Tests (YAML Body)', () => {
  const contents = { indices: [] };

  ['POST', 'post', 'PUT', 'PATCH', 'DELETE'].forEach((method) => {
    ['text/yaml', 'application/x-yaml'].forEach((yamlType) => {
      it(`Loads YAML with type ${yamlType} (${method})`, async () => {
        const universalfunct = async (request, context) => {
          const yaml = YAML.parse(context.data);
          assert.deepStrictEqual(yaml, contents);
          return new Response('ok');
        };

        const actualfunct = wrap(universalfunct).with(bodyData, { supportYAML: true });
        const response = await actualfunct(new Request('http://localhost', {
          body: YAML.stringify(contents),
          method,
          headers: {
            'content-type': yamlType,
          },
        }), {
          log,
        });
        assert.strictEqual(response.status, 200, 'universal function should be executed');
      });
    });
  });

  it('Ignores body for GET requests.', async () => {
    const universalfunct = async (request, context) => {
      assert.deepEqual(context.data, { });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData, { supportYAML: true });
    const response = await actualfunct(new Request('http://localhost', {
      method: 'GET',
      headers: {
        'content-type': 'text/yaml',
      },
    }), {
      log,
    });
    assert.strictEqual(response.status, 200);
  });

  it('Ignores body when support YAML is not enabled.', async () => {
    const universalfunct = async (request, context) => {
      assert.deepEqual(context.data, { });
      return new Response('ok');
    };

    const actualfunct = wrap(universalfunct).with(bodyData);
    const response = await actualfunct(new Request('http://localhost', {
      body: YAML.stringify(contents),
      method: 'POST',
      headers: {
        'content-type': 'text/yaml',
      },
    }), {
      log,
    });
    assert.strictEqual(response.status, 200);
  });
});
