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

const assert = require('assert');
const { GitUrl } = require('../src/index.js');

describe('GitUrl from string tests', () => {
  it('Fails for no arguments', () => {
    try {
      // eslint-disable-next-line no-unused-vars
      const url = new GitUrl();
      assert.fail('should fail with no arguments');
    } catch (e) {
      assert.equal(e.message, 'Invalid URL: undefined');
    }
  });

  it('Fails for non git-url arguments', () => {
    try {
      // eslint-disable-next-line no-unused-vars
      const url = new GitUrl('https://github.com/no/git');
      assert.fail('should fail with no arguments');
    } catch (e) {
      assert.equal(e.message, 'Invalid URL: no valid git-url: https://github.com/no/git');
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

  it('Fails for non scp-url arguments', () => {
    try {
      // eslint-disable-next-line no-unused-vars
      const url = new GitUrl('git@github.com/no/git');
      assert.fail('should fail with no arguments');
    } catch (e) {
      assert.equal(e.message, 'Invalid URL: no valid scp url: git@github.com/no/git');
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
    assert.equal(url.raw, 'https://raw.github.com/company/repository/master');
    assert.equal(url.rawRoot, 'https://raw.github.com');
    assert.equal(url.apiRoot, 'https://api.github.com');
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
    const url = new GitUrl({
    },
    {
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
      // eslint-disable-next-line no-unused-vars
      const url = new GitUrl({
        repo: 'repository',
      });
      assert.fail('should fail with no arguments');
    } catch (e) {
      assert.equal(e.message, 'Invalid URL: no owner');
    }
  });

  it('missing required field: repo', () => {
    try {
      // eslint-disable-next-line no-unused-vars
      const url = new GitUrl({
        owner: 'owner',
      });
      assert.fail('should fail with no arguments');
    } catch (e) {
      assert.equal(e.message, 'Invalid URL: no repo');
    }
  });
});
