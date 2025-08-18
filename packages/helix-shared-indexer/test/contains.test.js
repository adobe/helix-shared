/*
 * Copyright 2020 Adobe. All rights reserved.
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

'use strict';

import assert from 'assert';
import { contains } from '../src/contains.js';

describe('Include tests', () => {
  it('missing include means unconditionally true', () => {
    const cfg = {};
    assert.equal(contains(cfg, '/path'), true);
  });
  it('empty include means unconditionally false', () => {
    const cfg = { include: [] };
    assert.equal(contains(cfg, '/path'), false);
  });
  it('include containing braces supported', () => {
    const cfg = {
      include: [
        '/ms/posts/{2018..2019}/*.md',
      ],
    };
    assert.equal(contains(cfg, '/ms/posts/2018/test.md'), true);
    assert.equal(contains(cfg, '/ms/posts/2019/test.md'), true);
    assert.equal(contains(cfg, '/ms/posts/2017/test.md'), false);
  });
  it('include containing parenthesis supported', () => {
    const cfg = {
      include: [
        'ms/(de|en|fr)/posts/*.md',
      ],
    };
    assert.equal(contains(cfg, '/ms/en/posts/test.md'), true);
    assert.equal(contains(cfg, '/ms/it/posts/test.md'), false);
  });
  it('include containing all combinations supported', () => {
    const cfg = {
      include: [
        'ms/(de|en|fr)/posts/{2016..2020}/*.(docx|md)',
        '/ms/(de|en|fr)/archive/*.(docx|md)',
      ],
    };
    assert.equal(contains(cfg, '/ms/en/posts/2016/test.md'), true);
    assert.equal(contains(cfg, '/ms/en/posts/2017/test.docx'), true);
    assert.equal(contains(cfg, '/ms/en/posts/2021/test.md'), false);
    assert.equal(contains(cfg, '/ms/de/archive/test.md'), true);
    assert.equal(contains(cfg, '/ms/de/archive/test.docx'), true);
    assert.equal(contains(cfg, '/ms/it/archive/test.md'), false);
  });
});

describe('Exclude tests', () => {
  it('missing exclude means unconditionally true', () => {
    const cfg = {};
    assert.equal(contains(cfg, '/path'), true);
  });
  it('empty exclude means unconditionally false', () => {
    const cfg = { exclude: [] };
    assert.equal(contains(cfg, '/path'), true);
  });
  it('exclude containing braces supported', () => {
    const cfg = {
      exclude: [
        'ms/posts/{2018..2019}/*.md',
      ],
    };
    assert.equal(contains(cfg, '/ms/posts/2018/test.md'), false);
    assert.equal(contains(cfg, '/ms/posts/2019/test.md'), false);
    assert.equal(contains(cfg, '/ms/posts/2017/test.md'), true);
  });
  it('exclude containing parenthesis supported', () => {
    const cfg = {
      exclude: [
        'ms/(de|en|fr)/posts/*.md',
      ],
    };
    assert.equal(contains(cfg, '/ms/en/posts/test.md'), false);
    assert.equal(contains(cfg, '/ms/it/posts/test.md'), true);
  });
  it('exclude containing all combinations supported', () => {
    const cfg = {
      exclude: [
        'ms/(de|en|fr)/posts/{2016..2020}/*.(docx|md)',
        '/ms/(de|en|fr)/archive/*.(docx|md)',
      ],
    };
    assert.equal(contains(cfg, '/ms/en/posts/2016/test.md'), false);
    assert.equal(contains(cfg, '/ms/en/posts/2017/test.docx'), false);
    assert.equal(contains(cfg, '/ms/en/posts/2021/test.md'), true);
    assert.equal(contains(cfg, '/ms/de/archive/test.md'), false);
    assert.equal(contains(cfg, '/ms/de/archive/test.docx'), false);
    assert.equal(contains(cfg, '/ms/it/archive/test.md'), true);
  });
  it('exclude new documents, multi-level asterisk should with leading slash', () => {
    const cfg = {
      exclude: [
        '**/Document.docx',
      ],
    };
    assert.equal(contains(cfg, '/ms/Document.docx'), false);
  });
  it('exclude dot files when **.json is excluded', () => {
    const cfg = {
      exclude: [
        '**.json',
      ],
    };
    assert.equal(contains(cfg, '/.da/config.json'), false);
  });
});
