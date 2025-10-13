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

/* eslint-env mocha */
import { Response } from '@adobe/fetch';
import assert from 'assert';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import xml2js from 'xml2js';
import zlib from 'zlib';
import { Nock } from './utils.js';
import { HelixStorage, parseBucketNames, resolveMetadataForCopy } from '../src/storage.js';

const gzip = promisify(zlib.gzip);

const AWS_REGION = 'fake';
const AWS_ACCESS_KEY_ID = 'fake';
const AWS_SECRET_ACCESS_KEY = 'fake';

const CLOUDFLARE_ACCOUNT_ID = 'fake';
const CLOUDFLARE_R2_ACCESS_KEY_ID = 'fake';
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = 'fake';

const TEST_HEADERS = [
  'content-type',
  'content-encoding',
  'x-amz-meta-myid',
];

describe('Storage test', () => {
  let nock;
  let storage;

  beforeEach(() => {
    nock = new Nock().env();
    storage = new HelixStorage({
      region: AWS_REGION,
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      r2AccountId: CLOUDFLARE_ACCOUNT_ID,
      r2AccessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
      r2SecretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      bucketMap: parseBucketNames(),
    });
  });

  afterEach(() => {
    nock.done();
    storage.close();
  });

  it('resolveMetadataForCopy() resolves metadata', () => {
    const meta = resolveMetadataForCopy(
      {
        Metadata: {
          foo: 1,
          bar: 2,
          baz: 3,
        },
        LastModified: '0',
      },
      { foo: 'bar', baz: 'foo' },
      { bar: 5, qux: 5 },
    );
    assert.deepStrictEqual(meta, {
      foo: 3,
      bar: 5,
      qux: 5,
    });
  });

  it('resolveMetadataForCopy() allows undefined params', () => {
    let meta = resolveMetadataForCopy();
    assert.deepStrictEqual(meta, {});

    meta = resolveMetadataForCopy({ Metadata: { foo: '1' } });
    assert.deepStrictEqual(meta, { foo: '1' });

    meta = resolveMetadataForCopy(undefined, { foo: 'bar' });
    assert.deepStrictEqual(meta, { });

    meta = resolveMetadataForCopy(undefined, undefined, { foo: '1' });
    assert.deepStrictEqual(meta, { foo: '1' });
  });

  it('resolveMetadataForCopy() prefers renameMetadata over existingMetadata', () => {
    const meta = resolveMetadataForCopy({ Metadata: { foo: '1', bar: '2' } }, { foo: 'bar' });
    assert.deepStrictEqual(meta, { bar: '1' });
  });

  it('resolveMetadataForCopy() prefers addMetadata over renameMetadata', () => {
    const meta = resolveMetadataForCopy({ Metadata: { foo: '1' } }, { foo: 'bar' }, { bar: 'baz' });
    assert.deepStrictEqual(meta, { bar: 'baz' });
  });

  it('resolveMetadataForCopy() rename allows cycles', () => {
    const meta = resolveMetadataForCopy({ Metadata: { foo: '1', bar: '2' } }, { foo: 'bar', bar: 'foo' });
    assert.deepStrictEqual(meta, { bar: '1', foo: '2' });
  });

  it('parseBucketNames() returns default mapping', () => {
    const map = parseBucketNames(null);
    assert.deepStrictEqual(map, {
      code: 'helix-code-bus',
      config: 'helix-config-bus',
      content: 'helix-content-bus',
      media: 'helix-media-bus',
    });
  });

  it('parseBucketNames() returns specified mapping', () => {
    const map = {
      code: 'bucket-01',
      config: 'bucket-02',
      content: 'bucket-03',
      media: 'bucket-04',
    };
    assert.deepStrictEqual(parseBucketNames(JSON.stringify(map)), map);
  });

  it('bucket() needs bucket', () => {
    assert.throws(() => storage.bucket(), Error('bucketId is required.'));
  });

  it('contentBus() fails on closed storage', () => {
    storage.close();
    assert.throws(() => storage.contentBus(), Error('storage already closed.'));
  });

  it('creates a storage from context', () => {
    const ctx = {
      env: {
        AWS_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_R2_ACCESS_KEY_ID,
        CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
      attributes: {},
    };
    const stor = HelixStorage.fromContext(ctx);
    assert.ok(stor);
  });

  it('can get the s3 client', () => {
    assert.ok(storage.s3());
  });

  it('can get the content-bus', () => {
    assert.strictEqual(storage.contentBus().bucket, 'helix-content-bus');
  });

  it('can get the code-bus', () => {
    assert.strictEqual(storage.codeBus().bucket, 'helix-code-bus');
  });

  it('can get the media-bus', () => {
    assert.strictEqual(storage.mediaBus().bucket, 'helix-media-bus');
  });

  it('can get the config-bus', () => {
    assert.strictEqual(storage.configBus().bucket, 'helix-config-bus');
  });

  it('can get an object', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/foo?x-id=GetObject')
      .reply(200, 'hello, world.');
    const bus = storage.codeBus();
    const ret = await bus.get('/foo');
    assert.strictEqual(ret.toString(), 'hello, world.');
  });

  it('get compressed object and populates the meta object', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/foo?x-id=GetObject')
      .reply(200, await gzip('hello, world.'), {
        'content-type': 'text/plain',
        'content-encoding': 'gzip',
        'cache-control': 'no-store',
        expires: 'Thu, 23 Nov 2023 10:35:10 GMT',
        'x-amz-meta-x-source-location': 'github',
      });
    const bus = storage.codeBus();
    const meta = {};
    const ret = await bus.get('foo', meta);
    assert.strictEqual(ret.toString(), 'hello, world.');
    assert.deepStrictEqual(meta, {
      'x-source-location': 'github',
      CacheControl: 'no-store',
      ContentEncoding: 'gzip',
      ContentType: 'text/plain',
      Expires: new Date('Thu, 23 Nov 2023 10:35:10 GMT'),
    });
  });

  it('get returns null for not found', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/foo?x-id=GetObject')
      .reply(404);
    const bus = storage.codeBus();
    const ret = await bus.get('/foo');
    assert.strictEqual(ret, null);
  });

  it('get throws error', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/foo?x-id=GetObject')
      .reply(401);
    const bus = storage.codeBus();
    const error = Error('UnknownError');
    error.name = '401';
    await assert.rejects(bus.get('/foo'), error);
  });

  it('can get metadata of an object', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .head('/foo')
      .reply(200, 'hello, world.', {
        'content-type': 'text/plain',
        'x-amz-meta-test-location': 'some-location',
      });
    const bus = storage.codeBus();
    const ret = await bus.metadata('foo');
    assert.deepStrictEqual(ret, {
      'test-location': 'some-location',
    });
  });

  it('can get metadata of an object (404)', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .head('/foo')
      .reply(404);
    const bus = storage.codeBus();
    const ret = await bus.metadata('foo');
    assert.strictEqual(ret, undefined);
  });

  it('can put object', async () => {
    const reqs = { s3: {}, r2: {} };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .put('/foo?x-id=PutObject')
      .reply(function cb(uri) {
        reqs.s3[uri] = {
          body: Buffer.concat(this.req.requestBodyBuffers),
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [201];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .put('/foo?x-id=PutObject')
      .reply(function cb(uri) {
        reqs.r2[uri] = {
          body: Buffer.concat(this.req.requestBodyBuffers),
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [201];
      });

    const bus = storage.codeBus();
    await bus.put('/foo', 'hello, world.', 'text/plain', {
      myid: '1234',
    });

    const req = {
      '/foo?x-id=PutObject': {
        body: await gzip(Buffer.from('hello, world.', 'utf-8')),
        headers: {
          'content-encoding': 'gzip',
          'content-type': 'text/plain',
          'x-amz-meta-myid': '1234',
        },
      },
    };
    assert.deepEqual(reqs.s3, req);
    assert.deepEqual(reqs.r2, req);
  });

  it('can put object uncompressed', async () => {
    const reqs = { s3: {}, r2: {} };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .put('/foo?x-id=PutObject')
      .reply(function cb(uri) {
        reqs.s3[uri] = {
          body: Buffer.concat(this.req.requestBodyBuffers),
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [201];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .put('/foo?x-id=PutObject')
      .reply(function cb(uri) {
        reqs.r2[uri] = {
          body: Buffer.concat(this.req.requestBodyBuffers),
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [201];
      });

    const bus = storage.codeBus();
    await bus.put('/foo', 'hello, world.', 'text/plain', {
      myid: '1234',
    }, false);

    const req = {
      '/foo?x-id=PutObject': {
        body: Buffer.from('hello, world.', 'utf-8'),
        headers: {
          'content-type': 'text/plain',
          'x-amz-meta-myid': '1234',
        },
      },
    };
    assert.deepEqual(reqs.s3, req);
    assert.deepEqual(reqs.r2, req);
  });

  it('can store object', async () => {
    const reqs = { s3: {}, r2: {} };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .put('/foo?x-id=PutObject')
      .reply(function cb(uri) {
        reqs.s3[uri] = {
          body: Buffer.concat(this.req.requestBodyBuffers),
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [201];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .put('/foo?x-id=PutObject')
      .reply(function cb(uri) {
        reqs.r2[uri] = {
          body: Buffer.concat(this.req.requestBodyBuffers),
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [201];
      });

    const bus = storage.codeBus();
    const data = new Response('hello, world.', {
      headers: {
        'content-type': 'text/plain',
        myid: '1234',
      },
    });
    await bus.store('/foo', data);

    const req = {
      '/foo?x-id=PutObject': {
        body: await gzip(Buffer.from('hello, world.', 'utf-8')),
        headers: {
          'content-encoding': 'gzip',
          'content-type': 'text/plain',
          'x-amz-meta-myid': '1234',
        },
      },
    };
    assert.deepEqual(reqs.s3, req);
    assert.deepEqual(reqs.r2, req);
  });

  it('can store gzipped object', async () => {
    const reqs = { s3: {}, r2: {} };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .put('/foo?x-id=PutObject')
      .reply(function cb(uri) {
        reqs.s3[uri] = {
          body: Buffer.concat(this.req.requestBodyBuffers),
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [201];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .put('/foo?x-id=PutObject')
      .reply(function cb(uri) {
        reqs.r2[uri] = {
          body: Buffer.concat(this.req.requestBodyBuffers),
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [201];
      });

    const bus = storage.codeBus();

    const zipped = await gzip('hello, world.');
    const data = new Response(zipped, {
      headers: {
        'content-type': 'text/plain',
        'content-encoding': 'gzip',
        myid: '1234',
      },
    });
    await bus.store('/foo', data);

    const req = {
      '/foo?x-id=PutObject': {
        body: await gzip(Buffer.from('hello, world.', 'utf-8')),
        headers: {
          'content-encoding': 'gzip',
          'content-type': 'text/plain',
          'x-amz-meta-myid': '1234',
        },
      },
    };
    assert.deepEqual(reqs.s3, req);
    assert.deepEqual(reqs.r2, req);
  });

  it('can remove object', async () => {
    const reqs = { s3: {}, r2: {} };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .delete('/foo?x-id=DeleteObject')
      .reply(function cb(uri, body) {
        reqs.s3[uri] = {
          body,
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [204];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .delete('/foo?x-id=DeleteObject')
      .reply(function cb(uri, body) {
        reqs.r2[uri] = {
          body,
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [204];
      });

    const bus = storage.codeBus();
    await bus.remove('/foo');
    const req = {
      '/foo?x-id=DeleteObject': {
        body: '',
        headers: {},
      },
    };
    assert.deepEqual(reqs.s3, req);
    assert.deepEqual(reqs.r2, req);
  });

  it('can update metadata', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .put('/owner/repo/ref?x-id=CopyObject')
      .reply(function test() {
        assert.strictEqual(this.req.headers['x-amz-copy-source'], 'helix-code-bus/owner/repo/ref');
        assert.strictEqual(this.req.headers['x-amz-meta-source-location'], 'new-location');
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2021-05-05T08:37:23.000Z</LastModified><ETag>&quot;f278c0035a9b4398629613a33abe6451&quot;</ETag></CopyObjectResult>'];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .put('/owner/repo/ref?x-id=CopyObject')
      .reply(function test() {
        assert.strictEqual(this.req.headers['x-amz-copy-source'], 'helix-code-bus/owner/repo/ref');
        assert.strictEqual(this.req.headers['x-amz-meta-source-location'], 'new-location');
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2021-05-05T08:37:23.000Z</LastModified><ETag>&quot;f278c0035a9b4398629613a33abe6451&quot;</ETag></CopyObjectResult>'];
      });

    const bus = storage.codeBus();
    const res = await bus.putMeta('/owner/repo/ref', {
      'source-location': 'new-location',
    });
    assert.strictEqual(res.$metadata.httpStatusCode, 200);
  });

  it('remove non-existing object fails', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .delete('/does-not-exist?x-id=DeleteObject')
      .reply(404);
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .delete('/does-not-exist?x-id=DeleteObject')
      .reply(404);

    const bus = storage.codeBus();
    await assert.rejects(async () => bus.remove('/does-not-exist'));
  });

  it('remove objects can report error', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .post('/?delete=')
      .reply(404);
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .post('/?delete=')
      .reply(404);

    const bus = storage.codeBus();
    await assert.rejects(async () => bus.remove(['/foo', '/bar'], '', true));
  });

  it('can remove objects', async () => {
    const reqs = { s3: {}, r2: {} };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .post('/?delete=')
      .reply(function cb(uri, body) {
        reqs.s3[uri] = {
          body,
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [200, '<?xml version="1.0" encoding="UTF-8"?>'
        + '<DeleteResult>'
        + '<Deleted><Key>/foo</Key></Deleted>'
        + '<Deleted><Key>/bar</Key></Deleted>'
        + '<Error><Code>kaputt</Code></Error>'
        + '</DeleteResult>'];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .post('/?delete=')
      .reply(function cb(uri, body) {
        reqs.r2[uri] = {
          body,
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<DeleteResult><Deleted><Key>/foo</Key></Deleted><Deleted><Key>/bar</Key></Deleted></DeleteResult>'];
      });

    const bus = storage.codeBus();
    await bus.remove(['/foo', '/bar']);

    const req = {
      '/?delete=': {
        body: '<?xml version="1.0" encoding="UTF-8"?><Delete xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Object><Key>foo</Key></Object><Object><Key>bar</Key></Object></Delete>',
        headers: {
          'content-type': 'application/xml',
        },
      },
    };
    assert.deepEqual(reqs.s3, req);
    assert.deepEqual(reqs.r2, req);
  });

  it('can remove objects in S3 only', async () => {
    const reqs = { s3: {} };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .post('/?delete=')
      .reply(function cb(uri, body) {
        reqs.s3[uri] = {
          body,
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [200, '<?xml version="1.0" encoding="UTF-8"?>'
        + '<DeleteResult>'
        + '<Deleted><Key>/foo</Key></Deleted>'
        + '<Deleted><Key>/bar</Key></Deleted>'
        + '<Error><Code>kaputt</Code></Error>'
        + '</DeleteResult>'];
      });
    const bus = storage.codeBus(true);
    await bus.remove(['/foo', '/bar']);

    const req = {
      '/?delete=': {
        body: '<?xml version="1.0" encoding="UTF-8"?><Delete xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Object><Key>foo</Key></Object><Object><Key>bar</Key></Object></Delete>',
        headers: {
          'content-type': 'application/xml',
        },
      },
    };
    assert.deepEqual(reqs.s3, req);
  });

  it('can copy objects', async () => {
    const listReply = JSON.parse(await fs.readFile(path.resolve(__testdir, 'fixtures', 'list-reply-copy.json'), 'utf-8'));
    const puts = { s3: [], r2: [] };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/?list-type=2&prefix=owner%2Frepo%2Fref%2F')
      .reply(200, listReply[0])
      .get('/?continuation-token=1%2Fs4dr7BSKNScrN4njX9%2BCpBNimYkuEzMWg3niTSAPMdculBmycyUPM6kv0xi46j4hdc1lFPkE%2FICI8TxG%2BVNV9Hh91Ou0hqeBYzqTRzSBSs%3D&list-type=2&prefix=owner%2Frepo%2Fref%2F')
      .reply(200, listReply[1])
      .put(/.*/)
      .times(10)
      .reply((uri) => {
        puts.s3.push(uri);
        // reject first uri
        if (puts.s3.length === 1) {
          return [404];
        }
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2021-05-05T08:37:23.000Z</LastModified><ETag>&quot;f278c0035a9b4398629613a33abe6451&quot;</ETag></CopyObjectResult>'];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .put(/.*/)
      .times(10)
      .reply((uri) => {
        puts.r2.push(uri);
        // reject first uri
        if (puts.s3.length === 1) {
          return [404];
        }
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2021-05-05T08:37:23.000Z</LastModified><ETag>&quot;f278c0035a9b4398629613a33abe6451&quot;</ETag></CopyObjectResult>'];
      });

    const bus = storage.codeBus();
    await bus.copyDeep('/owner/repo/ref/', '/bar/');

    puts.s3.sort();
    puts.r2.sort();
    const expectedPuts = [
      '/bar/.circleci/config.yml?x-id=CopyObject',
      '/bar/.gitignore?x-id=CopyObject',
      '/bar/.vscode/launch.json?x-id=CopyObject',
      '/bar/.vscode/settings.json?x-id=CopyObject',
      '/bar/README.md?x-id=CopyObject',
      '/bar/helix_logo.png?x-id=CopyObject',
      '/bar/htdocs/favicon.ico?x-id=CopyObject',
      '/bar/htdocs/style.css?x-id=CopyObject',
      '/bar/index.md?x-id=CopyObject',
      '/bar/src/html.pre.js?x-id=CopyObject',
    ];
    assert.deepEqual(puts.s3, expectedPuts);
    assert.deepEqual(puts.r2, expectedPuts);
  });

  it('can copy objects and add/rename metadata', async () => {
    const listReply = JSON.parse(await fs.readFile(path.resolve(__testdir, 'fixtures', 'list-reply-copy.json'), 'utf-8'));
    const puts = { s3: [], r2: [] };
    const putsHeaders = { s3: [], r2: [] };
    const heads = [];
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/?list-type=2&prefix=owner%2Frepo%2Fref%2F')
      .reply(200, listReply[0])
      .get('/?continuation-token=1%2Fs4dr7BSKNScrN4njX9%2BCpBNimYkuEzMWg3niTSAPMdculBmycyUPM6kv0xi46j4hdc1lFPkE%2FICI8TxG%2BVNV9Hh91Ou0hqeBYzqTRzSBSs%3D&list-type=2&prefix=owner%2Frepo%2Fref%2F')
      .reply(200, listReply[1])
      .head(/.*/)
      .times(10)
      .reply((uri) => {
        heads.push(uri);
        // reject first uri, this skips the copy entirely
        if (heads.length === 1) {
          return [404];
        }
        return [200, [], {
          expires: 'Thu, 23 Nov 2023 10:35:10 GMT',
          'content-type': 'text/plain',
          'content-encoding': 'gzip',
          'x-amz-meta-x-dont-overwrite': 'foo',
          'x-amz-meta-x-rename-src': 'should-be-renamed',
          'x-amz-meta-x-last-modified-by': 'anonymous',
        }];
      })
      .put(/.*/)
      .times(9)
      .reply(function f(uri) {
        puts.s3.push(uri);
        putsHeaders.s3.push({
          expires: this.req.headers.expires,
          'content-type': this.req.headers['content-type'],
          'content-encoding': this.req.headers['content-encoding'],
          'x-amz-metadata-directive': this.req.headers['x-amz-metadata-directive'],
          'x-amz-meta-x-dont-overwrite': this.req.headers['x-amz-meta-x-dont-overwrite'],
          'x-amz-meta-x-rename-src': this.req.headers['x-amz-meta-x-rename-src'],
          'x-amz-meta-x-rename-dst': this.req.headers['x-amz-meta-x-rename-dst'],
          'x-amz-meta-x-last-modified-by': this.req.headers['x-amz-meta-x-last-modified-by'],
        });
        // reject first uri
        if (puts.s3.length === 1) {
          return [404];
        }
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2021-05-05T08:37:23.000Z</LastModified><ETag>&quot;f278c0035a9b4398629613a33abe6451&quot;</ETag></CopyObjectResult>'];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .put(/.*/)
      .times(9)
      .reply(function f(uri) {
        puts.r2.push(uri);
        putsHeaders.r2.push({
          expires: this.req.headers.expires,
          'content-type': this.req.headers['content-type'],
          'content-encoding': this.req.headers['content-encoding'],
          'x-amz-metadata-directive': this.req.headers['x-amz-metadata-directive'],
          'x-amz-meta-x-dont-overwrite': this.req.headers['x-amz-meta-x-dont-overwrite'],
          'x-amz-meta-x-rename-src': this.req.headers['x-amz-meta-x-rename-src'],
          'x-amz-meta-x-rename-dst': this.req.headers['x-amz-meta-x-rename-dst'],
          'x-amz-meta-x-last-modified-by': this.req.headers['x-amz-meta-x-last-modified-by'],
        });
        // reject first uri
        if (puts.r2.length === 1) {
          return [404];
        }
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2021-05-05T08:37:23.000Z</LastModified><ETag>&quot;f278c0035a9b4398629613a33abe6451&quot;</ETag></CopyObjectResult>'];
      });

    const bus = storage.codeBus();
    await bus.copyDeep(
      '/owner/repo/ref/',
      '/bar/',
      undefined,
      {
        addMetadata: { 'x-last-modified-by': 'foo@example.com' },
        renameMetadata: { 'x-rename-src': 'x-rename-dst' },
      },
    );

    puts.s3.sort();
    puts.r2.sort();
    heads.sort();

    assert.strictEqual(putsHeaders.s3.length, 9);
    assert.strictEqual(putsHeaders.r2.length, 9);

    Object.values(putsHeaders).forEach((s3r2) => {
      s3r2.forEach((headers) => {
        assert.deepEqual(headers, {
          expires: 'Thu, 23 Nov 2023 10:35:10 GMT',
          'content-type': 'text/plain',
          'content-encoding': 'gzip',
          'x-amz-meta-x-dont-overwrite': 'foo',
          'x-amz-meta-x-last-modified-by': 'foo@example.com',
          'x-amz-meta-x-rename-dst': 'should-be-renamed',
          'x-amz-meta-x-rename-src': undefined,
          'x-amz-metadata-directive': 'REPLACE',
        });
      });
    });

    const expectedHeads = [
      '/owner/repo/ref/.circleci/config.yml',
      '/owner/repo/ref/.gitignore',
      '/owner/repo/ref/.vscode/launch.json',
      '/owner/repo/ref/.vscode/settings.json',
      '/owner/repo/ref/README.md',
      '/owner/repo/ref/helix_logo.png',
      '/owner/repo/ref/htdocs/favicon.ico',
      '/owner/repo/ref/htdocs/style.css',
      '/owner/repo/ref/index.md',
      '/owner/repo/ref/src/html.pre.js',
    ];
    assert.deepEqual(heads, expectedHeads);

    const expectedPuts = [
      // '/bar/.circleci/config.yml?x-id=CopyObject', // 404, skipped
      '/bar/.gitignore?x-id=CopyObject',
      '/bar/.vscode/launch.json?x-id=CopyObject',
      '/bar/.vscode/settings.json?x-id=CopyObject',
      '/bar/README.md?x-id=CopyObject',
      '/bar/helix_logo.png?x-id=CopyObject',
      '/bar/htdocs/favicon.ico?x-id=CopyObject',
      '/bar/htdocs/style.css?x-id=CopyObject',
      '/bar/index.md?x-id=CopyObject',
      '/bar/src/html.pre.js?x-id=CopyObject',
    ];
    assert.deepEqual(puts.s3, expectedPuts);
    assert.deepEqual(puts.r2, expectedPuts);
  });

  it('can copy object (non deep)', async () => {
    const puts = { s3: [], r2: [] };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .put('/owner/repo/ref/foo/bar.md?x-id=CopyObject')
      .reply((uri) => {
        puts.s3.push(uri);
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2021-05-05T08:37:23.000Z</LastModified><ETag>&quot;f278c0035a9b4398629613a33abe6451&quot;</ETag></CopyObjectResult>'];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .put('/owner/repo/ref/foo/bar.md?x-id=CopyObject')
      .reply((uri) => {
        puts.r2.push(uri);
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2021-05-05T08:37:23.000Z</LastModified><ETag>&quot;f278c0035a9b4398629613a33abe6451&quot;</ETag></CopyObjectResult>'];
      });

    const bus = storage.codeBus();
    await bus.copy('/owner/repo/ref/foo.md', '/owner/repo/ref/foo/bar.md');

    puts.s3.sort();
    puts.r2.sort();
    const expectedPuts = [
      '/owner/repo/ref/foo/bar.md?x-id=CopyObject',
    ];
    assert.deepEqual(puts.s3, expectedPuts);
    assert.deepEqual(puts.r2, expectedPuts);
  });

  it('can copy object, and add/rename metadata (non deep)', async () => {
    const puts = { s3: [], r2: [] };
    const putsHeaders = { s3: undefined, r2: undefined };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .head('/owner/repo/ref/foo.md')
      .reply(200, [], {
        'last-modified': 'Thu, 23 Nov 2023 10:35:10 GMT',
        'x-amz-meta-x-dont-overwrite': 'foo',
        'x-amz-meta-x-last-modified-by': 'anonymous',
        'content-type': 'text/plain',
        'content-encoding': 'gzip',
      })
      .put('/owner/repo/ref/foo/bar.md?x-id=CopyObject')
      .reply(function f(uri) {
        putsHeaders.s3 = {
          'content-type': this.req.headers['content-type'],
          'content-encoding': this.req.headers['content-encoding'],
          'x-amz-metadata-directive': this.req.headers['x-amz-metadata-directive'],
          'x-amz-meta-x-dont-overwrite': this.req.headers['x-amz-meta-x-dont-overwrite'],
          'x-amz-meta-x-last-previewed': this.req.headers['x-amz-meta-x-last-previewed'],
          'x-amz-meta-x-last-modified-by': this.req.headers['x-amz-meta-x-last-modified-by'],
        };
        puts.s3.push(uri);
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2021-05-05T08:37:23.000Z</LastModified><ETag>&quot;f278c0035a9b4398629613a33abe6451&quot;</ETag></CopyObjectResult>'];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .put('/owner/repo/ref/foo/bar.md?x-id=CopyObject')
      .reply(function f(uri) {
        putsHeaders.r2 = {
          'content-type': this.req.headers['content-type'],
          'content-encoding': this.req.headers['content-encoding'],
          'x-amz-metadata-directive': this.req.headers['x-amz-metadata-directive'],
          'x-amz-meta-x-last-previewed': this.req.headers['x-amz-meta-x-last-previewed'],
          'x-amz-meta-x-dont-overwrite': this.req.headers['x-amz-meta-x-dont-overwrite'],
          'x-amz-meta-x-last-modified-by': this.req.headers['x-amz-meta-x-last-modified-by'],
        };
        puts.r2.push(uri);
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2021-05-05T08:37:23.000Z</LastModified><ETag>&quot;f278c0035a9b4398629613a33abe6451&quot;</ETag></CopyObjectResult>'];
      });

    const bus = storage.codeBus();
    await bus.copy(
      '/owner/repo/ref/foo.md',
      '/owner/repo/ref/foo/bar.md',
      {
        addMetadata: { 'x-last-modified-by': 'foo@example.com' },
        renameMetadata: { 'last-modified': 'x-last-previewed' },
      },
    );

    puts.s3.sort();
    puts.r2.sort();
    const expectedPuts = [
      '/owner/repo/ref/foo/bar.md?x-id=CopyObject',
    ];
    assert.deepEqual(puts.s3, expectedPuts);
    assert.deepEqual(puts.r2, expectedPuts);

    assert.deepEqual(putsHeaders.s3, {
      'content-type': 'text/plain',
      'content-encoding': 'gzip',
      'x-amz-metadata-directive': 'REPLACE',
      'x-amz-meta-x-dont-overwrite': 'foo',
      'x-amz-meta-x-last-modified-by': 'foo@example.com',
      'x-amz-meta-x-last-previewed': 'Thu, 23 Nov 2023 10:35:10 GMT',
    });
    assert.deepEqual(putsHeaders.r2, {
      'content-type': 'text/plain',
      'content-encoding': 'gzip',
      'x-amz-metadata-directive': 'REPLACE',
      'x-amz-meta-x-dont-overwrite': 'foo',
      'x-amz-meta-x-last-modified-by': 'foo@example.com',
      'x-amz-meta-x-last-previewed': 'Thu, 23 Nov 2023 10:35:10 GMT',
    });
  });

  it('can copy object, and add metadata (non deep, no metadata already existed)', async () => {
    const puts = { s3: [], r2: [] };
    const putsHeaders = { s3: undefined, r2: undefined };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .head('/owner/repo/ref/foo.md')
      .reply(200, [], { 'content-type': 'text/plain' })
      .put('/owner/repo/ref/foo/bar.md?x-id=CopyObject')
      .reply(function f(uri) {
        putsHeaders.s3 = {
          expires: this.req.headers.expires,
          'content-type': this.req.headers['content-type'],
          'content-encoding': this.req.headers['content-encoding'],
          'x-amz-metadata-directive': this.req.headers['x-amz-metadata-directive'],
          'x-amz-meta-x-dont-overwrite': this.req.headers['x-amz-meta-x-dont-overwrite'],
          'x-amz-meta-x-last-modified-by': this.req.headers['x-amz-meta-x-last-modified-by'],
        };
        puts.s3.push(uri);
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2021-05-05T08:37:23.000Z</LastModified><ETag>&quot;f278c0035a9b4398629613a33abe6451&quot;</ETag></CopyObjectResult>'];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .put('/owner/repo/ref/foo/bar.md?x-id=CopyObject')
      .reply(function f(uri) {
        putsHeaders.r2 = {
          expires: this.req.headers.expires,
          'content-type': this.req.headers['content-type'],
          'content-encoding': this.req.headers['content-encoding'],
          'x-amz-metadata-directive': this.req.headers['x-amz-metadata-directive'],
          'x-amz-meta-x-dont-overwrite': this.req.headers['x-amz-meta-x-dont-overwrite'],
          'x-amz-meta-x-last-modified-by': this.req.headers['x-amz-meta-x-last-modified-by'],
        };
        puts.r2.push(uri);
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2021-05-05T08:37:23.000Z</LastModified><ETag>&quot;f278c0035a9b4398629613a33abe6451&quot;</ETag></CopyObjectResult>'];
      });

    const bus = storage.codeBus();
    await bus.copy('/owner/repo/ref/foo.md', '/owner/repo/ref/foo/bar.md', { addMetadata: { 'x-last-modified-by': 'foo@example.com' } });

    puts.s3.sort();
    puts.r2.sort();
    const expectedPuts = [
      '/owner/repo/ref/foo/bar.md?x-id=CopyObject',
    ];
    assert.deepEqual(puts.s3, expectedPuts);
    assert.deepEqual(puts.r2, expectedPuts);

    assert.deepEqual(putsHeaders.s3, {
      expires: undefined,
      'content-type': 'text/plain',
      'content-encoding': undefined,
      'x-amz-metadata-directive': 'REPLACE',
      'x-amz-meta-x-dont-overwrite': undefined,
      'x-amz-meta-x-last-modified-by': 'foo@example.com',
    });
    assert.deepEqual(putsHeaders.r2, {
      expires: undefined,
      'content-type': 'text/plain',
      'content-encoding': undefined,
      'x-amz-metadata-directive': 'REPLACE',
      'x-amz-meta-x-dont-overwrite': undefined,
      'x-amz-meta-x-last-modified-by': 'foo@example.com',
    });
  });

  it('copy and add metadata should throw error when source not found', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .head('/owner/repo/ref/foo.md')
      .reply(404);

    const bus = storage.codeBus();
    await assert.rejects(
      bus.copy(
        '/owner/repo/ref/foo.md',
        '/owner/repo/ref/foo/bar.md',
        { addMetadata: { 'x-last-modified-by': 'foo@example.com' } },
      ),
    );
  });

  it('can copy object can fail (non deep)', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .put('/owner/repo/ref/foo/bar.md?x-id=CopyObject')
      .reply(404);
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .put('/owner/repo/ref/foo/bar.md?x-id=CopyObject')
      .reply(404);

    const bus = storage.codeBus();
    await assert.rejects(bus.copy('/owner/repo/ref/foo.md', '/owner/repo/ref/foo/bar.md'));
  });

  it('can copy object can fail if not found (non deep)', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .put('/owner/repo/ref/foo/bar.md?x-id=CopyObject')
      .reply(200, '<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchKey</Code></Error>');
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .put('/owner/repo/ref/foo/bar.md?x-id=CopyObject')
      .reply(200, '<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchKey</Code></Error>');

    const bus = storage.codeBus();
    await assert.rejects(bus.copy('/owner/repo/ref/foo.md', '/owner/repo/ref/foo/bar.md'));
  });

  it('can delete objects', async () => {
    const keys = Array.from({ length: 1500 }, (v, k) => `key_${k + 1}`).sort();
    const listReply = new xml2js.Builder().buildObject({
      ListBucketResult: {
        Name: 'helix-code-bus',
        Prefix: 'owner/repo/new-branch/',
        KeyCount: 1500,
        MaxKeys: 1500,
        IsTruncated: false,
        Contents: keys.map((key) => ({ Key: key })),
      },
    });
    const deletes = { s3: [], r2: [] };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/?list-type=2&prefix=owner%2Frepo%2Fnew-branch%2F')
      .reply(200, listReply)
      .post('/?delete=')
      .twice()
      .reply(async (uri, body) => {
        const xml = await xml2js.parseStringPromise(body);
        xml.Delete.Object.forEach((o) => {
          deletes.s3.push(o.Key[0]);
        });
        return [204];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .post('/?delete=')
      .twice()
      .reply(async (uri, body) => {
        const xml = await xml2js.parseStringPromise(body);
        xml.Delete.Object.forEach((o) => {
          deletes.r2.push(o.Key[0]);
        });
        return [204];
      });

    const bus = storage.codeBus();
    await bus.rmdir('/owner/repo/new-branch/');

    deletes.s3.sort();
    deletes.r2.sort();
    assert.deepStrictEqual(deletes.s3, keys);
    assert.deepStrictEqual(deletes.r2, keys);
  });

  it('delete objects can fail', async () => {
    const listReply = JSON.parse(await fs.readFile(path.resolve(__testdir, 'fixtures', 'list-reply.json'), 'utf-8'));

    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/?list-type=2&prefix=owner%2Frepo%2Fnew-branch%2F')
      .reply(200, listReply.response)
      .post('/?delete=')
      .reply(404);
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .post('/?delete=')
      .reply(404);

    const bus = storage.codeBus();
    await bus.rmdir('/owner/repo/new-branch/');
  });

  it('rmdir works for empty dir', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/?list-type=2&prefix=owner%2Frepo%2Fnew-branch%2F')
      .reply(200, '<?xml version="1.0" encoding="UTF-8"?>\n<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>helix-code-bus</Name><Prefix>owner/repo/new-branch/</Prefix><KeyCount>0</KeyCount><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated></ListBucketResult>');

    const bus = storage.codeBus();
    await bus.rmdir('/owner/repo/new-branch/');
  });

  it('can list folders', async () => {
    const listReply = JSON.parse(await fs.readFile(path.resolve(__testdir, 'fixtures', 'list-folders-reply.json'), 'utf-8'));
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/?delimiter=%2F&list-type=2&prefix=')
      .reply(200, new xml2js.Builder().buildObject(listReply[0]))
      .get('/?continuation-token=next&delimiter=%2F&list-type=2&prefix=')
      .reply(200, new xml2js.Builder().buildObject(listReply[1]));

    const bus = storage.codeBus();
    const folders = await bus.listFolders('');

    assert.deepStrictEqual(folders, ['owner/', 'other/']);
  });

  it('can list shallow', async () => {
    const listReply = JSON.parse(await fs.readFile(path.resolve(__testdir, 'fixtures', 'list-shallow-reply.json'), 'utf-8'));
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/?delimiter=%2F&list-type=2&prefix=%2Fowner%2Frepo%2Fref%2F')
      .reply(200, new xml2js.Builder().buildObject(listReply));

    const bus = storage.codeBus();
    const folders = await bus.list('/owner/repo/ref/', true);

    assert.deepStrictEqual(folders, [
      {
        contentLength: 11,
        contentType: null,
        key: '/owner/repo/ref/.gitignore',
        lastModified: new Date('2021-05-05T08:00:30.000Z'),
        path: '.gitignore',
      },
      {
        contentLength: 1234,
        contentType: 'text/markdown',
        key: '/owner/repo/ref/README.md',
        lastModified: new Date('2021-05-05T08:00:30.000Z'),
        path: 'README.md',
      },
    ]);
  });

  it('can list deep', async () => {
    const listReply = JSON.parse(await fs.readFile(path.resolve(__testdir, 'fixtures', 'list-deep-reply.json'), 'utf-8'));
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/?list-type=2&prefix=%2Fowner%2Frepo%2Fref%2F')
      .reply(200, new xml2js.Builder().buildObject(listReply));

    const bus = storage.codeBus();
    const folders = await bus.list('/owner/repo/ref/');

    assert.deepStrictEqual(folders, [
      {
        contentLength: 11,
        contentType: null,
        key: '/owner/repo/ref/.gitignore',
        lastModified: new Date('2021-05-05T08:00:30.000Z'),
        path: '.gitignore',
      },
      {
        contentLength: 1234,
        contentType: 'text/markdown',
        key: '/owner/repo/ref/README.md',
        lastModified: new Date('2021-05-05T08:00:30.000Z'),
        path: 'README.md',
      },
      {
        contentLength: 1234,
        contentType: 'text/javascript',
        key: '/owner/repo/ref/src/scripts.js',
        lastModified: new Date('2021-05-05T08:00:30.000Z'),
        path: 'src/scripts.js',
      },
    ]);
  });

  it('can return an empty list of folders', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/?delimiter=%2F&list-type=2&prefix=foo%2f')
      .reply(200, `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <KeyCount>0</KeyCount>
</ListBucketResult>
`);

    const bus = storage.codeBus();
    const folders = await bus.listFolders('foo/');

    assert.deepStrictEqual(folders, []);
  });
});

describe('Disabled R2 Storage test', () => {
  let nock;
  let storage;

  beforeEach(() => {
    nock = new Nock().env();

    const context = {
      attributes: {},
      env: {
        CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_R2_ACCESS_KEY_ID,
        CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        HELIX_STORAGE_DISABLE_R2: 'true',
      },
    };
    storage = HelixStorage.fromContext(context);
  });

  afterEach(() => {
    nock.done();
    storage.close();
  });

  it('can get an object', async () => {
    nock('https://helix-code-bus.s3.us-east-1.amazonaws.com')
      .get('/foo?x-id=GetObject')
      .reply(200, 'hello, world.');
    const bus = storage.codeBus();
    const ret = await bus.get('/foo');
    assert.strictEqual(ret.toString(), 'hello, world.');
  });

  it('can put object', async () => {
    const reqs = { s3: {}, r2: {} };
    nock('https://helix-code-bus.s3.us-east-1.amazonaws.com')
      .put('/foo?x-id=PutObject')
      .reply(function cb(uri) {
        reqs.s3[uri] = {
          body: Buffer.concat(this.req.requestBodyBuffers),
          headers: Object.fromEntries(Object.entries(this.req.headers)
            .filter(([key]) => TEST_HEADERS.indexOf(key) >= 0)),
        };
        return [201];
      });

    const bus = storage.codeBus();
    await bus.put('/foo', 'hello, world.', 'text/plain', {
      myid: '1234',
    });

    const req = {
      '/foo?x-id=PutObject': {
        body: await gzip(Buffer.from('hello, world.', 'utf-8')),
        headers: {
          'content-encoding': 'gzip',
          'content-type': 'text/plain',
          'x-amz-meta-myid': '1234',
        },
      },
    };
    assert.deepEqual(reqs.s3, req);
    assert.deepEqual(reqs.r2, {});
  });
});
