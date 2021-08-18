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
const BaseParser = require('../src/parsers/BaseParser');
const GlobfileParser = require('../src/parsers/GlobfileParser');

function stubs() {
  return {
    globs: {
      valid: `\
foo
bux
#bun
\\#fud`,
      negated: `\
*
!src
src/*
!src/*
src/nest/*
!src/nest/*.*`,
      nonsense: '😀 😃 😄 😁 😆 😅 😂 🤣 🥲',
    },
  };
}

describe('Parser tests', () => {
  describe('base', () => {
    const name = 'fake';
    let parser;
    beforeEach(() => {
      parser = new BaseParser(name, { outputs: ['foo'] });
    });

    it('abstracts should throw', () => {
      assert.throws(() => parser.parse(), { message: /not implemented/ });
      assert.throws(() => parser.as(), { message: /not implemented/ });
    });

    it('getters', () => {
      assert.strictEqual(parser.source, null);
      assert.strictEqual(parser.parsed, null);
      assert.strictEqual(parser.name, name);
    });

    it('outputs()', () => {
      assert.strictEqual(parser.outputs('foo'), true);
      assert.equal(parser.outputs('bar'), false);
    });
  });

  describe('globfile', () => {
    let parser;
    beforeEach(() => {
      parser = new GlobfileParser();
    });

    function shouldInclude(strs) {
      strs.forEach((s) => assert.ok(parser.includes(s), `'${s}' not included, but it should be.`));
    }
    function shouldExclude(strs) {
      strs.forEach((s) => assert.ok(parser.excludes(s), `'${s}' not excluded, but it should be.`));
    }

    it('as(string) - should return string or null', () => {
      assert.strictEqual(parser.as('string'), null);

      parser.parse('cool!');
      assert.strictEqual(parser.as('string'), 'cool!');
    });

    it('as(invalid) - should throw', () => {
      assert.throws(() => parser.as('foo'), { message: /not implemented/ });
    });

    it('parse(valid)', () => {
      parser.parse(stubs().globs.valid);

      shouldInclude(['foo', 'foo/bar', '#fud']);
      shouldExclude(['buz', 'bun', '#bun']);

      const out = parser.as('string');
      assert.strictEqual(out, stubs().globs.valid);
    });

    it('parse(negated)', () => {
      parser.parse(stubs().globs.negated);

      shouldInclude(['foo', 'foo/bar', 'ding/dong']);
      shouldExclude(['src/file', 'src/nest/file.txt']);

      const out = parser.as('string');
      assert.strictEqual(out, stubs().globs.negated);
    });

    it('parse(nonsense)', () => {
      parser.parse(stubs().globs.nonsense);
      shouldExclude(['foo', 'foo/bar']);

      const out = parser.as('string');
      assert.strictEqual(out, stubs().globs.nonsense);
    });

    it('parse(undef)', () => {
      parser.parse(undefined);
      shouldExclude(['foo', 'foo/bar']);
    });

    it('unhappy paths - should throw', () => {
      // includes() before parse()
      assert.throws(() => parser.includes('foo'), { message: /Must parse/ });

      // includes() with invalid (absolute) path
      parser.parse('cool');
      assert.throws(() => parser.includes('/abs/path/foo'));
    });
  });
});
