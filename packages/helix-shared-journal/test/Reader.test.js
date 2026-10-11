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
import assert from 'assert';
import { promisify } from 'util';
import xml2js from 'xml2js';
import zlib from 'zlib';
import { Nock } from './utils.js';
import { Journal } from '../src/index.js';

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
    const { entries, next } = await journal.getEntries(
      Date.parse('2023-09-23T12:00:00Z'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
    );
    assert.deepStrictEqual(entries, []);
    assert.strictEqual(next, undefined);
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
      /Unable to find journal file '[/a-zA-Z0-9-.]+': The specified key does not exist/,
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
    const { entries, next } = await journal.getEntries(
      Date.parse('2023-09-23T12:00:00Z'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
    );
    assert.deepStrictEqual(entries, []);
    assert.strictEqual(next, undefined);
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

  it('sends empty result if next points outside known files', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const { entries, next } = await journal.getEntries(
      Date.parse('2023-09-23T12:00:00Z'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
      { fileIndex: 3, entryIndex: 0 },
    );
    assert.deepStrictEqual(entries, []);
    assert.strictEqual(next, undefined);
  });

  it('sends empty result if next points outside known entries', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const { entries, next } = await journal.getEntries(
      Date.parse('2023-09-23T12:00:00Z'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
      { fileIndex: 0, entryIndex: 1000 },
    );
    assert.deepStrictEqual(entries, []);
    assert.strictEqual(next, undefined);
  });

  it('handles location containing a string', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const { entries, next } = await journal.getEntries(
      Date.parse('2023-09-22T20:13:00Z'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
      { key: 'value' },
    );
    assert.deepStrictEqual(entries, []);
    assert.strictEqual(next, undefined);
  });

  it('handles location containing a float', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const { entries, next } = await journal.getEntries(
      Date.parse('2023-09-22T20:13:00Z'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
      { fileIndex: 0, entryIndex: 2.5 },
    );
    assert.deepStrictEqual(entries, []);
    assert.strictEqual(next, undefined);
  });

  it('sends empty result if \'from\' starts after last entry', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    const { entries, next } = await journal.getEntries(
      Date.parse('2023-09-23T12:00:00Z'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
    );

    assert.deepStrictEqual(entries, []);
    assert.strictEqual(next, undefined);
  });

  it('sends a continuation token if there are more pages', async () => {
    journal = await Journal.createReader('org', 'site', console).init();

    // get first page
    let { entries, next } = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
    );
    assert.deepStrictEqual(entries, logFiles[0].entries);
    assert.notStrictEqual(next, undefined);

    // get second page
    ({ entries, next } = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
      next,
    ));
    assert.deepStrictEqual(entries, logFiles[1].entries);
    assert.strictEqual(next, undefined);
  });

  it('returns part of a log file if \'to\' is smaller than some entry', async () => {
    journal = await Journal.createReader('org', 'site', console).init();

    const { entries, next } = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-22T16:00:00Z'),
      { limit: 1000 },
    );

    assert.deepStrictEqual(entries, logFiles[0].entries.slice(0, 1));
    assert.strictEqual(next, undefined);
  });

  it('returns part of a log file if \'limit\' is smaller than the number of available entries', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    let { entries, next } = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-22T22:00:00Z'),
      { limit: 1 },
    );

    assert.deepStrictEqual(entries, logFiles[0].entries.slice(0, 1));
    assert.notStrictEqual(next, undefined);

    // get second page
    ({ entries, next } = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-22T22:00:00Z'),
      { limit: 1 },
      next,
    ));
    assert.deepStrictEqual(entries, logFiles[0].entries.slice(1, 2));

    // get third page
    ({ entries, next } = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-22T22:00:00Z'),
      { limit: 1 },
      next,
    ));
    assert.deepStrictEqual(entries, logFiles[0].entries.slice(2, 3));
    assert.strictEqual(next, undefined);
  });

  it('returns part of a log file if \'maxSize\' is smaller than the total size of available entries', async () => {
    journal = await Journal.createReader('org', 'site', console).init();
    let { entries, next } = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-22T20:00:00Z'),
      { limit: 1000, maxSize: 1 },
    );

    assert.deepStrictEqual(entries, logFiles[0].entries.slice(0, 1));
    assert.deepStrictEqual(next, { fileIndex: 0, entryIndex: 1 });

    ({ entries, next } = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-23'),
      { limit: 1000, maxSize: 58 },
    ));

    assert.deepStrictEqual(entries, logFiles[0].entries.slice(0, 2));
    assert(JSON.stringify(entries).length, 58);
    assert.deepStrictEqual(next, { fileIndex: 0, entryIndex: 2 });

    ({ entries, next } = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-24'),
      { limit: 1000, maxSize: 57 },
    ));

    assert.deepStrictEqual(entries, logFiles[0].entries.slice(0, 1));
    assert.deepStrictEqual(next, { fileIndex: 0, entryIndex: 1 });
  });

  it('returns part of a log file if \'from\' excludes some entries', async () => {
    journal = await Journal.createReader('org', 'site', console).init();

    const { entries, next } = await journal.getEntries(
      Date.parse('2023-09-22T16:00:00Z'),
      Date.parse('2023-09-22T20:00:00Z'),
      { limit: 1000 },
    );

    assert.deepStrictEqual(entries, logFiles[0].entries.slice(1, 2));
    assert.strictEqual(next, undefined);
  });

  it('switches to next page if page found ends before \'from\'', async () => {
    journal = await Journal.createReader('org', 'site', console).init();

    const { entries, next } = await journal.getEntries(
      Date.parse('2023-09-22T22:13:00Z'),
      Date.parse('2023-09-24'),
      { limit: 1000 },
    );

    assert.deepStrictEqual(entries, logFiles[1].entries);
    assert.strictEqual(next, undefined);
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
    const { entries, next } = await journal.getEntries(
      Date.parse('2023-09-22'),
      Date.parse('2023-09-23'),
      { limit: 1000, maxSize },
    );
    assert(JSON.stringify(entries).length < maxSize);
    assert.deepStrictEqual(next, { fileIndex: 0, entryIndex: 993 });
  });
});
