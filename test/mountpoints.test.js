/*
 * Copyright 2019 Adobe. All rights reserved.
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

process.env.HELIX_FETCH_FORCE_HTTP1 = 'true';

const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const MountConfig = require('../src/MountConfig');
const { setupPolly } = require('./utils.js');

describe('Mount Point Config Loading (from GitHub)', () => {
  setupPolly({
    recordIfMissing: true,
  });

  it('Retrieves Document from GitHub', async () => {
    const config = await new MountConfig()
      .withCache({ maxSize: 1 })
      .withRepo('adobe', 'theblog', '7f65c0399b1b925ececf55becd4b150c35733c36')
      .init();

    const match = config.match('/');

    assert.equal(match.url, 'https://adobe.sharepoint.com/sites/TheBlog/Shared%20Documents/theblog');
  });

  it.skip('Retrieves Document from GitHub with Auth', async function okGithub() {
    const { server } = this.polly;
    let foundtoken;
    let foundid;

    server
      .get('https://raw.githubusercontent.com/adobe/theblog/7f65c0399b1b925ececf55becd4b150c357-auth/fstab.yaml')
      .intercept((req, res) => {
        foundtoken = req.headers.authorization;
        foundid = req.headers['x-request-id'];
        res.status(200).send(`mountpoints:
  /: https://adobe.sharepoint.com/sites/TheBlog/Shared%20Documents/theblog`);
      });

    const config = await new MountConfig()
      .withCache({ maxSize: 1 })
      .withRepo('adobe', 'theblog', '7f65c0399b1b925ececf55becd4b150c357-auth', {
        headers: { Authorization: 'fake' },
      })
      .withTransactionID('random')
      .init();

    const match = config.match('/');

    assert.equal(foundid, 'random');
    assert.equal(foundtoken, 'fake');
    assert.equal(match.url, 'https://adobe.sharepoint.com/sites/TheBlog/Shared%20Documents/theblog');
  });

  it('Missing File from GitHub treated as empty', async () => {
    const config = await new MountConfig()
      .withCache({ maxSize: 1 })
      .withRepo('adobe', 'theblog', '7f65c0399b1b925ececf55becd4b150c35733-missing')
      .init();

    const match = config.match('/');

    assert.equal(match, null);
  });

  it.skip('Error from GitHub is propagated', async function okGithub() {
    const { server } = this.polly;

    server
      .get('https://raw.githubusercontent.com/adobe/theblog/7f65c0399b1b925ececf55becd4b150c35733-broken/fstab.yaml')
      .intercept((_, res) => res.sendStatus(503));

    try {
      await new MountConfig()
        .withCache({ maxSize: 1 })
        .withRepo('adobe', 'theblog', '7f65c0399b1b925ececf55becd4b150c35733-broken')
        .init();
      assert.fail('This should have thrown');
    } catch (e) {
      assert.equal(e.message, 'Unable to fetch fstab.yaml: Service Unavailable');
    }
  });
});

const SPEC_ROOT = path.resolve(__dirname, 'specs/mountconfigs');

const tests = [
  {
    title: 'fails with a broken config',
    config: 'broken.yaml',
    result: null,
    error: 'Error: data must NOT have additional properties',
  },
  {
    title: 'loads a theblog example',
    config: 'fstab.yaml',
    result: 'fstab.json',
  },
  {
    title: 'loads a complex example',
    config: 'complex.yaml',
    result: 'complex.json',
  },
  {
    title: 'loads an empty example',
    config: 'empty.yaml',
    result: 'empty.json',
  },
];

describe('Mount Point Config Loading', () => {
  tests.forEach((test) => {
    it(test.title, async () => {
      try {
        const cfg = await new MountConfig()
          .withConfigPath(path.resolve(SPEC_ROOT, test.config))
          .init();
        if (test.result) {
          const expected = JSON.parse(await fs.readFile(path.resolve(SPEC_ROOT, test.result), 'utf-8'));
          const actual = cfg.toJSON();
          assert.deepEqual(actual, expected);
        } else {
          assert.fail(`${test.title} should be invalid.`);
        }
      } catch (e) {
        if (test.error) {
          assert.equal(e.toString(), test.error);
        } else {
          throw e;
        }
      }
    });
  });

  it('theblog Mount Points get loaded', async () => {
    const cfg = await new MountConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'fstab.yaml'))
      .init();
    assert.equal(cfg.mountpoints.length, 1);
    assert.equal(cfg.mountpoints[0].path, '/');
    assert.equal(cfg.mountpoints[0].url, 'https://adobe.sharepoint.com/sites/TheBlog/Shared%20Documents/theblog?csf=1&e=8Znxth');

    const m1 = cfg.match('/index.md');
    assert.equal(m1.type, 'onedrive');
    assert.equal(m1.url, 'https://adobe.sharepoint.com/sites/TheBlog/Shared%20Documents/theblog?csf=1&e=8Znxth');
    assert.equal(m1.relPath, '/index.md');
  });

  it('Empty Mount Points gets properly evaluated', async () => {
    const cfg = await new MountConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'empty.yaml'))
      .init();
    assert.equal(cfg.match('/nomach'), null);
  });

  it('complex Mount Points gets properly evaluated', async () => {
    const cfg = await new MountConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'complex.yaml'))
      .init();
    assert.equal(cfg.match('/nomatch'), null);

    const m1 = cfg.match('/ms/en/posts/testdocument.md');
    assert.equal(m1.type, 'onedrive');
    assert.equal(m1.isDocument, undefined);
    assert.equal(m1.url, 'https://adobe.sharepoint.com/sites/TheBlog/Shared%20Documents/theblog');
    assert.equal(m1.relPath, '/en/posts/testdocument.md');

    const m2 = cfg.match('/ms/docs/different');
    assert.equal(m2.type, 'onedrive');
    assert.equal(m2.url, 'https://adobe.sharepoint.com/sites/docs', 'does not respect order');
    assert.equal(m2.relPath, '/different');
    assert.equal(m2.fallbackPath, 'default.docx');

    const m3 = cfg.match('/gd/document42');
    assert.equal(m3.type, 'google');
    assert.equal(m3.url, 'https://drive.google.com/drive/u/0/folders/123456789');
    assert.equal(m3.path, '/gd/');
    assert.equal(m3.id, '123456789');
    assert.equal(m3.fallbackPath, 'default.md');
    assert.equal(m3.relPath, '/document42');

    const m4 = cfg.match('/foo/en/welcome');
    assert.equal(m4.type, undefined);
    assert.equal(m4.url, 'https://localhost:4502');
    assert.equal(m4.relPath, '/en/welcome');

    const m5 = cfg.match('/ms/doc');
    assert.equal(m5.type, 'onedrive');
    assert.equal(m5.url, 'https://adobe.sharepoint.com/sites/TheBlog/Shared%20Documents/theblog', 'is confused by slashes');
    assert.equal(m5.relPath, '/doc');

    // trailing slash check
    const m6 = cfg.match('/ms');
    assert.equal(m6.type, 'onedrive');
    assert.equal(m6.url, 'https://adobe.sharepoint.com/sites/TheBlog/Shared%20Documents/theblog', 'is confused by slashes');
    assert.equal(m6.relPath, '');

    // onedrive document check with extension
    const m7 = cfg.match('/onedrive-index');
    assert.equal(m7.type, 'onedrive');
    assert.equal(m7.path, '/onedrive-index.md');
    assert.equal(m7.url, 'https://adobe.sharepoint.com/sites/TheBlog/Shared%20Documents/theblog/homepage.docx');
    assert.equal(m7.isDocument, true);
    assert.equal(m7.relPath, '');

    // google drive document check
    const m8 = cfg.match('/google-index');
    assert.equal(m8.type, 'google');
    assert.equal(m8.url, 'gdrive:complexitemid');
    assert.equal(m8.id, 'complexitemid');
    assert.equal(m8.isDocument, true);
    assert.equal(m8.relPath, '');

    // onedrive with onedrive uri
    const m9 = cfg.match('/mswithid/foo');
    assert.equal(m9.type, 'onedrive');
    assert.equal(m9.url, 'onedrive:/drives/1234/items/5678');
    assert.equal(m9.relPath, '/foo');

    // gdrive without account selectors
    const m10 = cfg.match('/gd-no-account/foo');
    assert.equal(m10.type, 'google');
    assert.equal(m10.id, '3453k4j3l4kjlk');
    assert.equal(m10.relPath, '/foo');

    // gdrive with query string
    const m11 = cfg.match('/gd-with-query/foo');
    assert.equal(m11.type, 'google');
    assert.equal(m11.id, '99f999f99f9fff');
    assert.equal(m11.relPath, '/foo');

    // github simple
    const m12 = cfg.match('/github-simple/foo');
    assert.equal(m12.type, 'github');
    assert.equal(m12.owner, 'adobe');
    assert.equal(m12.repo, 'helix-shared');
    assert.equal(m12.ref, undefined);
    assert.equal(m12.relPath, '/foo');

    // github with path
    const m13 = cfg.match('/github-path/foo');
    assert.equal(m13.type, 'github');
    assert.equal(m13.owner, 'adobe');
    assert.equal(m13.repo, 'helix-shared');
    assert.equal(m13.ref, 'main');
    assert.equal(m13.relPath, '/foo');

    // github with branch
    const m14 = cfg.match('/github-branch/foo');
    assert.equal(m14.type, 'github');
    assert.equal(m14.owner, 'adobe');
    assert.equal(m14.repo, 'helix-shared');
    assert.equal(m14.ref, 'downloader');
    assert.equal(m14.relPath, '/foo');

    assert.equal(cfg.match('/mssoft'), null, 'requires trailing slash in matches');

    // with credentials
    const m15 = cfg.match('/creds');
    assert.deepEqual(m15.credentials, ['abcd']);

    // with multiple credentials
    const m16 = cfg.match('/multicreds');
    assert.deepEqual(m16.credentials, ['abcd', 'efgh']);
  });
});
