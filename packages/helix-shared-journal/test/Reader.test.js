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
import assert from 'assert';
import { promisify } from 'util';
import xml2js from 'xml2js';
import zlib from 'zlib';
import { Nock } from './utils.js';
import { Journal } from '../src/Journal.js';

const gzip = promisify(zlib.gzip);

describe('Journal Reader boundary tests', () => {
  let nock;

  /** @type {import('../src/Reader.js').default} */
  let journal;

  beforeEach(() => {
    nock = new Nock().env();
  });

  afterEach(() => {
    journal?.close();
    nock.done();
  });

  it('sends empty result if journal does not exist', async () => {
    nock('https://helix-adobe-logs.s3.us-east-1.amazonaws.com')
      .get('/org/.all/.index?x-id=GetObject')
      .reply(404);

    journal = await Journal.createReader('org', null, console).init();
    const result = await journal.getEntries(
      Date.parse('2023-09-23T12:00:00Z'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });

    const location = await journal.getEndLocation();
    assert.deepStrictEqual(location, { fileIndex: 0, entryIndex: 0 });
  });

  it('fails if journal file does not exist', async () => {
    nock('https://helix-adobe-logs.s3.us-east-1.amazonaws.com')
      .get('/org/site/.index?x-id=GetObject')
      .reply(200, '2023-09-22-12-13-00-3ADD0B52867FF57D', {
        'content-type': 'text/plain; charset=utf-8',
      })
      .get((uri) => uri.startsWith('/org/site/2023-09-22-12-13-00-3ADD0B52867FF57D.gz'))
      .reply(404, new xml2js.Builder().buildObject({
        Error: {
          Code: 'NoSuchKey',
          Message: 'The specified key does not exist.',
          Key: '/owner/repo/2023-09-22-12-13-00-3ADD0B52867FF57.gz',
        },
      }));
    journal = await Journal.createReader('org', 'site', console).init();
    await assert.rejects(
      async () => journal.getEntries(
        Date.parse('2023-09-23T12:00:00Z'),
        Date.parse('2023-09-24'),
        { limit: 1000 },
      ),
      /Unable to find journal log file '[/a-zA-Z0-9-.]+': The specified key does not exist/,
    );
  });

  it('allows overriding bucket name', async () => {
    nock('https://custom-bucket.s3.us-east-1.amazonaws.com')
      .get('/org/site/.index?x-id=GetObject')
      .reply(200, '2023-09-22-12-13-00-3ADD0B52867FF57D', {
        'content-type': 'text/plain; charset=utf-8',
      })
      .get((uri) => uri.startsWith('/org/site/2023-09-22-12-13-00-3ADD0B52867FF57D.gz'))
      .reply(200, await gzip(JSON.stringify([])), {
        'content-type': 'application/json',
        'content-encoding': 'gzip',
      });

    journal = await Journal.createReader('org', 'site', console, { bucketName: 'custom-bucket' }).init();
    const result = await journal.getEntries(
      Date.parse('2023-09-23T12:00:00Z'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });
  });
});

describe('Journal Reader functional tests', () => {
  const logFiles = [{
    name: '2023-09-22-12-13-00-3ADD0B52867FF57D',
    key: '2023-09-22-12-13-00-3ADD0B52867FF57D.gz',
    entries: [{
      timestamp: Date.parse('2023-09-22T12:13:00Z'),
    }, {
      timestamp: Date.parse('2023-09-22T19:55:00Z'),
    }, {
      timestamp: Date.parse('2023-09-22T21:55:00Z'),
    }],
  }, {
    name: '2023-09-23-01-45-00-D0B52867FF57D345',
    key: '2023-09-23-01-45-00-D0B52867FF57D345.gz',
    entries: [{
      timestamp: Date.parse('2023-09-23T01:45:00Z'),
    }],
  }];

  let nock;

  /** @type {import('../src/Reader.js').default} */
  let journal;

  beforeEach(() => {
    nock = new Nock().env();
    nock.journal(logFiles);
  });

  afterEach(() => {
    journal?.close();
    nock.done();
  });

  it('sends empty result `from` or `to` is not a number', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const result = await journal.getEntries(
      'from',
      'to',
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });
  });

  it('sends empty result if locations point outside known files', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const result = await journal.getNextPage(
      { fileIndex: 3, entryIndex: 0 },
      { fileIndex: 3, entryIndex: 0 },
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });
  });

  it('sends empty result if locations point outside known entries', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const result = await journal.getNextPage(
      { fileIndex: 0, entryIndex: 0 },
      { fileIndex: 0, entryIndex: 1000 },
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });
  });

  it('sends empty result if `start` location is greater or equal to `end`', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    let result = await journal.getNextPage(
      { fileIndex: 1, entryIndex: 0 },
      { fileIndex: 0, entryIndex: 1 },
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });

    result = await journal.getNextPage(
      { fileIndex: 0, entryIndex: 1 },
      { fileIndex: 0, entryIndex: 0 },
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });

    result = await journal.getNextPage(
      { fileIndex: 0, entryIndex: 1 },
      { fileIndex: 0, entryIndex: 1 },
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });
  });

  it('normalizes a `start` location at the end of a log file', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const result = await journal.getNextPage(
      { fileIndex: 0, entryIndex: logFiles[0].entries.length },
      { fileIndex: 1, entryIndex: 1 },
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: logFiles[1].entries });
  });

  it('does not normalizes a `start` location at the overall end', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const result = await journal.getNextPage(
      { fileIndex: 1, entryIndex: logFiles[1].entries.length },
      { fileIndex: 1, entryIndex: logFiles[1].entries.length },
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });
  });

  it('returns the end location of the last log file', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const last = await journal.getEndLocation();
    assert.deepStrictEqual(last, { fileIndex: 1, entryIndex: 1 });
  });

  it('rejects locations containing a string', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const result = await journal.getNextPage(
      { key: 'value' },
      { key: 'value' },
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });
  });

  it('rejects locations containing a float', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const result = await journal.getNextPage(
      { fileIndex: 0, entryIndex: 2.5 },
      { fileIndex: 0, entryIndex: 2.5 },
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });
  });

  it('sends empty result if `from` starts after last entry', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const result = await journal.getEntries(
      Date.parse('2023-09-23T12:00:00Z'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });
  });

  it('sends empty result if `to` stops before first entry', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const result = await journal.getEntries(
      Date.parse('2023-09-20'),
      Date.parse('2023-09-21'),
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });
  });

  it('returns first entry from the first log file', async () => {
    journal = await Journal.createReader('org', 'site', console).init();

    // get first page
    const result = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-22T21:55:00Z'),
      { limit: 1 },
    );
    assert.deepStrictEqual(result, {
      entries: logFiles[0].entries.slice(0, 1),
      start: { fileIndex: 0, entryIndex: 1 },
      end: { fileIndex: 0, entryIndex: 3 },
    });
  });

  it('returns `start` and `end` if there are more pages', async () => {
    journal = await Journal.createReader('org', 'site', console).init();

    // get first page
    let result = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, {
      entries: logFiles[0].entries,
      start: { fileIndex: 1, entryIndex: 0 },
      end: { fileIndex: 1, entryIndex: 1 },
    });

    // get second page
    result = await journal.getNextPage(
      result.start,
      result.end,
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: logFiles[1].entries });
  });

  it('returns part of a log file if `to` is smaller than some entry', async () => {
    journal = await Journal.createReader('org', 'site', console).init();

    const result = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-22T16:00:00Z'),
      { limit: 1000 },
    );

    assert.deepStrictEqual(result, { entries: logFiles[0].entries.slice(0, 1) });
  });

  it('returns part of a log file if `limit` is smaller than the number of available entries', async () => {
    journal = await Journal.createReader('org', 'site', console).init();

    let result = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-22T22:00:00Z'),
      { limit: 1 },
    );
    assert.deepStrictEqual(result, {
      entries: logFiles[0].entries.slice(0, 1),
      start: { fileIndex: 0, entryIndex: 1 },
      end: { fileIndex: 0, entryIndex: 3 },
    });

    // get second page
    result = await journal.getNextPage(
      result.start,
      result.end,
      { limit: 1 },
    );
    assert.deepStrictEqual(result, {
      entries: logFiles[0].entries.slice(1, 2),
      start: { fileIndex: 0, entryIndex: 2 },
      end: { fileIndex: 0, entryIndex: 3 },
    });

    // get third page
    result = await journal.getNextPage(
      result.start,
      result.end,
      { limit: 1 },
    );
    assert.deepStrictEqual(result, { entries: logFiles[0].entries.slice(2, 3) });
  });

  it('returns part of a log file if `maxSize` is smaller than the total size of available entries', async () => {
    journal = await Journal.createReader('org', 'site', console).init();

    let result = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-22T20:00:00Z'),
      { limit: 1000, maxSize: 1 },
    );
    assert.deepStrictEqual(result, {
      entries: logFiles[0].entries.slice(0, 1),
      start: { fileIndex: 0, entryIndex: 1 },
      end: { fileIndex: 0, entryIndex: 2 },
    });

    // size allows to return 2 entries
    result = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-23'),
      { limit: 1000, maxSize: 58 },
    );
    assert.deepStrictEqual(result, {
      entries: logFiles[0].entries.slice(0, 2),
      start: { fileIndex: 0, entryIndex: 2 },
      end: { fileIndex: 0, entryIndex: 3 },
    });
    assert(JSON.stringify(result.entries).length, 58);

    // size allows to return just 1 entry
    result = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-24'),
      { limit: 1000, maxSize: 57 },
    );
    assert.deepStrictEqual(result, {
      entries: logFiles[0].entries.slice(0, 1),
      start: { fileIndex: 0, entryIndex: 1 },
      end: { fileIndex: 1, entryIndex: 1 },
    });
  });

  it('returns part of a log file if `from` excludes some entries', async () => {
    journal = await Journal.createReader('org', 'site', console).init();

    const result = await journal.getEntries(
      Date.parse('2023-09-22T16:00:00Z'),
      Date.parse('2023-09-22T20:00:00Z'),
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: logFiles[0].entries.slice(1, 2) });
  });

  it('switches to next page if page found ends before `from`', async () => {
    journal = await Journal.createReader('org', 'site', console).init();

    const result = await journal.getEntries(
      Date.parse('2023-09-22T22:13:00Z'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: logFiles[1].entries });
  });
});

describe('Journal Reader large max size test', () => {
  const logFiles = [{
    name: '2023-09-22-12-13-00-3ADD0B52867FF57D',
    key: '2023-09-22-12-13-00-3ADD0B52867FF57D.gz',
    entries: Array.from({ length: 1000 }, (_, k) => ({
      detail: 'x'.repeat(6_000),
      timestamp: Date.parse(`2023-09-22T12:13:00.${k}Z`),
    })),
  }];

  let nock;

  /** @type {import('../src/Reader.js').default} */
  let journal;

  beforeEach(() => {
    nock = new Nock().env();
    nock.journal(logFiles);
  });

  afterEach(() => {
    journal?.close();
    nock.done();
  });

  it('returns part of a log file if all entries exceed a large `maxSize`', async () => {
    const maxSize = 6_000_000;

    journal = await Journal.createReader('org', 'site', console).init();
    const result = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-23'),
      { limit: 1000, maxSize },
    );
    assert.deepStrictEqual(result, {
      entries: logFiles[0].entries.slice(0, 993),
      start: { fileIndex: 0, entryIndex: 993 },
      end: { fileIndex: 0, entryIndex: 1000 },
    });
    assert(JSON.stringify(result.entries).length < maxSize);
  });
});

describe('Journal Reader pathological examples', () => {
  let nock;

  /** @type {import('../src/Reader.js').default} */
  let journal;

  beforeEach(() => {
    nock = new Nock().env();
  });

  afterEach(() => {
    journal?.close();
    nock.done();
  });

  it('log file name does not match timestamp contained', async () => {
    const logFiles = [{
      name: '2023-09-22-12-13-00-3ADD0B52867FF57D',
      key: '2023-09-22-12-13-00-3ADD0B52867FF57D.gz',
      entries: [{
        timestamp: Date.parse('2023-09-23T12:13:00.000Z'),
      }],
    }];
    nock.journal(logFiles);
    journal = await Journal.createReader('org', 'site', console).init();

    const result = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-23'),
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: [] });
  });

  it('second log file name does not match timestamp contained', async () => {
    const logFiles = [{
      name: '2023-09-22-12-13-00-3ADD0B52867FF57D',
      key: '2023-09-22-12-13-00-3ADD0B52867FF57D.gz',
      entries: [{
        timestamp: Date.parse('2023-09-22T12:13:00.000Z'),
      }],
    }, {
      name: '2023-09-22-13-13-00-3ADD0B52867FF57D',
      key: '2023-09-22-13-13-00-3ADD0B52867FF57D.gz',
      entries: [{
        timestamp: Date.parse('2023-09-23T13:13:00.000Z'),
      }],
    }];
    nock.journal(logFiles);
    journal = await Journal.createReader('org', 'site', console).init();

    const result = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-23'),
      { limit: 1000 },
    );
    assert.deepStrictEqual(result, { entries: logFiles[0].entries });
  });
});

describe('Journal custom file key', () => {
  it('returns a key in the site journal folder', () => {
    assert.deepStrictEqual(Journal.getBucketAndKey('org', 'site', 'custom.json', { bucketName: 'my-bucket' }), {
      bucket: 'my-bucket',
      key: 'org/site/custom.json',
    });
  });

  it('returns a key in the organization journal folder without a site', () => {
    assert.deepStrictEqual(Journal.getBucketAndKey('org', undefined, 'custom.json'), {
      bucket: 'helix-adobe-logs',
      key: 'org/.all/custom.json',
    });
    assert.deepStrictEqual(Journal.getBucketAndKey('org', null, 'custom.json'), {
      bucket: 'helix-adobe-logs',
      key: 'org/.all/custom.json',
    });
  });
});
