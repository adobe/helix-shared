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

/* eslint-env mocha */

const assert = require('assert');
const path = require('path');
const GitUrl = require('../src/GitUrl.js');
const Condition = require('../src/Condition.js');
const { HelixConfig, Strain } = require('../src/index.js');

const SPEC_ROOT = path.resolve(__dirname, 'specs/configs');

describe('Strains test', () => {
  it('finds strains match default code repository', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'many-code-repos.yaml'))
      .init();
    const strains = cfg.strains.filterByCode(new GitUrl('https://github.com/adobe/project-helix.io.git#master'));
    assert.deepEqual(strains.map((s) => s.name), ['default']);
  });

  it('finds strains match dev repository', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'many-code-repos.yaml'))
      .init();
    const strains = cfg.strains.filterByCode(new GitUrl('https://github.com/adobe/project-helix.io.git#dev'));
    assert.deepEqual(strains.map((s) => s.name), ['dev', 'dev2']);
  });

  it('finds no strains match foo repository', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'many-code-repos.yaml'))
      .init();
    const strains = cfg.strains.filterByCode(new GitUrl('https://github.com/adobe/foo.git#master'));
    assert.equal(strains.length, 0);
  });

  it('finds one proxy strain', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'many-code-repos.yaml'))
      .init();
    const strains = cfg.strains.getProxyStrains();
    assert.equal(strains.length, 1);
  });

  it('finds some runtime strains', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'many-code-repos.yaml'))
      .init();
    const strains = cfg.strains.getRuntimeStrains();
    assert.equal(strains.length, 4);
  });

  it('get a strain', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'many-code-repos.yaml'))
      .init();
    assert.equal(cfg.strains.get('default').name, 'default');
  });

  it('has a strain', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'many-code-repos.yaml'))
      .init();
    assert.equal(cfg.strains.has('default'), true);
  });

  it('size of strains', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'many-code-repos.yaml'))
      .init();
    assert.equal(cfg.strains.size, 5);
  });

  it('forEach of strains', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'many-code-repos.yaml'))
      .init();
    const names = [];
    cfg.strains.forEach((s) => names.push(s.name));
    assert.deepEqual(names, ['default', 'dev', 'dev2', 'stage', 'proxy']);
  });

  it('clone single strain', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'clone-tests.yaml'))
      .init();
    const copy = cfg.strains.get('default').clone();
    assert.deepEqual(copy.toYAML(), ''
      + 'name: default\n'
      + 'code: https://github.com/adobe/project-helix.io.git#master\n'
      + 'content:\n'
      + '  protocol: https\n'
      + '  host: github.com\n'
      + '  hostname: github.com\n'
      + '  owner: adobe\n'
      + '  repo: helix-cli\n'
      + '  ref: master\n'
      + 'static: https://github.com/adobe/project-helix.io.git/htdocs#dev\n'
      + 'condition:\n'
      + '  url.hostname=: client.project-helix.io\n'
      + 'directoryIndex: readme.html\n');

    const fooCopy = cfg.strains.get('foo').clone();
    assert.deepEqual(fooCopy.toYAML(), ''
      + 'name: foo\n'
      + 'code:\n'
      + '  protocol: https\n'
      + '  host: github.com\n'
      + '  hostname: github.com\n'
      + '  owner: adobe\n'
      + '  repo: project-helix.io\n'
      + '  ref: master\n'
      + 'content:\n'
      + '  protocol: https\n'
      + '  host: github.com\n'
      + '  hostname: github.com\n'
      + '  owner: adobe\n'
      + '  repo: project-helix.io\n'
      + '  ref: master\n'
      + 'static:\n'
      + '  protocol: https\n'
      + '  host: github.com\n'
      + '  hostname: github.com\n'
      + '  owner: adobe\n'
      + '  repo: project-helix.io\n'
      + '  ref: master\n'
      + '  path: /htdocs\n');
  });

  it('urls can be set', () => {
    const strain = new Strain({
      name: 'test',
      code: 'https://github.com/adobe/project-helix.io.git',
      content: 'https://github.com/adobe/project-helix.io.git',
      static: 'https://github.com/adobe/project-helix.io.git',
    });

    strain.urls = 'https://www.project-helix.io/';
    assert.deepEqual(strain.urls, ['https://www.project-helix.io/']);
  });

  it('urls are normalized', () => {
    const strain = new Strain({
      name: 'test',
      code: 'https://github.com/adobe/project-helix.io.git',
      content: 'https://github.com/adobe/project-helix.io.git',
      static: 'https://github.com/adobe/project-helix.io.git',
    });

    strain.urls = ['https://www.project-helix.io/', 'https://www.project-helix.io:443/', 'https://www.project-helix.io'];
    assert.deepEqual(strain.urls, ['https://www.project-helix.io/']);
  });

  it('static can be read', () => {
    const strain = new Strain({
      name: 'test',
      code: 'https://github.com/adobe/project-helix.io.git',
      content: 'https://github.com/adobe/project-helix.io.git',
      static: 'https://github.com/adobe/project-helix.io.git',
    });

    assert.deepEqual(strain.static.path, strain.static.url.path);
    assert.deepEqual(strain.static.owner, strain.static.url.owner);
    assert.deepEqual(strain.static.repo, strain.static.url.repo);
    assert.deepEqual(strain.static.ref, strain.static.url.ref);
  });

  it('redirects can be read', () => {
    const strain = new Strain({
      name: 'test',
      code: 'https://github.com/adobe/project-helix.io.git',
      content: 'https://github.com/adobe/project-helix.io.git',
      static: 'https://github.com/adobe/project-helix.io.git',
      redirects: [
        {
          from: '/foo',
          to: '/bar',
        },
        {
          from: '/baz',
          to: '/qwe',
        },
      ],
    });

    assert.ok(Array.isArray(strain.redirects));
    assert.equal(strain.redirects.length, 2);
  });

  it('urls can be changed after initialization', () => {
    const gitUrl = 'https://github.com/adobe/helix-shared.git#master';
    const newGitUrl = new GitUrl('https://github.com/adobe/project-helix.io.git#dev');
    const newStaticUrl = 'https://github.com/adobe/project-helix.io.git/htdocs#dev';
    const strain = new Strain({
      name: 'test',
      code: gitUrl,
      content: gitUrl,
      static: gitUrl,
    });
    strain.toYAML(); // build internal _yamlNode with initial urls (see #49)
    strain.code = newGitUrl;
    strain.content = newGitUrl;
    strain.static.url = newGitUrl;
    const yaml = strain.toYAML();
    assert.deepEqual(yaml, 'name: test\n'
    + `code: ${newGitUrl}\n`
    + `content: ${newGitUrl}\n`
    + `static: ${newStaticUrl}\n`);
  });

  it('strains can be mutated', () => {
    const strain = new Strain({
      name: 'test',
      code: 'https://github.com/adobe/project-helix.io.git',
      content: 'https://github.com/adobe/project-helix.io.git',
      static: 'https://github.com/adobe/project-helix.io.git',
    });

    const giturl = strain.content;

    assert.deepEqual(strain.name, 'test');
    assert.deepEqual(strain.content, giturl);
    assert.deepEqual(strain.code, giturl);
    assert.deepEqual(strain.package, '');
    assert.equal(strain.condition, null);

    strain.name = 'dirty';
    strain.content = 'https://github.com/adobe/project-helix.io.git#develop';
    strain.code = 'https://github.com/adobe/project-helix.io.git#develop';
    strain.package = 'dirty';
    strain.condition = new Condition('req.http.X-Dirty == "true"');

    assert.notDeepEqual(strain.name, 'test');
    assert.notDeepEqual(strain.content, giturl);
    assert.notDeepEqual(strain.code, giturl);
    assert.notDeepEqual(strain.package, '');
    assert.notEqual(strain.condition, null);
  });

  it('proxy static can be read', () => {
    const strain = new Strain({
      name: 'test',
      origin: 'https://www.adobe.io',
    });

    assert.deepEqual(strain.toJSON({ minimal: true }), {
      name: 'test',
      condition: '',
      origin: {
        address: 'www.adobe.io',
        between_bytes_timeout: 10000,
        connect_timeout: 1000,
        first_byte_timeout: 15000,
        hostname: 'www.adobe.io',
        max_conn: 200,
        name: 'Proxywwwadobeio3a0a',
        port: 443,
        shield: 'bwi-va-us',
        ssl_cert_hostname: 'www.adobe.io',
        use_ssl: true,
        weight: 100,
      },
      perf: null,
      sticky: false,
      urls: [],
    });
  });

  it('strain.toJSON() minimizes json', () => {
    const strain = new Strain({
      name: 'test',
      code: 'https://github.com/adobe/project-helix.io.git',
      content: 'https://github.com/adobe/project-helix.io.git',
      static: 'https://github.com/adobe/project-helix.io.git',
    });

    assert.deepEqual(strain.toJSON({ minimal: true }), {
      name: 'test',
      code: {
        owner: 'adobe',
        repo: 'project-helix.io',
        ref: 'master',
      },
      content: {
        owner: 'adobe',
        repo: 'project-helix.io',
        ref: 'master',
      },
      directoryIndex: 'index.html',
      static: {
        owner: 'adobe',
        path: '/htdocs',
        repo: 'project-helix.io',
        ref: 'master',
      },
    });
  });

  it('strain.toJSON() keeps format json', () => {
    const strain = new Strain({
      name: 'test',
      code: 'https://github.com/adobe/project-helix.io.git',
      content: 'https://github.com/adobe/project-helix.io.git',
      static: 'https://github.com/adobe/project-helix.io.git',
    });

    assert.deepEqual(strain.toJSON({ keepFormat: true, minimal: true }), {
      name: 'test',
      code: 'https://github.com/adobe/project-helix.io.git#master',
      content: 'https://github.com/adobe/project-helix.io.git#master',
      directoryIndex: 'index.html',
      static: 'https://github.com/adobe/project-helix.io.git/htdocs#master',
    });
  });

  it('Simple strain outputs expected yaml', () => {
    const strain = new Strain({
      name: 'test',
      code: 'https://github.com/adobe/project-helix.io.git',
      content: 'https://github.com/adobe/project-helix.io.git',
      static: 'https://github.com/adobe/project-helix.io.git',
    });

    assert.deepEqual(strain.toYAML(), ''
      + 'name: test\n'
      + 'code: https://github.com/adobe/project-helix.io.git#master\n'
      + 'content: https://github.com/adobe/project-helix.io.git#master\n'
      + 'static: https://github.com/adobe/project-helix.io.git/htdocs#master\n');
  });

  it('Complex strain outputs expected yaml', () => {
    const strain = new Strain({
      name: 'default',
      code: 'https://github.com/adobe/project-helix.io.git#master',
      content: {
        protocol: 'https',
        host: 'github.com',
        hostname: 'github.com',
        owner: 'adobe',
        repo: 'helix-cli',
        ref: 'master',
      },
      static: 'https://github.com/adobe/project-helix.io.git#dev',
      condition: 'req.http.host == "client.project-helix.io"',
      sticky: false,
    });

    strain.directoryIndex = 'somepage.html';

    assert.deepEqual(strain.toYAML(), ''
      + 'name: default\n'
      + 'code: https://github.com/adobe/project-helix.io.git#master\n'
      + 'content:\n'
      + '  protocol: https\n'
      + '  host: github.com\n'
      + '  hostname: github.com\n'
      + '  owner: adobe\n'
      + '  repo: helix-cli\n'
      + '  ref: master\n'
      + 'static: https://github.com/adobe/project-helix.io.git/htdocs#dev\n'
      + 'condition: req.http.host == "client.project-helix.io"\n'
      + 'directoryIndex: somepage.html\n');
  });
});
