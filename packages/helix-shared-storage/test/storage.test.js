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
import { HelixStorage } from '../src/storage.js';

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
    });
  });

  afterEach(() => {
    nock.done();
    storage.close();
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

  it('remove objects can fail', async () => {
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .post('/?delete=')
      .reply(404);
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .post('/?delete=')
      .reply(404);

    const bus = storage.codeBus();
    await assert.rejects(async () => bus.remove(['/foo', '/bar']));
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
        return [200, '<?xml version="1.0" encoding="UTF-8"?>\n<DeleteResult><Deleted><Key>/foo</Key></Deleted><Deleted><Key>/bar</Key></Deleted></DeleteResult>'];
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
    const listReply = JSON.parse(await fs.readFile(path.resolve(__testdir, 'fixtures', 'list-reply.json'), 'utf-8'));
    const deletes = { s3: [], r2: [] };
    nock('https://helix-code-bus.s3.fake.amazonaws.com')
      .get('/?list-type=2&prefix=owner%2Frepo%2Fnew-branch%2F')
      .reply(200, listReply.response)
      .delete(/.*/)
      .times(10)
      .reply((uri) => {
        deletes.s3.push(uri);
        // reject first uri
        if (deletes.s3.length === 1) {
          return [404];
        }
        return [204];
      });
    nock(`https://helix-code-bus.${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
      .delete(/.*/)
      .times(10)
      .reply((uri) => {
        deletes.r2.push(uri);
        // reject first uri
        if (deletes.r2.length === 1) {
          return [404];
        }
        return [204];
      });

    const bus = storage.codeBus();
    await bus.rmdir('/owner/repo/new-branch/');

    deletes.s3.sort();
    deletes.r2.sort();
    const expectedDeletes = [
      '/owner/repo/ref/.circleci/config.yml?x-id=DeleteObject',
      '/owner/repo/ref/.gitignore?x-id=DeleteObject',
      '/owner/repo/ref/.vscode/launch.json?x-id=DeleteObject',
      '/owner/repo/ref/.vscode/settings.json?x-id=DeleteObject',
      '/owner/repo/ref/README.md?x-id=DeleteObject',
      '/owner/repo/ref/helix_logo.png?x-id=DeleteObject',
      '/owner/repo/ref/htdocs/favicon.ico?x-id=DeleteObject',
      '/owner/repo/ref/htdocs/style.css?x-id=DeleteObject',
      '/owner/repo/ref/index.md?x-id=DeleteObject',
      '/owner/repo/ref/src/html.pre.js?x-id=DeleteObject',
    ];
    assert.deepEqual(deletes.s3, expectedDeletes);
    assert.deepEqual(deletes.r2, expectedDeletes);
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
