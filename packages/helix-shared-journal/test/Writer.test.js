/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable func-names */

import assert from 'assert';
import { promisify } from 'util';
import xml2js from 'xml2js';
import zlib from 'zlib';

import { Journal } from '../src/index.js';
import { Nock } from './utils.js';

const gzip = promisify(zlib.gzip);

describe('Journal writer tests', () => {
  let nock;
  let writer;

  beforeEach(() => {
    nock = new Nock().env();
  });

  afterEach(() => {
    writer?.close();
    nock.done();
  });

  const updates = [{
    timestamp: 1692341577220,
    duration: 1569,
    status: 200,
    method: 'POST',
    route: 'preview',
    org: 'org',
    site: 'site',
    owner: 'owner',
    repo: 'repo',
    ref: 'ref',
    path: '/sample.png',
  }];

  it('Create writer and append data', async () => {
    const contents = await gzip(JSON.stringify([]));

    nock('https://helix-adobe-logs.s3.us-east-1.amazonaws.com')
      .get('/org/site/.index?x-id=GetObject')
      .reply(200, '2023-09-14-14-14-23-3ADD0B52867FF57D', {
        'content-type': 'text/plain',
      })
      .get('/org/site/2023-09-14-14-14-23-3ADD0B52867FF57D.gz?x-id=GetObject')
      .reply(200, contents, {
        'content-type': 'application/json',
        'content-length': contents.length,
        'content-encoding': 'gzip',
      })
      .put('/org/site/2023-09-14-14-14-23-3ADD0B52867FF57D.gz?x-id=PutObject')
      .reply(function (_, body) {
        assert.strictEqual(this.req.headers['x-amz-meta-last-event-time'], '2023-08-18-06-52-57');
        assert.deepStrictEqual(body, updates);
        return [201];
      });

    writer = await Journal.createWriter('org', 'site', console).init();
    let key = await writer.append([]);
    assert.strictEqual(key, null);
    key = await writer.append(updates);
    assert.notStrictEqual(key, null);
  });

  it('Simulate pristine environment', async () => {
    let lastLog;

    nock('https://helix-adobe-logs.s3.us-east-1.amazonaws.com')
      .get('/org/site/.index?x-id=GetObject')
      .reply(404, new xml2js.Builder().buildObject({
        Error: {
          Code: 'NoSuchKey',
          Message: 'The specified key does not exist.',
          Key: '/owner/repo/.index',
        },
      }))
      .put('/org/site/.index?x-id=PutObject')
      .reply((_, body) => {
        const logFiles = body.split('\n');
        lastLog = logFiles[logFiles.length - 1];
        return [201];
      })
      .put((uri) => uri.startsWith(`/org/site/${lastLog}`))
      .reply(201);

    writer = await Journal.createWriter('org', 'site', console).init();
    await writer.append(updates);
  });

  it('Simulate environment where last log has no .gz extension', async () => {
    let lastLog;

    nock('https://helix-adobe-logs.s3.us-east-1.amazonaws.com')
      .get('/org/site/.index?x-id=GetObject')
      .reply(200, '2023-09-14-14-14-23-3ADD0B52867FF57D', {
        'content-type': 'text/plain',
      })
      .get('/org/site/2023-09-14-14-14-23-3ADD0B52867FF57D.gz?x-id=GetObject')
      .reply(404, new xml2js.Builder().buildObject({
        Error: {
          Code: 'NoSuchKey',
          Message: 'The specified key does not exist.',
          Key: '/owner/repo/.index',
        },
      }))
      .put('/org/site/.index?x-id=PutObject')
      .reply((_, body) => {
        const logFiles = body.split('\n');
        lastLog = logFiles[logFiles.length - 1];
        return [201];
      })
      .put((uri) => uri.startsWith(`/org/site/${lastLog}.gz`))
      .reply(201);

    writer = await Journal.createWriter('org', 'site', console).init();
    await writer.append(updates);
  });

  it('Simulate environment where last log is too large', async () => {
    const largeContents = await gzip(JSON.stringify(
      Array.from({ length: 100 }, () => (updates[0])),
    ));
    let lastLog;

    nock('https://helix-adobe-logs.s3.us-east-1.amazonaws.com')
      .get('/org/.all/.index?x-id=GetObject')
      .reply(200, '2023-09-14-14-14-23-3ADD0B52867FF57D', {
        'content-type': 'text/plain',
      })
      .get('/org/.all/2023-09-14-14-14-23-3ADD0B52867FF57D.gz?x-id=GetObject')
      .reply(200, largeContents, {
        'content-type': 'application/json',
        'content-length': largeContents.length,
        'content-encoding': 'gzip',
      })
      .put('/org/.all/.index?x-id=PutObject')
      .reply((_, body) => {
        const logFiles = body.split('\n');
        assert.strictEqual(logFiles.length, 2);
        lastLog = logFiles[logFiles.length - 1];
        return [201];
      })
      .put((uri) => uri.startsWith(`/org/.all/${lastLog}.gz`))
      .reply(201);

    writer = await Journal.createWriter('org', null, console, {
      maxObjectSize: 100,
    }).init();
    await writer.append(updates);
  });

  it('Allows overriding bucket name', async () => {
    const contents = await gzip(JSON.stringify([]));

    nock('https://custom-bucket.s3.us-east-1.amazonaws.com')
      .get('/org/site/.index?x-id=GetObject')
      .reply(200, '2023-09-14-14-14-23-3ADD0B52867FF57D', {
        'content-type': 'text/plain',
      })
      .get('/org/site/2023-09-14-14-14-23-3ADD0B52867FF57D.gz?x-id=GetObject')
      .reply(200, contents, {
        'content-type': 'application/json',
        'content-length': contents.length,
        'content-encoding': 'gzip',
      })
      .put('/org/site/2023-09-14-14-14-23-3ADD0B52867FF57D.gz?x-id=PutObject')
      .reply(function (_, body) {
        assert.strictEqual(this.req.headers['x-amz-meta-last-event-time'], '2023-08-18-06-52-57');
        assert.deepStrictEqual(body, updates);
        return [201];
      });

    writer = await Journal.createWriter('org', 'site', console, { bucketName: 'custom-bucket' }).init();
    await writer.append(updates);
  });
});
