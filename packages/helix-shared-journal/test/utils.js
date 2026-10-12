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

import { promisify } from 'node:util';
import assert from 'assert';
import nock from 'nock';
import xml2js from 'xml2js';
import zlib from 'zlib';

const gzip = promisify(zlib.gzip);

export function Nock() {
  const scopes = {};
  let unmatched;
  let savedEnv;

  function noMatchHandler(req) {
    unmatched.push(req);
  }

  function nocker(url) {
    let scope = scopes[url];
    if (!scope) {
      scope = nock(url);
      scopes[url] = scope;
    }
    if (!unmatched) {
      unmatched = [];
      nock.emitter.on('no match', noMatchHandler);
    }
    nock.disableNetConnect();
    return scope;
  }

  nocker.env = (overrides = {}) => {
    savedEnv = { ...process.env };
    Object.assign(process.env, {
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'foo',
      AWS_SECRET_ACCESS_KEY: 'bar',
      ...overrides,
    });
    return nocker;
  };

  nocker.done = () => {
    if (savedEnv) {
      process.env = savedEnv;
    }
    try {
      Object.values(scopes).forEach((s) => s.done());
    } finally {
      nock.cleanAll();
    }
    if (unmatched) {
      assert.deepStrictEqual(unmatched.map((req) => req.options || req), []);
      nock.emitter.off('no match', noMatchHandler);
    }
  };

  nocker.journal = (logFiles) => nocker('https://helix-adobe-logs.s3.us-east-1.amazonaws.com')
    .persist()
    .get('/org/site/.index?x-id=GetObject')
    .reply(200, logFiles.map(({ name }) => name).join('\n'), {
      'content-type': 'text/plain; charset=utf-8',
    })
    .get((uri) => uri.match('/org/site/[0-9A-F-]+'))
    .optionally()
    .reply(async (uri) => {
      const key = uri.split('/')[3].split('?')[0];
      const logFile = logFiles.find((f) => f.key === key);
      if (!logFile) {
        return [404, new xml2js.Builder().buildObject({
          Error: {
            Code: 'NoSuchKey',
            Message: 'The specified key does not exist.',
            Key: key,
          },
        })];
      }
      return [200, await gzip(JSON.stringify(logFile.entries)), {
        'content-type': 'application/json',
        'content-encoding': 'gzip',
      }];
    });

  return nocker;
}
