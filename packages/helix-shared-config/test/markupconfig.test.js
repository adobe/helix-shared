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

const assert = require('assert');
const { AssertionError } = require('assert');
const fs = require('fs-extra');
const path = require('path');
const { MarkupConfig } = require('../src/index.js');

const SPEC_ROOT = path.resolve(__dirname, 'specs/markup');

describe('Markup Config Loading', () => {
  it('loads from string source', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'sample.yaml'), 'utf-8');
    const cfg = await new MarkupConfig()
      .withSource(source)
      .init();
    assert.ok(cfg);
    assert.ok(cfg.markup);
    assert.equal(cfg.markup.length, 3);

    assert.equal(cfg.markup[0].match, 'section.is-gallery image');
    assert.equal(cfg.markup[0].wrap, '.gallery-image');
    assert.equal(cfg.markup[0].type, 'markdown');

    assert.equal(cfg.markup[1].match, 'link[href!="https://"]');
    assert.equal(cfg.markup[1].classnames[0], 'external');

    assert.equal(cfg.markup[2].match, 'section:last-of-type');
    assert.equal(cfg.markup[2].attribute['data-type'], 'footer');
  });

  it('loads feature flags', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'feature-flags.yaml'), 'utf-8');
    const cfg = await new MarkupConfig()
      .withSource(source)
      .init();
    assert.ok(cfg);
    assert.ok(!cfg.markup);
    assert.ok(cfg.features);
    assert.equal(cfg.features.length, 2);

    assert.equal(cfg.features[0], 'foo-bar');
    assert.ok(cfg.features.includes('baz'));
  });

  it('rejects tabs', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'very-invalid.yaml'), 'utf-8');
    try {
      await new MarkupConfig()
        .withSource(source)
        .init();
      assert.fail('Must throw');
    } catch (e) {
      if (e instanceof AssertionError) {
        throw e;
      }
      assert.equal(e.message, 'Tabs not allowed in YAML');
    }
  });

  it('rejects invalid stuff', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'invalid.yaml'), 'utf-8');
    try {
      await new MarkupConfig()
        .withSource(source)
        .init();
      assert.fail('Must throw');
    } catch (e) {
      if (e instanceof AssertionError) {
        throw e;
      }
      assert.equal(e.message, 'data/markup/images-in-gallery must have required property \'match\', data/markup/last-section must NOT have additional properties');
    }
  });
});
