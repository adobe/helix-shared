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
const yaml = require('yaml');
const path = require('path');
const fs = require('fs-extra');
const ConfigValidator = require('../src/ConfigValidator.js');

async function validate(filename) {
  const file = await fs.readFile(path.resolve(__dirname, 'specs', 'configs', filename), 'utf-8');
  const json = yaml.parse(file, {
    merge: true,
  });
  new ConfigValidator().assetValid(json);
}

async function assertValid(filename) {
  await validate(filename);
}

async function assertInvalid(filename) {
  try {
    await validate(filename);
    assert.fail(`${filename} should be invalid`);
  } catch (e) {
    // ok
  }
}

describe('Validator Tests', () => {
  [
    'empty.yaml',
    'no-default.yaml',
    'unsupported_version.yaml',
  ].forEach((filename) => {
    it(`${filename} is invalid`, async () => {
      await assertInvalid(filename);
    });
  });

  [
    'valid.yaml',
    'full.yaml',
    'full-map.yaml',
    'proxy.yaml',
    'perf.yaml',
    'perf-map.yaml',
    'clone-tests.yaml',
    'comments-map.yaml',
    'comments.yaml',
    'many-code-repos.yaml',
    'urls.yaml',
    'urls-map.yaml',
    'no-ref.yaml',
  ].forEach((filename) => {
    it(`${filename} is valid`, async () => {
      await assertValid(filename);
    });
  });
});
