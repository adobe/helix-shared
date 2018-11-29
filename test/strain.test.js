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

const { HelixConfig } = require('../src/index.js');

const SPEC_ROOT = path.resolve(__dirname, 'specs/configs');

describe('Strain Config', () => {
  it('get/set code', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'full.yaml'))
      .init();
    assert.ok(cfg.strains);
    assert.ok(cfg.strains.get('default'));
    assert.notEqual(cfg.strains.get('default').code, 'foo');
    assert.ok(cfg.strains.get('default').code = 'foo');
    assert.equal(cfg.strains.get('default').code, 'foo');
  });

  it('get/set content', async () => {
    const cfg = await new HelixConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'full.yaml'))
      .init();
    assert.ok(cfg.strains);
    assert.ok(cfg.strains.get('default'));
    assert.notEqual(cfg.strains.get('default').content, 'foo');
    assert.ok(cfg.strains.get('default').content = 'foo');
    assert.equal(cfg.strains.get('default').content, 'foo');
  });
});
