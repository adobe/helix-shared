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

const SPEC_ROOT = path.resolve(__dirname, 'specs/configs');

const tests = [
  {
    title: 'fails with an empty config',
    config: 'empty.yaml',
    result: null,
    error: `Error: Invalid configuration:
A set of strains and a default strain are missing.

data should have required property 'strains'`,
  },
  {
    title: 'fails with no default strain',
    config: 'no-default.yaml',
    result: null,
    error: `Error: Invalid configuration:
Proxy Strain no-default has unknown property 'code'
Proxy Strain no-default has unknown property 'content'
Proxy Strain no-default should have required property 'origin'
Runtime Strain no-default should have required property 'static'
Invalid Strain no-default must be either a Runtime Strain or a Proxy Strain
A default strain is missing.

data.strains['no-default'] should NOT have additional properties, data.strains['no-default'] should NOT have additional properties, data.strains['no-default'] should have required property 'origin', data.strains['no-default'] should have required property 'static', data.strains['no-default'] should match exactly one schema in oneOf, data.strains should have required property 'default'`,
  },
  {
    title: 'loads a full config',
    config: 'full.yaml',
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
    title: 'loads config with performance',
    config: 'perf.yaml',
    result: 'perf.json',
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
});
