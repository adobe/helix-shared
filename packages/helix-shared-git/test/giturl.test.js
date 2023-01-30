/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* global describe, it */

import assert from 'assert';
import YAML from 'yaml';
import { GitUrl } from '../src/index.js';

describe('GitUrl from string tests', () => {
  it('Fails for no arguments', () => {
    try {
      const url = new GitUrl();
      assert.ok(!url, 'should fail with no arguments');
    } catch (e) {
      assert.equal(e.message, 'Invalid Git URL: URL is undefined (no URL given).');
    }
  });

  it('Fails for non git-url arguments', () => {
    try {
      const url = new GitUrl('https://github.com/no');
      assert.ok(!url, 'should fail with no arguments');
    } catch (e) {
      assert.equal(e.message, 'Invalid URL: Not a valid git url: https://github.com/no');
    }
  });

  it('Full example', () => {
    const url = new GitUrl('http://users:password@git.example.com:1234/company/repository.git/docs/main#products/v2');
    assert.equal(url.protocol, 'http');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '1234');
    assert.equal(url.host, 'git.example.com:1234');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '/docs/main');
    assert.equal(url.ref, 'products/v2');
    assert.equal(url.raw, 'http://raw.git.example.com:1234/company/repository/products/v2');
    assert.equal(url.rawRoot, 'http://raw.git.example.com:1234');
    assert.equal(url.apiRoot, 'http://api.git.example.com:1234');
    assert.equal(url.isLocal, false);
    assert.equal(url.toString(), 'http://users:password@git.example.com:1234/company/repository.git/docs/main#products/v2');
    assert.deepEqual(url.toJSON(), {
      protocol: 'http',
      host: 'git.example.com:1234',
      hostname: 'git.example.com',
      owner: 'company',
      path: '/docs/main',
      port: '1234',
      ref: 'products/v2',
      repo: 'repository',
    });
  });

  it('Default port', () => {
    const url = new GitUrl('http://git.example.com/company/repository.git/docs/main#products/v2');
    assert.equal(url.protocol, 'http');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '');
    assert.equal(url.host, 'git.example.com');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '/docs/main');
    assert.equal(url.ref, 'products/v2');
    assert.equal(url.raw, 'http://raw.git.example.com/company/repository/products/v2');
    assert.equal(url.rawRoot, 'http://raw.git.example.com');
    assert.equal(url.apiRoot, 'http://api.git.example.com');
    assert.equal(url.toString(), 'http://git.example.com/company/repository.git/docs/main#products/v2');
    assert.equal(url.isLocal, false);
    assert.deepEqual(url.toJSON(), {
      protocol: 'http',
      host: 'git.example.com',
      hostname: 'git.example.com',
      owner: 'company',
      path: '/docs/main',
      port: '',
      ref: 'products/v2',
      repo: 'repository',
    });
  });

  it('Default ref', () => {
    const url = new GitUrl('http://git.example.com:1234/company/repository.git/docs/main');
    assert.equal(url.protocol, 'http');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '1234');
    assert.equal(url.host, 'git.example.com:1234');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '/docs/main');
    assert.equal(url.ref, '');
    assert.equal(url.raw, 'http://raw.git.example.com:1234/company/repository/master');
    assert.equal(url.rawRoot, 'http://raw.git.example.com:1234');
    assert.equal(url.apiRoot, 'http://api.git.example.com:1234');
    assert.equal(url.toString(), 'http://git.example.com:1234/company/repository.git/docs/main');
    assert.equal(url.isLocal, false);
    assert.deepEqual(url.toJSON(), {
      protocol: 'http',
      host: 'git.example.com:1234',
      hostname: 'git.example.com',
      owner: 'company',
      path: '/docs/main',
      port: '1234',
      ref: '',
      repo: 'repository',
    });
  });

  it('ref in defaults', () => {
    const url = new GitUrl('http://git.example.com:1234/company/repository.git/docs/main', { ref: 'myref' });
    assert.equal(url.protocol, 'http');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '1234');
    assert.equal(url.host, 'git.example.com:1234');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '/docs/main');
    assert.equal(url.ref, 'myref');
    assert.equal(url.raw, 'http://raw.git.example.com:1234/company/repository/myref');
    assert.equal(url.rawRoot, 'http://raw.git.example.com:1234');
    assert.equal(url.apiRoot, 'http://api.git.example.com:1234');
    assert.equal(url.toString(), 'http://git.example.com:1234/company/repository.git/docs/main#myref');
    assert.equal(url.isLocal, false);
    assert.deepEqual(url.toJSON(), {
      protocol: 'http',
      host: 'git.example.com:1234',
      hostname: 'git.example.com',
      owner: 'company',
      path: '/docs/main',
      port: '1234',
      ref: 'myref',
      repo: 'repository',
    });
  });

  it('No Path', () => {
    const url = new GitUrl('http://git.example.com:1234/company/repository.git#products/v2');
    assert.equal(url.protocol, 'http');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '1234');
    assert.equal(url.host, 'git.example.com:1234');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '');
    assert.equal(url.ref, 'products/v2');
    assert.equal(url.raw, 'http://raw.git.example.com:1234/company/repository/products/v2');
    assert.equal(url.rawRoot, 'http://raw.git.example.com:1234');
    assert.equal(url.apiRoot, 'http://api.git.example.com:1234');
    assert.equal(url.toString(), 'http://git.example.com:1234/company/repository.git#products/v2');
    assert.equal(url.isLocal, false);
    assert.deepEqual(url.toJSON(), {
      protocol: 'http',
      host: 'git.example.com:1234',
      hostname: 'git.example.com',
      owner: 'company',
      path: '',
      port: '1234',
      ref: 'products/v2',
      repo: 'repository',
    });
  });

  it('path in defaults', () => {
    const url = new GitUrl('http://git.example.com:1234/company/repository.git#products/v2', { path: '/foo' });
    assert.equal(url.protocol, 'http');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '1234');
    assert.equal(url.host, 'git.example.com:1234');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '/foo');
    assert.equal(url.ref, 'products/v2');
    assert.equal(url.raw, 'http://raw.git.example.com:1234/company/repository/products/v2');
    assert.equal(url.rawRoot, 'http://raw.git.example.com:1234');
    assert.equal(url.apiRoot, 'http://api.git.example.com:1234');
    assert.equal(url.toString(), 'http://git.example.com:1234/company/repository.git/foo#products/v2');
    assert.equal(url.isLocal, false);
    assert.deepEqual(url.toJSON(), {
      protocol: 'http',
      host: 'git.example.com:1234',
      hostname: 'git.example.com',
      owner: 'company',
      path: '/foo',
      port: '1234',
      ref: 'products/v2',
      repo: 'repository',
    });
  });

  it('Root Path', () => {
    const url = new GitUrl('http://git.example.com:1234/company/repository.git/#products/v2');
    assert.equal(url.protocol, 'http');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '1234');
    assert.equal(url.host, 'git.example.com:1234');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '');
    assert.equal(url.ref, 'products/v2');
    assert.equal(url.raw, 'http://raw.git.example.com:1234/company/repository/products/v2');
    assert.equal(url.rawRoot, 'http://raw.git.example.com:1234');
    assert.equal(url.apiRoot, 'http://api.git.example.com:1234');
    assert.equal(url.toString(), 'http://git.example.com:1234/company/repository.git#products/v2');
    assert.equal(url.isLocal, false);
    assert.deepEqual(url.toJSON(), {
      protocol: 'http',
      host: 'git.example.com:1234',
      hostname: 'git.example.com',
      owner: 'company',
      path: '',
      port: '1234',
      ref: 'products/v2',
      repo: 'repository',
    });
  });

  it('Bare', () => {
    const url = new GitUrl('http://git.example.com:1234/company/repository.git');
    assert.equal(url.protocol, 'http');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '1234');
    assert.equal(url.host, 'git.example.com:1234');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '');
    assert.equal(url.ref, '');
    assert.equal(url.raw, 'http://raw.git.example.com:1234/company/repository/master');
    assert.equal(url.rawRoot, 'http://raw.git.example.com:1234');
    assert.equal(url.apiRoot, 'http://api.git.example.com:1234');
    assert.equal(url.isLocal, false);
    assert.equal(url.toString(), 'http://git.example.com:1234/company/repository.git');
    assert.deepEqual(url.toJSON(), {
      protocol: 'http',
      host: 'git.example.com:1234',
      hostname: 'git.example.com',
      owner: 'company',
      path: '',
      port: '1234',
      ref: '',
      repo: 'repository',
    });
  });

  it('IP instead of hostname', () => {
    const url = new GitUrl('http://127.0.0.1:1234/company/repository.git');
    assert.equal(url.protocol, 'http');
    assert.equal(url.hostname, '127.0.0.1');
    assert.equal(url.port, '1234');
    assert.equal(url.host, '127.0.0.1:1234');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '');
    assert.equal(url.ref, '');
    assert.equal(url.raw, 'http://127.0.0.1:1234/raw/company/repository/master');
    assert.equal(url.rawRoot, 'http://127.0.0.1:1234/raw');
    assert.equal(url.apiRoot, 'http://127.0.0.1:1234/api');
    assert.equal(url.isLocal, false);
    assert.equal(url.toString(), 'http://127.0.0.1:1234/company/repository.git');
    assert.deepEqual(url.toJSON(), {
      protocol: 'http',
      host: '127.0.0.1:1234',
      hostname: '127.0.0.1',
      owner: 'company',
      path: '',
      port: '1234',
      ref: '',
      repo: 'repository',
    });
  });

  it('scp origin format', () => {
    const url = new GitUrl('git@git.example.com:company/repository.git');
    assert.equal(url.protocol, 'ssh');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '');
    assert.equal(url.host, 'git.example.com');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '');
    assert.equal(url.ref, '');
    assert.equal(url.raw, 'https://raw.git.example.com/company/repository/master');
    assert.equal(url.rawRoot, 'https://raw.git.example.com');
    assert.equal(url.apiRoot, 'https://api.git.example.com');
    assert.equal(url.isLocal, false);
    assert.equal(url.toString(), 'ssh://git@git.example.com/company/repository.git');
    assert.deepEqual(url.toJSON(), {
      protocol: 'ssh',
      host: 'git.example.com',
      hostname: 'git.example.com',
      owner: 'company',
      path: '',
      port: '',
      ref: '',
      repo: 'repository',
    });
  });
  it('scp origin format (no .git)', () => {
    const url = new GitUrl('git@git.example.com:company/repository');
    assert.equal(url.protocol, 'ssh');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '');
    assert.equal(url.host, 'git.example.com');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '');
    assert.equal(url.ref, '');
    assert.equal(url.raw, 'https://raw.git.example.com/company/repository/master');
    assert.equal(url.rawRoot, 'https://raw.git.example.com');
    assert.equal(url.apiRoot, 'https://api.git.example.com');
    assert.equal(url.isLocal, false);
    assert.equal(url.toString(), 'ssh://git@git.example.com/company/repository.git');
    assert.deepEqual(url.toJSON(), {
      protocol: 'ssh',
      host: 'git.example.com',
      hostname: 'git.example.com',
      owner: 'company',
      path: '',
      port: '',
      ref: '',
      repo: 'repository',
    });
  });

  it('scp origin format with branch', () => {
    const url = new GitUrl('git@git.example.com:company/repository.git#products/v2');
    assert.equal(url.protocol, 'ssh');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '');
    assert.equal(url.host, 'git.example.com');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '');
    assert.equal(url.ref, 'products/v2');
    assert.equal(url.raw, 'https://raw.git.example.com/company/repository/products/v2');
    assert.equal(url.rawRoot, 'https://raw.git.example.com');
    assert.equal(url.apiRoot, 'https://api.git.example.com');
    assert.equal(url.isLocal, false);
    assert.equal(url.toString(), 'ssh://git@git.example.com/company/repository.git#products/v2');
    assert.deepEqual(url.toJSON(), {
      protocol: 'ssh',
      host: 'git.example.com',
      hostname: 'git.example.com',
      owner: 'company',
      path: '',
      port: '',
      ref: 'products/v2',
      repo: 'repository',
    });
  });
  it('scp origin format with branch (no .git)', () => {
    const url = new GitUrl('git@git.example.com:company/repository#products/v2');
    assert.equal(url.protocol, 'ssh');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '');
    assert.equal(url.host, 'git.example.com');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '');
    assert.equal(url.ref, 'products/v2');
    assert.equal(url.raw, 'https://raw.git.example.com/company/repository/products/v2');
    assert.equal(url.rawRoot, 'https://raw.git.example.com');
    assert.equal(url.apiRoot, 'https://api.git.example.com');
    assert.equal(url.isLocal, false);
    assert.equal(url.toString(), 'ssh://git@git.example.com/company/repository.git#products/v2');
    assert.deepEqual(url.toJSON(), {
      protocol: 'ssh',
      host: 'git.example.com',
      hostname: 'git.example.com',
      owner: 'company',
      path: '',
      port: '',
      ref: 'products/v2',
      repo: 'repository',
    });
  });

  it('local git url', () => {
    const url = new GitUrl('https://localhost/local/default.git');
    assert.equal(url.isLocal, true);
  });
  it('local git url with ref', () => {
    const url = new GitUrl('https://localhost/local/default.git#tag123');
    assert.equal(url.isLocal, true);
  });

  it('Fails for non scp-url arguments', () => {
    try {
      const url = new GitUrl('git@github.com/no/git');
      assert.ok(!url, 'should fail with no arguments');
    } catch (e) {
      assert.equal(e.message, 'Invalid URL: Not a valid scp-style git url (missing the path to the actual repo): git@github.com/no/git');
    }
  });
});

describe('GitUrl from object tests', () => {
  it('Full example no defaults', () => {
    const url = new GitUrl({
      protocol: 'http',
      hostname: 'git.example.com',
      owner: 'company',
      path: '/docs/main',
      port: '1234',
      ref: 'products/v2',
      repo: 'repository',
    });
    assert.equal(url.protocol, 'http');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '1234');
    assert.equal(url.host, 'git.example.com:1234');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '/docs/main');
    assert.equal(url.ref, 'products/v2');
    assert.equal(url.raw, 'http://raw.git.example.com:1234/company/repository/products/v2');
    assert.equal(url.rawRoot, 'http://raw.git.example.com:1234');
    assert.equal(url.apiRoot, 'http://api.git.example.com:1234');
    assert.equal(url.isLocal, false);
    assert.equal(url.toString(), 'http://git.example.com:1234/company/repository.git/docs/main#products/v2');
    assert.deepEqual(url.toJSON(), {
      protocol: 'http',
      host: 'git.example.com:1234',
      hostname: 'git.example.com',
      owner: 'company',
      path: '/docs/main',
      port: '1234',
      ref: 'products/v2',
      repo: 'repository',
    });
  });

  it('minimal example no defaults', () => {
    const url = new GitUrl({
      owner: 'company',
      repo: 'repository',
    });
    assert.equal(url.protocol, 'https');
    assert.equal(url.hostname, 'github.com');
    assert.equal(url.port, '');
    assert.equal(url.host, 'github.com');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '');
    assert.equal(url.ref, '');
    assert.equal(url.raw, 'https://raw.githubusercontent.com/company/repository/master');
    assert.equal(url.rawRoot, 'https://raw.githubusercontent.com');
    assert.equal(url.apiRoot, 'https://api.github.com');
    assert.equal(url.isLocal, false);
    assert.equal(url.toString(), 'https://github.com/company/repository.git');
    assert.deepEqual(url.toJSON(), {
      protocol: 'https',
      host: 'github.com',
      hostname: 'github.com',
      owner: 'company',
      path: '',
      port: '',
      ref: '',
      repo: 'repository',
    });
  });

  it('minimal example with .git reponame', () => {
    const url = new GitUrl({
      owner: 'company',
      repo: 'repository.git',
    });
    assert.equal(url.protocol, 'https');
    assert.equal(url.hostname, 'github.com');
    assert.equal(url.port, '');
    assert.equal(url.host, 'github.com');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '');
    assert.equal(url.ref, '');
    assert.equal(url.raw, 'https://raw.githubusercontent.com/company/repository/master');
    assert.equal(url.rawRoot, 'https://raw.githubusercontent.com');
    assert.equal(url.apiRoot, 'https://api.github.com');
    assert.equal(url.isLocal, false);
    assert.equal(url.toString(), 'https://github.com/company/repository.git');
    assert.deepEqual(url.toJSON(), {
      protocol: 'https',
      host: 'github.com',
      hostname: 'github.com',
      owner: 'company',
      path: '',
      port: '',
      ref: '',
      repo: 'repository',
    });
  });

  it('Full example with defaults', () => {
    const url = new GitUrl(
      {},
      {
        protocol: 'http',
        hostname: 'git.example.com',
        owner: 'company',
        path: '/docs/main',
        port: '1234',
        ref: 'products/v2',
        repo: 'repository',
      },
    );
    assert.equal(url.protocol, 'http');
    assert.equal(url.hostname, 'git.example.com');
    assert.equal(url.port, '1234');
    assert.equal(url.host, 'git.example.com:1234');
    assert.equal(url.owner, 'company');
    assert.equal(url.repo, 'repository');
    assert.equal(url.path, '/docs/main');
    assert.equal(url.ref, 'products/v2');
    assert.equal(url.raw, 'http://raw.git.example.com:1234/company/repository/products/v2');
    assert.equal(url.rawRoot, 'http://raw.git.example.com:1234');
    assert.equal(url.apiRoot, 'http://api.git.example.com:1234');
    assert.equal(url.isLocal, false);
    assert.equal(url.toString(), 'http://git.example.com:1234/company/repository.git/docs/main#products/v2');
    assert.deepEqual(url.toJSON(), {
      protocol: 'http',
      host: 'git.example.com:1234',
      hostname: 'git.example.com',
      owner: 'company',
      path: '/docs/main',
      port: '1234',
      ref: 'products/v2',
      repo: 'repository',
    });
  });

  it('missing required field: owner', () => {
    try {
      const url = new GitUrl({
        repo: 'repository',
      });
      assert.ok(!url, 'should fail with no arguments');
    } catch (e) {
      assert.equal(e.message, 'Invalid Git URL: Could not extract owner. Not a github repository url?');
    }
  });

  it('missing required field: repo', () => {
    try {
      const url = new GitUrl({
        owner: 'owner',
      });
      assert.ok(!url, 'should fail with no arguments');
    } catch (e) {
      assert.equal(e.message, 'Invalid Git URL: Could not extract repository. Not a github repository url?');
    }
  });

  it('parse roundtrip from http', () => {
    const original = 'http://localhost/owner/repo.git#local_path';
    const result = new GitUrl(original).toString();
    assert.equal(result, original);
  });

  it('appends .git if missing', () => {
    const original = 'http://localhost/owner/repo#local_path';
    const expected = 'http://localhost/owner/repo.git#local_path';
    const result = new GitUrl(original).toString();
    assert.equal(result, expected);
  });

  it('parse roundtrip from https', () => {
    const original = 'https://localhost/owner/repo.git#local_path';
    const result = new GitUrl(original).toString();
    assert.equal(result, original);
  });

  it('init roundtrip from http', () => {
    const src = 'http://localhost/owner/repo.git#local_path';
    const original = new GitUrl(src);
    const result = new GitUrl(original);
    assert.equal(result.toString(), src);
  });

  it('init roundtrip from https', () => {
    const src = 'https://localhost/owner/repo.git#local_path';
    const original = new GitUrl(src);
    const result = new GitUrl(original);
    assert.equal(result.toString(), src);
  });

  it('equalsIgnoreTransport', () => {
    const url0 = new GitUrl('https://localhost/owner/repo.git#local_path');
    const url1 = new GitUrl('ssh://git@localhost/owner/repo.git#local_path');
    assert.ok(url0.equalsIgnoreTransport(url1));
  });

  it('equalsIgnoreTransport (same)', () => {
    const url0 = new GitUrl('https://localhost/owner/repo.git#local_path');
    assert.ok(url0.equalsIgnoreTransport(url0));
  });

  it('not equalsIgnoreTransport', () => {
    const url0 = new GitUrl('https://localhost/owner/repo.git#master');
    const url1 = new GitUrl('https://localhost/owner/repo.git#dev');
    assert.ok(!url0.equalsIgnoreTransport(url1));
  });

  it('not equalsIgnoreTransport to undefined', () => {
    const url0 = new GitUrl('https://localhost/owner/repo.git#master');
    assert.ok(!url0.equalsIgnoreTransport());
  });

  it('to minimal json', () => {
    const url = new GitUrl({
      owner: 'company',
      repo: 'repository',
    });
    assert.deepEqual(url.toJSON({ minimal: true }), {
      owner: 'company',
      repo: 'repository',
    });
  });

  it('to minimal json with ref', () => {
    const url = new GitUrl({
      owner: 'company',
      repo: 'repository',
      ref: 'master',
    });
    assert.deepEqual(url.toJSON({ minimal: true }), {
      owner: 'company',
      repo: 'repository',
      ref: 'master',
    });
  });

  it('to json with keepFormat from object', () => {
    const url = new GitUrl({
      owner: 'company',
      repo: 'repository',
      ref: 'master',
    });
    assert.deepEqual(url.toJSON({ keepFormat: true }), {
      host: 'github.com',
      hostname: 'github.com',
      owner: 'company',
      path: '',
      port: '',
      protocol: 'https',
      ref: 'master',
      repo: 'repository',
    });
  });

  it('to json with keepFormat from string', () => {
    const url = new GitUrl('http://git.example.com:1234/company/repository.git/docs/main');
    assert.deepEqual(url.toJSON({ keepFormat: true }), 'http://git.example.com:1234/company/repository.git/docs/main');
  });

  it('to yaml node from string', () => {
    const doc = new YAML.Document();
    const url = new GitUrl('http://git.example.com:1234/company/repository.git/docs/main');
    assert.deepEqual(url.toYAMLNode(doc).value, 'http://git.example.com:1234/company/repository.git/docs/main');
  });

  it('to yaml node from object', () => {
    const doc = new YAML.Document();
    const url = new GitUrl({
      owner: 'company',
      repo: 'repository',
      ref: 'master',
    });
    assert.deepEqual(url.toYAMLNode(doc).toJSON(), {
      owner: 'company',
      ref: 'master',
      repo: 'repository',
    });
  });

  it('to yaml node from string (forced)', () => {
    const doc = new YAML.Document();
    const url = new GitUrl('http://git.example.com:1234/company/repository.git/docs/main');
    assert.deepEqual(url.toYAMLNode(doc, true).toJSON(), {
      owner: 'company',
      path: '/docs/main',
      repo: 'repository',
    });
  });
});
