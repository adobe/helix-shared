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
import { S3CachePlugin, decrypt, encrypt } from '../src/index.js';
import { MockTokenCacheContext } from './MockTokenCacheContext.js';
import { Nock, toAuthContent } from './utils.js';

describe('S3CachePlugin Test', () => {
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

  it('writes the cache data to s3 w/o encryption and metadata', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: '',
    });

    const objectData = [];

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(200, JSON.stringify({
        cachePluginMetadata: {
          foo: 'bar',
        },
      }))
      .put('/myproject/auth-default/json?x-id=PutObject')
      .twice()
      .reply((_, body) => {
        objectData.push(body);
        return [204];
      });

    const data = toAuthContent('1234');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data,
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.deepStrictEqual(objectData.shift(), JSON.stringify({
      ...data,
      cachePluginMetadata: {
        foo: 'bar',
      },
    }));

    await p.setPluginMetadata({ foo: 'zoo' });
    assert.deepStrictEqual(objectData.shift(), JSON.stringify({
      ...data,
      cachePluginMetadata: {
        foo: 'zoo',
      },
    }));
  });

  it('can clear plugin metadata', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: '',
    });

    const data = toAuthContent('1234');
    const objectData = [];

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(200, JSON.stringify({
        ...data,
        cachePluginMetadata: {
          foo: 'bar',
        },
      }))
      .put('/myproject/auth-default/json?x-id=PutObject')
      .reply((_, body) => {
        objectData.push(body);
        return [204];
      });

    await p.setPluginMetadata();
    assert.strictEqual(objectData.shift(), JSON.stringify(data));
  });

  it('writes metadata to pristine plugin', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: '',
    });

    const objectData = [];

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(404)
      .put('/myproject/auth-default/json?x-id=PutObject')
      .reply((_, body) => {
        objectData.push(body);
        return [204];
      });

    await p.setPluginMetadata({ foo: 'bar' });
    assert.strictEqual(objectData.shift(), '{"cachePluginMetadata":{"foo":"bar"}}');
  });

  it('writes the cache data to s3 with encryption', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: 'foobar',
    });

    let objectData = null;

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(404)
      .put('/myproject/auth-default/json?x-id=PutObject')
      .reply((_, body) => {
        objectData = Buffer.from(body, 'hex');
        return [204];
      });

    const data = toAuthContent('1234');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data,
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.strictEqual(decrypt('foobar', objectData).toString('utf-8'), JSON.stringify(data));
  });

  it('does not write in read-only mode', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: 'foobar',
      readOnly: true,
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(404);

    const data = toAuthContent('1234');
    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data,
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, true);
  });

  it('does not the write data to s3 if context not changed', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: 'foobar',
    });

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: false,
      data: toAuthContent('1234'),
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, false);
  });

  it('does not write data to s3 if contents is unchanged', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: '',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(200, JSON.stringify(toAuthContent('1234')));

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
    });
    await p.beforeCacheAccess(ctx);
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, false);
  });

  it('does not write data to s3 if contents has empty Account key', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: '',
      type: 'onedrive',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .twice()
      .reply(404);

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data: { Account: {}, AccessToken: {} },
    });
    await p.beforeCacheAccess(ctx);
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, false);
  });

  it('writes data to s3 if contents has non empty AccessTokens key', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: '',
      type: 'onedrive',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .twice()
      .reply(404)
      .put('/myproject/auth-default/json?x-id=PutObject')
      .reply(204);

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data: { Account: {}, AccessToken: { secret: '1234' } },
    });
    await p.beforeCacheAccess(ctx);
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, true);
  });

  it('handles error during write', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: 'foobar',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(404)
      .put('/myproject/auth-default/json?x-id=PutObject')
      .reply(404);

    const ctx = new MockTokenCacheContext({
      cacheHasChanged: true,
      data: toAuthContent('1234'),
    });
    const ret = await p.afterCacheAccess(ctx);
    assert.strictEqual(ret, false);
  });

  it('read cache data from s3 w/o encryption', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: '',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(200, JSON.stringify({
        ...toAuthContent('1234'),
        cachePluginMetadata: {
          foo: 'bar',
        },
      }));

    const ctx = new MockTokenCacheContext({});
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.strictEqual(ctx.token, '1234');
    assert.deepStrictEqual(await p.getPluginMetadata(), { foo: 'bar' });
  });

  it('read cache data from s3 with encryption', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: 'foobar',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(200, encrypt('foobar', JSON.stringify(toAuthContent('1234'))));

    const ctx = new MockTokenCacheContext({
    });
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.strictEqual(ctx.token, '1234');
  });

  it('read cache data from s3 only once', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: 'foobar',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(200, encrypt('foobar', JSON.stringify(toAuthContent('1234'))));

    const ctx = new MockTokenCacheContext({
    });
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.strictEqual(ctx.token, '1234');

    assert.strictEqual(await p.beforeCacheAccess(ctx), true);
  });

  it('read plugin metadata first should return cached data from s3', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: 'foobar',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(200, encrypt('foobar', JSON.stringify(toAuthContent('1234'))));

    const metadata = await p.getPluginMetadata();
    assert.deepStrictEqual(metadata, {});

    const ctx = new MockTokenCacheContext({
    });
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, true);
    assert.strictEqual(ctx.token, '1234');
  });

  it('read cache data handles 404 error', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: 'foobar',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(404);

    const ctx = new MockTokenCacheContext({
    });
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, false);
    assert.strictEqual(ctx.token, '');
  });

  it('read plugin metadata from pristine plugin', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: '',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .reply(200, JSON.stringify({
        ...toAuthContent('1234'),
        cachePluginMetadata: {
          foo: 'bar',
        },
      }));

    assert.deepStrictEqual(await p.getPluginMetadata(), { foo: 'bar' });
  });

  it('read cache data handles generic error', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: 'foobar',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .get('/myproject/auth-default/json?x-id=GetObject')
      .replyWithError('kaput');

    const ctx = new MockTokenCacheContext({
    });
    const ret = await p.beforeCacheAccess(ctx);
    assert.strictEqual(ret, false);
    assert.strictEqual(ctx.token, '');
  });

  it('deletes the cache from s3', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: 'foobar',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .delete('/myproject/auth-default/json?x-id=DeleteObject')
      .reply(200);

    await p.deleteCache();
  });

  it('handles 404 error during delete', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: 'foobar',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .delete('/myproject/auth-default/json?x-id=DeleteObject')
      .reply(404);

    await p.deleteCache();
  });

  it('handles generic error during delete', async () => {
    const p = new S3CachePlugin({
      bucket: 'test-bucket',
      key: 'myproject/auth-default/json',
      secret: 'foobar',
    });

    nock('https://test-bucket.s3.us-east-1.amazonaws.com')
      .delete('/myproject/auth-default/json?x-id=DeleteObject')
      .replyWithError('kaput');

    await p.deleteCache();
  });
});
