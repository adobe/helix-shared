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

describe('Helix Config', () => {
  it('loads an empty config', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'empty.yaml'))
      .init();

    const expected = JSON.parse(await fs.readFile(path.resolve(SPEC_ROOT, 'empty.json'), 'utf-8'));
    const actual = cfg.toJSON();
    assert.deepEqual(actual, expected);
  });

  it('loads an full config', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'full.yaml'))
      .init();

    const expected = JSON.parse(await fs.readFile(path.resolve(SPEC_ROOT, 'full.json'), 'utf-8'));
    const actual = cfg.toJSON();
    assert.deepEqual(actual, expected);
  });

  it('can serialize strains as json', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'full.yaml'))
      .init();

    const expected = JSON.parse(await fs.readFile(path.resolve(SPEC_ROOT, 'full.json'), 'utf-8')).strains;
    const actual = JSON.parse(JSON.stringify(cfg.strains, null, '  '));
    assert.deepEqual(actual, expected);
  });
});
