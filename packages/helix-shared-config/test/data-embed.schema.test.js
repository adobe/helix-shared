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

const assert = require('assert');
const DataEmbedValidator = require('../src/DataEmbedValidator.js');

describe('Data Embed Schema', () => {
  it('Rejects empty response', () => {
    const vali = new DataEmbedValidator();

    try {
      vali.assertValid();
      assert.fail('This should throw');
    } catch (e) {
      assert.notEqual(e.message, 'This should throw');
    }
  });

  it('Accepts empty single sheet response', () => {
    const vali = new DataEmbedValidator();
    vali.assertValid({
      version: 3,
      type: 'sheet',
      data: [],
      limit: 0,
      offset: 0,
      total: 0,
    });
  });

  it('Accepts empty multi sheet response', () => {
    const vali = new DataEmbedValidator();
    vali.assertValid({
      version: 3,
      type: 'multi-sheet',
      names: ['one'],
      one: {
        data: [],
        limit: 0,
        offset: 0,
        total: 0,
      },
    });
  });

  it('Rejects missing version (multi)', () => {
    const vali = new DataEmbedValidator();

    try {
      vali.assertValid({
        type: 'multi-sheet',
        names: ['one'],
        one: {
          data: [],
          limit: 0,
          offset: 0,
          total: 0,
        },
      });
      assert.fail('This should throw');
    } catch (e) {
      assert.notEqual(e.message, 'This should throw');
    }
  });

  it('Rejects missing version (single)', () => {
    const vali = new DataEmbedValidator();

    try {
      vali.assertValid({
        type: 'sheet',
        data: [],
        limit: 0,
        offset: 0,
        total: 0,
      });
      assert.fail('This should throw');
    } catch (e) {
      assert.notEqual(e.message, 'This should throw');
    }
  });

  it('Rejects invalid type', () => {
    const vali = new DataEmbedValidator();

    try {
      vali.assertValid({
        version: 3,
        type: 'beet',
        data: [],
        limit: 0,
        offset: 0,
        total: 0,
      });
      assert.fail('This should throw');
    } catch (e) {
      assert.notEqual(e.message, 'This should throw');
    }
  });
});
