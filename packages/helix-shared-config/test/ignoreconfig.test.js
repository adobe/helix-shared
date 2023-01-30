/*
 * Copyright 2021 Adobe. All rights reserved.
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

import assert from 'assert';
import fs from 'fs-extra';
import path from 'path';
import { IgnoreConfig } from '../src/index.js';

const SPEC_ROOT = path.resolve(__testdir, 'specs/hlxignore');

function shouldIgnore(cfg, paths) {
  paths.forEach((s) => assert.ok(cfg.ignores(s), `'${s}' not ignored, but it should be.`));
}
function shouldNotIgnore(cfg, paths) {
  paths.forEach((s) => assert.ok(!cfg.ignores(s), `'${s}' ignored, but it shouldn't be.`));
}

describe('IgnoreConfig', () => {
  it('typical', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'typical'), 'utf-8');
    const cfg = await new IgnoreConfig()
      .withSource(source)
      .init();

    assert.ok(cfg);

    shouldIgnore(cfg, [
      'dist/',
      'dist/index.js',
      'node_modules/module',
      'node_modules/module/',
      'node_modules/.bin/foo',
      'node_modules/.bin/foo/',
      'code.bu.js',
      'style.bu.css',
      'build/index-chunk.js',
      'packages/foo/build/index.js',
      '.eslintrc.js',
      '.hlxignore',
      '.gitignore',
      '.tools/stuff',
      'config.json',
    ]);

    shouldNotIgnore(cfg, [
      'src/',
      'src/index.js',
      'public/',
      'public/icons/foo.svg',
      'packages/foo/stuff.js',
      'tools/sidekick/config.json',
    ]);
  });

  it('negated/inverted', async () => {
    const source = await fs.readFile(path.resolve(SPEC_ROOT, 'negated'), 'utf-8');
    const cfg = await new IgnoreConfig()
      .withSource(source)
      .init();

    assert.ok(cfg);

    shouldIgnore(cfg, [
      'node_modules',
      'src/',
      'src/index.js',
      'packages/foo/index.js',
      'src/index.js',
    ]);

    shouldNotIgnore(cfg, [
      'dist/index.js',
      'build/index.js',
      'public/',
      'public/asset.png',
      'public/icons/foo.svg',
    ]);
  });
});
