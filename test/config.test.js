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
const fs = require('fs-extra');
const path = require('path');
const { HelixConfig } = require('../src/index.js');
const Strain = require('../src/Strain.js');
const GitUrl = require('../src/GitUrl.js');

const SPEC_ROOT = path.resolve(__dirname, 'specs/configs');

const tests = [
  {
    title: 'fails with an empty config',
    config: 'empty.yaml',
    result: null,
    error: `Error: Invalid configuration:


A list of strains and a strains with the name "default" is required.`,
  },
  {
    title: 'fails with no default strain',
    config: 'no-default.yaml',
    result: null,
    error: `Error: Invalid configuration:


A list of strains and a strains with the name "default" is required.`,
  },
  {
    title: 'loads a full config',
    config: 'full.yaml',
    result: 'full.json',
  },
  {
    title: 'loads a full config (map style)',
    config: 'full-map.yaml',
    result: 'full.json',
  },
  {
    title: 'fails if config contains tabs',
    config: 'config_with_tabs.yaml',
    result: null,
    error: 'Error: Tabs not allowed in helix-config.yaml',
  },
  {
    title: 'loads config with urls',
    config: 'urls.yaml',
    result: 'urls.json',
  },
  {
    title: 'loads config with urls (map style)',
    config: 'urls-map.yaml',
    result: 'urls.json',
  },
  {
    title: 'loads config with performance',
    config: 'perf.yaml',
    result: 'perf.json',
  },
  {
    title: 'loads config with performance (map style)',
    config: 'perf-map.yaml',
    result: 'perf.json',
  },
  {
    title: 'loads config with comments',
    config: 'comments.yaml',
    result: 'comments.json',
  },
  {
    title: 'loads config with comments (map style)',
    config: 'comments-map.yaml',
    result: 'comments.json',
  },
];

describe('Helix Config Loading', () => {
  tests.forEach((test) => {
    it(test.title, async () => {
      try {
        const cfg = await new HelixConfig()
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

  it('loads from string source', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'full.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withSource(source)
      .init();
    assert.equal(cfg.source, source);
    assert.equal(cfg.version, 1);
  });

  it('loads from string source and reports correct path', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'full.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withDirectory(SPEC_ROOT)
      .withSource(source)
      .init();
    assert.equal(cfg.configPath, path.resolve(SPEC_ROOT, 'helix-config.yaml'));
  });

  it('can be constructed with JSON object', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'full.yaml'), 'utf-8');
    const cfg1 = await new HelixConfig()
      .withSource(source)
      .init();
    const cfg2 = await new HelixConfig()
      .withJSON(cfg1.toJSON())
      .init();
    assert.deepEqual(cfg1.toJSON(), cfg2.toJSON());
  });
});

describe('Helix Config Serializing', () => {
  it('can serialize strains as json', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'full.yaml'))
      .init();

    const expected = JSON.parse(await fs.readFile(path.resolve(SPEC_ROOT, 'full.json'), 'utf-8')).strains;
    const actual = JSON.parse(JSON.stringify(cfg.strains, null, '  '));
    assert.deepEqual(actual, expected);
  });

  it('can serialize back to yaml', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'full.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withSource(source)
      .init();

    const actual = cfg.toYAML();
    assert.equal(actual, source);
  });

  it('can save config', async () => {
    const testDir = path.resolve(__dirname, 'tmp', `test${Math.random()}`);
    await fs.ensureDir(testDir);
    const testCfg = path.resolve(testDir, 'helix-config.yaml');
    await fs.copy(path.resolve(SPEC_ROOT, 'minimal.yaml'), testCfg);
    const cfg = await new HelixConfig()
      .withDirectory(testDir)
      .init();

    cfg.strains.get('default').package = 'bfbde5fbfbde5fbfbde5f';
    await cfg.saveConfig();

    const actual = await fs.readFile(testCfg, 'utf-8');
    const expected = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-package.yaml'), 'utf-8');

    assert.equal(actual, expected);
  });

  it('can serialize back a new strain', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withSource(source)
      .init();

    cfg.strains.add(new Strain({
      name: 'foo',
      code: {
        owner: 'adobe',
        repo: 'helix-shared',
        ref: 'master',
      },
      content: 'https://github.com/adobe/helix-shared.git#master',
      static: 'https://github.com/adobe/helix-shared.git#master',
    }));
    const actual = cfg.toYAML();
    const expected = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-foo.yaml'), 'utf-8');
    assert.equal(actual, expected);
  });

  it('can serialize back a new strain with static', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withSource(source)
      .init();

    cfg.strains.add(new Strain({
      name: 'foo',
      code: {
        owner: 'adobe',
        repo: 'helix-shared',
        ref: 'master',
      },
      content: 'https://github.com/adobe/helix-shared.git#master',
      static: {
        owner: 'adobe',
        repo: 'helix-shared',
        ref: 'master',
        magic: true,
      },
    }));
    const actual = cfg.toYAML();
    const expected = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-foo-static.yaml'), 'utf-8');
    assert.equal(actual, expected);
  });

  it('can serialize back a modified strain with modified package', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withSource(source)
      .init();

    cfg.strains.get('default').package = 'bfbde5fbfbde5fbfbde5f';
    const actual = cfg.toYAML();
    const expected = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-package.yaml'), 'utf-8');
    assert.equal(actual, expected);
  });

  it('can serialize back a modified strain with modified package (with refs)', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-with-refs.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withSource(source)
      .init();

    cfg.strains.get('default').package = 'bfbde5fbfbde5fbfbde5f';
    const actual = cfg.toYAML();
    const expected = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-with-refs-package.yaml'), 'utf-8');
    assert.equal(actual, expected);
  });

  it('can serialize back a modified strain with duplicated strain)', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-local.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withSource(source)
      .init();

    const url = new GitUrl('ssh://git@github.com/adobe/project-helix.io.git#master');
    const strain = cfg.strains.get('default').clone();
    strain.name = 'foo';
    cfg.strains.add(strain);
    strain.code = url;
    strain.content = url;
    strain.static.url = url;
    strain.package = 'bfbde5fbfbde5fbfbde5f';
    const actual = cfg.toYAML();
    const expected = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-local-foo.yaml'), 'utf-8');
    assert.equal(actual, expected);
  });

  it('can serialize back a modified strain with modified package2 (with refs)', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-with-refs-package.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withSource(source)
      .init();

    cfg.strains.get('default').package = 'bfbde5fbfbde5fbfbde5f-dirty';
    const actual = cfg.toYAML();
    const expected = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-with-refs-package2.yaml'), 'utf-8');
    assert.equal(actual, expected);
  });

  it('can serialize back a modified strain with removed package (with refs)', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-with-refs-package.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withSource(source)
      .init();

    cfg.strains.get('default').package = null;
    const actual = cfg.toYAML();
    const expected = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-with-refs-no-package.yaml'), 'utf-8');
    assert.equal(actual, expected);
  });

  it('can serialize back a modified strain with modified directoryIndex', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withSource(source)
      .init();

    cfg.strains.get('default').directoryIndex = 'readme.html';
    const actual = cfg.toYAML();
    const expected = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-directory.yaml'), 'utf-8');
    assert.equal(actual, expected);
  });

  it('can serialize back a modified merge strain', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-clone-code.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withSource(source)
      .init();

    cfg.strains.get('clone').package = 'bfbde5fbfbde5fbfbde5f';
    const actual = cfg.toYAML();
    const expected = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-clone-code-package.yaml'), 'utf-8');
    assert.equal(actual, expected);
  });

  it.skip('can serialize back a cloned strain with modified code url', async () => {
    // todo: would be nice!
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal.yaml'), 'utf-8');
    const cfg = await new HelixConfig()
      .withSource(source)
      .init();

    const clone = cfg.strains.get('default').clone();
    clone.code = new GitUrl('https://github.com/adobe/helix-test.git#master');
    cfg.strains.add(clone);
    const actual = cfg.toYAML();
    const expected = await fs.readFile(path.resolve(SPEC_ROOT, 'minimal-clone-code.yaml'), 'utf-8');
    assert.equal(actual, expected);
  });
});
