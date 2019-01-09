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
const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs-extra');
const validate = require('../src/validate');

function validyaml(file) {
  return validate(yaml.load(fs.readFileSync(path.resolve(__dirname, 'specs', 'configs', file))))
}

function assertvalid(file) {
  assert.ok(validyaml(file));
}

function assertinvalid(file) {
  try {
    const valid = validyaml(file);
    assert.equal(valid, false, `${file} should be invalid`);
  } catch (e) {
    if (e.code && e.code==='ERR_ASSERTION') {
      throw e;
    }
  }
}

describe('Validator Tests', () => {
  ['empty.yaml', 'no-default.yaml'].forEach(i => {
    it(`${i} is invalid`, () => {
      assertinvalid(i);
    });
  });

  ['valid.yaml'].forEach(i => {
    it(`${i} is valid`, () => {
      assertvalid(i);
    });
  });


});