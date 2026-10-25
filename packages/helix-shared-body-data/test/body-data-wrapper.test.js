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
import { Readable } from 'stream';
import YAML from 'yaml';
import { Request, Response } from '@adobe/fetch';

import wrap from '@adobe/helix-shared-wrap';
import bodyData, { MAX_ARRAY_INDEX } from '../src/body-data-wrapper.js';

const log = {
  info: console.log,
  warn: console.log,
  error: console.error,
  debug: console.log,
};

/**
 * Runs the request through the wrapper and returns the response, plus the request and
 * `context.data` the wrapped function got.
 */
async function run(request, opts, context = { log }) {
  const seen = {};
  const fn = wrap(async (req, ctx) => {
    seen.request = req;
    seen.data = ctx.data;
    return new Response('ok');
  }).with(bodyData, opts);
  const response = await fn(request, context);
  return { response, seen };
}

/**
 * The query and form objects have no prototype, so copy them before deepStrictEqual.
 */
function plain(data) {
  const copy = { ...data, query: { ...data.query } };
  if (data.type === 'form') {
    copy.body = { ...data.body };
  }
  return copy;
}

function send(url, body, contentType, method = 'POST', headers = {}) {
  return new Request(url, {
    method,
    body,
    headers: { 'content-type': contentType, ...headers },
  });
}

/**
 * Headers from another installed copy of @adobe/fetch: same methods, but not an instance of the
 * Headers class this package imports. The helix-universal adapters can bring their own copy.
 */
class OtherHeaders {
  constructor(headers) {
    this.headers = headers;
  }

  get(name) {
    return this.headers.get(name);
  }

  raw() {
    return this.headers.raw();
  }
}

function fromOtherFetchCopy(request) {
  const headers = new OtherHeaders(request.headers);
  return new Proxy(request, {
    get: (target, prop) => {
      if (prop === 'headers') {
        return headers;
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

async function assertError(response, status, error) {
  assert.strictEqual(response.status, status);
  assert.strictEqual(response.headers.get('x-error'), error);
}

describe('Body Data Wrapper (query)', () => {
  it('puts the URL parameters into data.query', async () => {
    const request = new Request('http://localhost?foo=bar');
    const { response, seen } = await run(request);
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(plain(seen.data), { query: { foo: 'bar' } });
    assert.strictEqual(Object.getPrototypeOf(seen.data.query), null);
    assert.strictEqual(seen.request, request);
  });

  ['GET', 'DELETE', 'POST', 'PUT', 'PATCH'].forEach((method) => {
    it(`parses the query for ${method} requests without a body`, async () => {
      const { seen } = await run(new Request('http://localhost?foo=bar', { method }));
      assert.deepStrictEqual(plain(seen.data), { query: { foo: 'bar' } });
    });
  });

  it('coerces booleans', async () => {
    const { seen } = await run(new Request('http://localhost?foo=true&bar=untrue'), { coerceBoolean: true });
    assert.deepStrictEqual(plain(seen.data), { query: { foo: true, bar: 'untrue' } });
  });

  it('coerces integers', async () => {
    const { seen } = await run(new Request('http://localhost?foo=10&bar=10.0&baz=1.5'), { coerceInt: true });
    assert.deepStrictEqual(plain(seen.data), { query: { foo: 10, bar: '10.0', baz: '1.5' } });
  });

  it('coerces numbers', async () => {
    const { seen } = await run(new Request('http://localhost?foo=10&bar=10.0&baz=1.5&date=2021-09-30:13:00:00'), { coerceNumber: true });
    assert.deepStrictEqual(plain(seen.data), {
      query: {
        foo: 10, bar: 10.0, baz: 1.5, date: '2021-09-30:13:00:00',
      },
    });
  });

  it('coerces only well-formed numbers', async () => {
    const { seen } = await run(new Request('http://localhost?version=1.2.3&ip=192.168.1.1&neg=-5&negf=-1.5&exp=2e3&dot=.&trailing=10e&frac=.5'), { coerceNumber: true });
    assert.deepStrictEqual(plain(seen.data), {
      query: {
        version: '1.2.3',
        ip: '192.168.1.1',
        neg: -5,
        negf: -1.5,
        exp: 2e3,
        dot: '.',
        trailing: '10e',
        frac: 0.5,
      },
    });
  });

  it('puts repeated parameters into arrays', async () => {
    const { seen } = await run(new Request('http://localhost?foo=bar&foo=baz'));
    assert.deepStrictEqual(plain(seen.data), { query: { foo: ['bar', 'baz'] } });
  });

  it('puts indexed parameters into arrays', async () => {
    const { seen } = await run(new Request('http://localhost?foo[]=bar&foo[]=baz'));
    assert.deepStrictEqual(plain(seen.data), { query: { foo: ['bar', 'baz'] } });
  });

  it('puts numbered parameters into arrays', async () => {
    const { seen } = await run(new Request('http://localhost?foo[1]=bar&foo[2]=baz'));
    const expected = [];
    expected[1] = 'bar';
    expected[2] = 'baz';
    assert.deepStrictEqual(plain(seen.data), { query: { foo: expected } });
  });

  it('mixes indexed and repeated parameters', async () => {
    const { seen } = await run(new Request('http://localhost?foo[]=a&foo[1]=b&bar=1&bar=2'));
    assert.deepStrictEqual(plain(seen.data), { query: { foo: ['a', 'b'], bar: ['1', '2'] } });
  });

  it('keeps prototype names as plain keys', async () => {
    const { seen } = await run(new Request('http://localhost?__proto__=a&constructor=b&toString[]=c'));
    const { query } = seen.data;
    assert.strictEqual(Object.getPrototypeOf(query), null);
    assert.deepStrictEqual(Object.keys(query), ['__proto__', 'constructor', 'toString']);
    assert.strictEqual(query.constructor, 'b');
    assert.deepStrictEqual(query.toString, ['c']);
  });

  it('accepts an array index up to the limit', async () => {
    const { response, seen } = await run(new Request(`http://localhost?foo[${MAX_ARRAY_INDEX}]=bar`));
    assert.strictEqual(response.status, 200);
    assert.strictEqual(seen.data.query.foo.length, MAX_ARRAY_INDEX + 1);
    assert.strictEqual(seen.data.query.foo[MAX_ARRAY_INDEX], 'bar');
  });

  it('responds with 400 for an array index above the limit', async () => {
    const { response, seen } = await run(new Request(`http://localhost?foo[${MAX_ARRAY_INDEX + 1}]=bar`));
    await assertError(response, 400, 'error parsing request body');
    assert.strictEqual(seen.data, undefined);
  });

  it('responds with 400 for a bad query even if the JSON body is fine', async () => {
    const { response } = await run(send(`http://localhost?foo[${MAX_ARRAY_INDEX + 1}]=bar`, '{"a":1}', 'application/json'));
    await assertError(response, 400, 'error parsing request body');
  });
});

describe('Body Data Wrapper (JSON body)', () => {
  ['POST', 'post', 'PUT', 'PATCH', 'patch'].forEach((method) => {
    it(`reads a JSON body (${method})`, async () => {
      const { response, seen } = await run(send('http://localhost', JSON.stringify({ foo: 'bar' }), 'application/json', method));
      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(plain(seen.data), { query: {}, body: { foo: 'bar' }, type: 'json' });
    });
  });

  it('keeps the query next to the JSON body', async () => {
    const { seen } = await run(send('http://localhost?a=1', JSON.stringify({ b: 2 }), 'application/json'));
    assert.deepStrictEqual(plain(seen.data), { query: { a: '1' }, body: { b: 2 }, type: 'json' });
  });

  [
    'application/vnd.api+json',
    'application/ld+json',
    'application/json; charset=utf-8',
    'application/json ; charset=utf-8',
    'Application/JSON',
    'text/json',
  ].forEach((type) => {
    it(`reads JSON with type ${type}`, async () => {
      const { seen } = await run(send('http://localhost', JSON.stringify({ foo: 'bar' }), type));
      assert.deepStrictEqual(plain(seen.data), { query: {}, body: { foo: 'bar' }, type: 'json' });
    });
  });

  it('reads a JSON array body', async () => {
    const { seen } = await run(send('http://localhost', JSON.stringify(['a', 'b']), 'application/json'));
    assert.deepStrictEqual(plain(seen.data), { query: {}, body: ['a', 'b'], type: 'json' });
  });

  it('does not coerce JSON values', async () => {
    const { seen } = await run(send('http://localhost?q=true', '{"j":"true","n":"1"}', 'application/json'), { coerceBoolean: true, coerceInt: true });
    assert.deepStrictEqual(plain(seen.data), { query: { q: true }, body: { j: 'true', n: '1' }, type: 'json' });
  });

  [
    ['invalid JSON', 'this is no jason?'],
    ['an empty body', ''],
    ['a JSON string', '""'],
    ['JSON null', 'null'],
    ['a JSON number', '42'],
  ].forEach(([name, body]) => {
    it(`responds with 400 for ${name}`, async () => {
      const { response, seen } = await run(send('http://localhost', body, 'application/json'));
      await assertError(response, 400, 'error parsing request body');
      assert.strictEqual(seen.data, undefined);
    });
  });

  it('responds with 400 for invalid JSON when the context has no log', async () => {
    const { response } = await run(send('http://localhost', 'this is no jason?', 'application/json'), {}, {});
    await assertError(response, 400, 'error parsing request body');
  });

  it('does not read JSON-like subtypes', async () => {
    const request = send('http://localhost?foo=zoo', '{"a":1}\n{"b":2}', 'application/json-seq');
    const { seen } = await run(request);
    assert.deepStrictEqual(plain(seen.data), { query: { foo: 'zoo' } });
    assert.strictEqual(seen.request, request);
    assert.strictEqual(await seen.request.text(), '{"a":1}\n{"b":2}');
  });

  it('does not read a JSON body on DELETE', async () => {
    const request = send('http://localhost?foo=bar', JSON.stringify({ a: 1 }), 'application/json', 'DELETE');
    const { response, seen } = await run(request);
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(plain(seen.data), { query: { foo: 'bar' } });
    assert.strictEqual(seen.request, request);
    assert.deepStrictEqual(await seen.request.json(), { a: 1 });
  });

  it('ignores the content type on GET', async () => {
    const { seen } = await run(new Request('http://localhost', { headers: { 'content-type': 'application/json' } }));
    assert.deepStrictEqual(plain(seen.data), { query: {} });
  });
});

describe('Body Data Wrapper (form body)', () => {
  it('reads a form body', async () => {
    const { seen } = await run(send('http://localhost', 'foo=bar', 'application/x-www-form-urlencoded'));
    assert.deepStrictEqual(plain(seen.data), { query: {}, body: { foo: 'bar' }, type: 'form' });
    assert.strictEqual(Object.getPrototypeOf(seen.data.body), null);
  });

  it('keeps the query next to the form body', async () => {
    const { seen } = await run(send('http://localhost?a=1', 'b=2', 'application/x-www-form-urlencoded; charset=UTF-8'));
    assert.deepStrictEqual(plain(seen.data), { query: { a: '1' }, body: { b: '2' }, type: 'form' });
  });

  it('reads a form body with an uppercase type', async () => {
    const { seen } = await run(send('http://localhost', 'foo=bar', 'Application/X-WWW-Form-URLEncoded'));
    assert.deepStrictEqual(plain(seen.data), { query: {}, body: { foo: 'bar' }, type: 'form' });
  });

  it('coerces form values like query values', async () => {
    const { seen } = await run(send('http://localhost?q=true&n=1', 'f=false&m=2', 'application/x-www-form-urlencoded'), { coerceBoolean: true, coerceInt: true });
    assert.deepStrictEqual(plain(seen.data), {
      query: { q: true, n: 1 },
      body: { f: false, m: 2 },
      type: 'form',
    });
  });

  it('parses indexed, repeated and prototype keys in a form body like the query', async () => {
    const { seen } = await run(send('http://localhost', 'foo[]=a&foo[1]=b&bar=1&bar=2&__proto__=x', 'application/x-www-form-urlencoded'));
    assert.deepStrictEqual(Object.keys(seen.data.body), ['foo', 'bar', '__proto__']);
    assert.deepStrictEqual(plain(seen.data).body, { foo: ['a', 'b'], bar: ['1', '2'], ['__proto__']: 'x' });
  });

  it('responds with 400 for a huge array index in a form body', async () => {
    const { response } = await run(send('http://localhost', 'foo[4294967294]=bar', 'application/x-www-form-urlencoded'));
    await assertError(response, 400, 'error parsing request body');
  });

  it('does not read a form body on DELETE', async () => {
    const { seen } = await run(send('http://localhost?foo=zoo', 'foo=bar', 'application/x-www-form-urlencoded', 'DELETE'));
    assert.deepStrictEqual(plain(seen.data), { query: { foo: 'zoo' } });
  });
});

describe('Body Data Wrapper (YAML body)', () => {
  const contents = { indices: [] };

  ['POST', 'post', 'PUT', 'PATCH'].forEach((method) => {
    ['text/yaml', 'application/x-yaml', 'application/yaml', 'TEXT/YAML', 'text/yaml; charset=utf-8'].forEach((yamlType) => {
      it(`reads YAML with type ${yamlType} (${method})`, async () => {
        const { seen } = await run(send('http://localhost', YAML.stringify(contents), yamlType, method));
        assert.strictEqual(seen.data.type, 'yaml');
        assert.deepStrictEqual(YAML.parse(seen.data.body), contents);
      });
    });
  });

  [undefined, false, true].forEach((supportYAML) => {
    it(`reads YAML no matter what supportYAML says (${supportYAML})`, async () => {
      const { seen } = await run(send('http://localhost?a=1', 'foo: bar\n', 'text/yaml'), { supportYAML });
      assert.deepStrictEqual(plain(seen.data), { query: { a: '1' }, body: 'foo: bar\n', type: 'yaml' });
    });
  });

  it('does not read types that only start like YAML', async () => {
    const { seen } = await run(send('http://localhost', 'foo: bar\n', 'application/yamlfoo'));
    assert.deepStrictEqual(plain(seen.data), { query: {} });
  });

  it('ignores the content type on GET', async () => {
    const { seen } = await run(new Request('http://localhost', { headers: { 'content-type': 'text/yaml' } }));
    assert.deepStrictEqual(plain(seen.data), { query: {} });
  });
});

describe('Body Data Wrapper (text body)', () => {
  ['text/plain', 'text/plain; charset=utf-8', 'text/html', 'text/csv', 'Text/Markdown'].forEach((type) => {
    it(`reads text with type ${type}`, async () => {
      const { seen } = await run(send('http://localhost?a=1', 'hello', type));
      assert.deepStrictEqual(plain(seen.data), { query: { a: '1' }, body: 'hello', type: 'text' });
    });
  });

  it('reads an empty text body', async () => {
    const { seen } = await run(send('http://localhost', '', 'text/plain'));
    assert.deepStrictEqual(plain(seen.data), { query: {}, body: '', type: 'text' });
  });

  it('decodes text as UTF-8', async () => {
    const { seen } = await run(send('http://localhost', Buffer.from('äöü €', 'utf-8'), 'text/plain'));
    assert.strictEqual(seen.data.body, 'äöü €');
  });

  it('reads JSON sent as text/plain as a string, and the function can still parse it', async () => {
    const { seen } = await run(send('http://localhost', '{"a":1}', 'text/plain'));
    assert.deepStrictEqual(plain(seen.data), { query: {}, body: '{"a":1}', type: 'text' });
    assert.deepStrictEqual(await seen.request.json(), { a: 1 });
  });
});

describe('Body Data Wrapper (bodies it does not read)', () => {
  [
    'application/octet-stream',
    'image/png',
    'application/xml',
    'multipart/form-data; boundary="x/json;y"',
    'multipart/form-data; boundary=x/yaml',
    'json',
    'application/json/extra',
    '/json',
    'text/',
    'text/plain/x',
    'application/x-www-form-urlencoded/x',
  ].forEach((type) => {
    it(`passes the request on unchanged for type ${type}`, async () => {
      const bytes = Buffer.from([0, 1, 2, 250, 251, 252]);
      const request = send('http://localhost?foo=bar', bytes, type);
      const { response, seen } = await run(request, { supportYAML: true });
      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(plain(seen.data), { query: { foo: 'bar' } });
      assert.strictEqual(seen.request, request);
      assert.deepStrictEqual(await seen.request.buffer(), bytes);
    });
  });

  it('passes the request on unchanged without a content type', async () => {
    const request = new Request('http://localhost?foo=bar', { method: 'POST', body: Buffer.from('abc') });
    request.headers.delete('content-type');
    const { seen } = await run(request);
    assert.deepStrictEqual(plain(seen.data), { query: { foo: 'bar' } });
    assert.strictEqual(seen.request, request);
    assert.strictEqual(await seen.request.text(), 'abc');
  });

  it('passes a cloned request on unchanged', async () => {
    const request = send('http://localhost', Buffer.from('abc'), 'application/octet-stream').clone();
    const { seen } = await run(request);
    assert.strictEqual(seen.request.method, 'POST');
    assert.strictEqual(await seen.request.text(), 'abc');
  });
});

describe('Body Data Wrapper (request handed to the function)', () => {
  const json = '{"a":1}';
  [
    ['a string', () => json],
    ['a Buffer', () => Buffer.from(json)],
    ['a stream', () => Readable.from(['{"a"', ':1}'])],
  ].forEach(([name, body]) => {
    it(`lets the function read a JSON body again when it came as ${name}`, async () => {
      const request = send('http://localhost?x=1', body(), 'application/json', 'PUT', { 'x-foo': 'bar' });
      const { seen } = await run(request);
      assert.deepStrictEqual(seen.data.body, { a: 1 });
      assert.strictEqual(seen.request.method, 'PUT');
      assert.strictEqual(seen.request.url, 'http://localhost/?x=1');
      assert.strictEqual(seen.request.headers.get('x-foo'), 'bar');
      assert.strictEqual(seen.request.headers.get('content-type'), 'application/json');
      assert.strictEqual(await seen.request.text(), json);
    });
  });

  it('lets the function read the body of a cloned request again', async () => {
    const request = send('http://localhost', json, 'application/json').clone();
    const { seen } = await run(request);
    assert.deepStrictEqual(seen.data.body, { a: 1 });
    assert.strictEqual(seen.request.method, 'POST');
    assert.strictEqual(await seen.request.text(), json);
  });

  it('keeps the headers of a request made with another copy of @adobe/fetch', async () => {
    const request = fromOtherFetchCopy(send('http://localhost', json, 'application/json', 'POST', {
      authorization: 'Bearer token',
      cookie: 'ims_access_token=abc',
      'x-forwarded-host': 'www.example.com',
    }));
    const { seen } = await run(request);
    assert.deepStrictEqual(seen.data.body, { a: 1 });
    assert.strictEqual(seen.request.headers.get('authorization'), 'Bearer token');
    assert.strictEqual(seen.request.headers.get('cookie'), 'ims_access_token=abc');
    assert.strictEqual(seen.request.headers.get('x-forwarded-host'), 'www.example.com');
    assert.strictEqual(seen.request.headers.get('content-type'), 'application/json');
    assert.strictEqual(await seen.request.text(), json);
  });

  it('keeps the options of a cloned request', async () => {
    const controller = new AbortController();
    const request = new Request('http://localhost', {
      method: 'POST',
      body: json,
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      redirect: 'manual',
      cache: 'no-store',
      follow: 1,
      counter: 2,
      compress: false,
      decode: false,
    }).clone();
    const { seen } = await run(request);
    assert.deepStrictEqual(seen.data.body, { a: 1 });
    assert.strictEqual(seen.request.signal, controller.signal);
    assert.strictEqual(seen.request.redirect, 'manual');
    assert.strictEqual(seen.request.cache, 'no-store');
    assert.strictEqual(seen.request.follow, 1);
    assert.strictEqual(seen.request.counter, 2);
    assert.strictEqual(seen.request.compress, false);
    assert.strictEqual(seen.request.decode, false);
  });

  it('lets the function read a URLSearchParams body again', async () => {
    const request = new Request('http://localhost', { method: 'POST', body: new URLSearchParams({ a: '1', b: '2' }) });
    const { seen } = await run(request);
    assert.deepStrictEqual(plain(seen.data), { query: {}, body: { a: '1', b: '2' }, type: 'form' });
    assert.strictEqual(await seen.request.text(), 'a=1&b=2');
  });

  it('lets the function read the body with json()', async () => {
    const { seen } = await run(send('http://localhost', json, 'application/json'));
    assert.deepStrictEqual(await seen.request.json(), { a: 1 });
  });

  it('lets the function read the body with buffer()', async () => {
    const { seen } = await run(send('http://localhost', 'foo: bar\n', 'text/yaml'));
    assert.deepStrictEqual(await seen.request.buffer(), Buffer.from('foo: bar\n'));
  });
});

describe('Body Data Wrapper (maxBodySize)', () => {
  const noop = async () => new Response('ok');

  [-1, 1.5, '10', NaN, Infinity, null].forEach((maxBodySize) => {
    it(`throws for maxBodySize ${maxBodySize}`, () => {
      assert.throws(() => bodyData(noop, { maxBodySize }), /maxBodySize/);
    });
  });

  it('has no limit by default', async () => {
    const big = 'x'.repeat(1024 * 1024);
    const { seen } = await run(send('http://localhost', big, 'text/plain'));
    assert.strictEqual(seen.data.body.length, big.length);
  });

  it('responds with 413 when the body and its content-length are too big', async () => {
    const request = send('http://localhost', '{"a":1}', 'application/json', 'POST', { 'content-length': '7' });
    const { response, seen } = await run(request, { maxBodySize: 5 });
    await assertError(response, 413, 'request body too large');
    assert.strictEqual(seen.data, undefined);
  });

  it('goes by the bytes it reads, not by a bigger content-length', async () => {
    const request = send('http://localhost', '{"a":1}', 'application/json', 'POST', { 'content-length': '100' });
    const { response, seen } = await run(request, { maxBodySize: 7 });
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(seen.data.body, { a: 1 });
  });

  it('responds with 413 when the body is too big and there is no content-length', async () => {
    const { response } = await run(send('http://localhost', '{"a":1}', 'application/json'), { maxBodySize: 5 });
    await assertError(response, 413, 'request body too large');
  });

  it('responds with 413 when the content-length is smaller than the body', async () => {
    const request = send('http://localhost', '{"a":1}', 'application/json', 'POST', { 'content-length': '2' });
    const { response } = await run(request, { maxBodySize: 5 });
    await assertError(response, 413, 'request body too large');
  });

  it('ignores a content-length that is not a number', async () => {
    const request = send('http://localhost', '{"a":1}', 'application/json', 'POST', { 'content-length': 'abc' });
    const { response, seen } = await run(request, { maxBodySize: 7 });
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(seen.data.body, { a: 1 });
  });

  it('accepts a body exactly at the limit', async () => {
    const { response, seen } = await run(send('http://localhost', '{"a":1}', 'application/json'), { maxBodySize: 7 });
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(seen.data.body, { a: 1 });
  });

  it('counts bytes, not characters', async () => {
    const tooBig = await run(send('http://localhost', 'äö', 'text/plain'), { maxBodySize: 3 });
    await assertError(tooBig.response, 413, 'request body too large');
    const fits = await run(send('http://localhost', 'äö', 'text/plain'), { maxBodySize: 4 });
    assert.strictEqual(fits.seen.data.body, 'äö');
  });

  it('counts the raw bytes of invalid UTF-8', async () => {
    const bytes = () => Buffer.from([0xff, 0xfe, 0xfd]);
    const tooBig = await run(send('http://localhost', bytes(), 'text/plain'), { maxBodySize: 2 });
    await assertError(tooBig.response, 413, 'request body too large');
    const fits = await run(send('http://localhost', bytes(), 'text/plain'), { maxBodySize: 3 });
    assert.strictEqual(fits.seen.data.body, '\ufffd\ufffd\ufffd');
  });

  it('allows only empty bodies with a limit of 0', async () => {
    const empty = await run(send('http://localhost', '', 'text/plain'), { maxBodySize: 0 });
    assert.strictEqual(empty.seen.data.body, '');
    const oneByte = await run(send('http://localhost', 'a', 'text/plain'), { maxBodySize: 0 });
    await assertError(oneByte.response, 413, 'request body too large');
  });

  it('applies to form and YAML bodies', async () => {
    const form = await run(send('http://localhost', 'foo=bar', 'application/x-www-form-urlencoded'), { maxBodySize: 3 });
    await assertError(form.response, 413, 'request body too large');
    const yaml = await run(send('http://localhost', 'foo: bar\n', 'text/yaml'), { maxBodySize: 3 });
    await assertError(yaml.response, 413, 'request body too large');
  });

  it('does not apply to bodies the wrapper does not read', async () => {
    const bytes = Buffer.alloc(10, 1);
    const request = send('http://localhost', bytes, 'application/octet-stream', 'POST', { 'content-length': '10' });
    const { response, seen } = await run(request, { maxBodySize: 2 });
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(await seen.request.buffer(), bytes);
  });

  it('does not apply to a JSON body on DELETE', async () => {
    const { response } = await run(send('http://localhost', '{"a":1}', 'application/json', 'DELETE'), { maxBodySize: 2 });
    assert.strictEqual(response.status, 200);
  });

  it('reports a bad query before a body that is too big', async () => {
    const { response } = await run(send(`http://localhost?foo[${MAX_ARRAY_INDEX + 1}]=bar`, '{"a":1}', 'application/json'), { maxBodySize: 2 });
    await assertError(response, 400, 'error parsing request body');
  });

  it('reports a body that is too big before invalid JSON', async () => {
    const { response } = await run(send('http://localhost', 'this is no jason?', 'application/json'), { maxBodySize: 2 });
    await assertError(response, 413, 'request body too large');
  });

  it('responds with 413 when the context has no log', async () => {
    const { response } = await run(send('http://localhost', '{"a":1}', 'application/json'), { maxBodySize: 2 }, {});
    await assertError(response, 413, 'request body too large');
  });
});
