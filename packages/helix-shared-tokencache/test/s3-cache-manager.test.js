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

/* eslint-env mocha */
import assert from 'assert';
import { S3CacheManager, S3CachePlugin } from '../src/index.js';
import { Nock } from './utils.js';

describe('S3CacheManager Test', () => {
  let nock;
  let savedProcessEnv;
  beforeEach(() => {
    nock = new Nock();
    savedProcessEnv = process.env;
    process.env = {
      ...process.env,
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'fake-key-id',
      AWS_SECRET_ACCESS_KEY: 'fake-secret',
    };
  });

  afterEach(() => {
    nock.done();
    process.env = savedProcessEnv;
  });

  it('lists the cache keys', async () => {
    const mgr = new S3CacheManager({
      bucket: 'test-bucket',
      prefix: 'myproject/auth-default',
      type: 'onedrive',
      secret: '',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/?list-type=2&prefix=myproject%2Fauth-default%2F')
      .reply(200, `
        <?xml version="1.0" encoding="UTF-8"?>
        <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
          <Name>helix-code-bus</Name>
          <Prefix>myproject/auth-default/</Prefix>
          <KeyCount>3</KeyCount>
          <MaxKeys>1000</MaxKeys>
          <IsTruncated>false</IsTruncated>
          <Contents>
            <Key>myproject/auth-default/.foobar</Key>
          </Contents>
          <Contents>
            <Key>myproject/auth-default/auth-onedrive-content.json</Key>
          </Contents>
          <Contents>
            <Key>myproject/auth-default/auth-google-content.json</Key>
          </Contents>
          <Contents>
            <Key>myproject/auth-default/auth-onedrive-index.json</Key>
          </Contents>
        </ListBucketResult>
      `);

    const ret = await mgr.listCacheKeys();
    assert.deepStrictEqual(ret, ['content', 'index']);
  });

  it('lists the cache keys handles no content', async () => {
    const mgr = new S3CacheManager({
      bucket: 'test-bucket',
      prefix: 'myproject/auth-default',
      type: 'onedrive',
      secret: '',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/?list-type=2&prefix=myproject%2Fauth-default%2F')
      .reply(200, `
        <?xml version="1.0" encoding="UTF-8"?>
        <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
          <Name>helix-code-bus</Name>
          <Prefix>myproject/auth-default/</Prefix>
          <KeyCount>0</KeyCount>
          <MaxKeys>1000</MaxKeys>
          <IsTruncated>false</IsTruncated>
        </ListBucketResult>
      `);

    const ret = await mgr.listCacheKeys();
    assert.deepStrictEqual(ret, []);
  });

  it('lists the cache keys handles errors', async () => {
    const mgr = new S3CacheManager({
      bucket: 'test-bucket',
      prefix: 'myproject/auth-default',
      type: 'onedrive',
      secret: '',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/?list-type=2&prefix=myproject%2Fauth-default%2F')
      .reply(404);

    const ret = await mgr.listCacheKeys();
    assert.deepStrictEqual(ret, []);
  });

  it('creates s3 plugin', async () => {
    const mgr = new S3CacheManager({
      bucket: 'test-bucket',
      prefix: 'myproject/auth-default',
      type: 'onedrive',
      secret: 'foobar',
      readOnly: true,
    });

    const p = await mgr.getCache('content');

    assert.ok(p instanceof S3CachePlugin);
    assert.strictEqual(p.key, 'myproject/auth-default/auth-onedrive-content.json');
    assert.strictEqual(p.bucket, 'test-bucket');
    assert.strictEqual(p.secret, 'foobar');
    assert.strictEqual(p.readOnly, true);
  });

  it('checks if cache exits', async () => {
    const mgr = new S3CacheManager({
      bucket: 'test-bucket',
      prefix: 'myproject/auth-default',
      type: 'onedrive',
      secret: 'foobar',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .head('/myproject/auth-default/auth-onedrive-content.json')
      .reply(404)
      .head('/myproject/auth-default/auth-onedrive-content.json')
      .reply(200);

    assert.strictEqual(await mgr.hasCache('content'), false);
    assert.strictEqual(await mgr.hasCache('content'), true);
  });

  it('checks if cache exits handles errors', async () => {
    const mgr = new S3CacheManager({
      bucket: 'test-bucket',
      prefix: 'myproject/auth-default',
      type: 'onedrive',
      secret: 'foobar',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .head('/myproject/auth-default/auth-onedrive-content.json')
      .reply(401);

    await assert.rejects(mgr.hasCache('content'));
  });

  it('finds the cache that exists', async () => {
    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .head('/myproject/special1/auth-onedrive-content.json')
      .reply(404)
      .head('/myproject/special2/auth-onedrive-content.json')
      .reply(200);

    const plugin = await S3CacheManager.findCache('content', {
      bucket: 'test-bucket',
      prefix: 'myproject/auth-default',
      type: 'onedrive',
      secret: 'foobar',
    }, {
      prefix: 'myproject/special1',
    }, {
      prefix: 'myproject/special2',
    });
    assert.strictEqual(plugin.key, 'myproject/special2/auth-onedrive-content.json');
  });

  it('findCache falls back to default', async () => {
    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .head('/myproject/special1/auth-onedrive-content.json')
      .reply(404)
      .head('/myproject/special2/auth-onedrive-content.json')
      .reply(404);

    const plugin = await S3CacheManager.findCache('content', {
      bucket: 'test-bucket',
      prefix: 'myproject/auth-default',
      type: 'onedrive',
      secret: 'foobar',
    }, {
      prefix: 'myproject/special1',
    }, {
      prefix: 'myproject/special2',
    });

    assert.strictEqual(plugin.key, 'myproject/auth-default/auth-onedrive-content.json');
  });
});
