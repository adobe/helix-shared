/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const assert = require('assert');
const nock = require('nock');

const FSTAB = `
mountpoints:
  /: https://drive.google.com/drive/u/2/folders/1vjng4ahZWph-9oeaMae16P9Kbb3xg4Cg
`;

const DEFAULT_CONTEXT = () => ({
  log: console,
  env: {
    AWS_S3_REGION: 'us-east-1',
    AWS_S3_ACCESS_KEY_ID: 'fake-key-id',
    AWS_S3_SECRET_ACCESS_KEY: 'fake-secret',
  },
  resolver: {
    createURL({ package, name, version }) {
      return new URL(`https://example.com/${package}/${name}@${version}`);
    },
  },
});

function Nock() {
  const DEFAULT_AUTH = {
    token_type: 'Bearer',
    refresh_token: 'dummy',
    access_token: 'dummy',
    expires_in: 181000,
  };

  const scopes = {};

  let unmatched;

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
    return scope;
  }

  nocker.done = () => {
    Object.values(scopes).forEach((s) => s.done());
    if (unmatched) {
      assert.deepStrictEqual(unmatched.map((req) => req.options || req), []);
      nock.emitter.off('no match', noMatchHandler);
    }
  };

  nocker.fstab = (fstab = FSTAB, owner = 'owner', repo = 'repo', ref = 'ref') => nocker('https://helix-code-bus.s3.us-east-1.amazonaws.com')
    .get(`/${owner}/${repo}/${ref}/fstab.yaml?x-id=GetObject`)
    .reply(200, fstab);

  nocker.index = (index, owner = 'owner', repo = 'repo', ref = 'ref') => nocker('https://helix-code-bus.s3.us-east-1.amazonaws.com')
    .get(`/${owner}/${repo}/${ref}/helix-query.yaml?x-id=GetObject`)
    .reply(200, index);

  nocker.loginWindowsNet = (auth = DEFAULT_AUTH) => nocker('https://login.windows.net')
    .post('/common/oauth2/token?api-version=1.0')
    .reply(200, auth);

  nocker.mockIgnore = ({
    content = '',
    route = '/adobe/theblog/ignore-tests/.hlxignore',
    status = 404,
    times = 1,
    optional = false,
  } = {}) => nocker('https://raw.githubusercontent.com')
    .get(route)
    .times(times)
    .optionally(optional)
    .reply(status, content);

  return nocker;
}

module.exports = { Nock, DEFAULT_CONTEXT };
