/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import assert from 'assert';
import {
  globToRegExp,
  isValidGlobRule,
  matchesGlob,
} from '../src/string.js';

const TESTS = [
  // [glob, matching paths, non-matching paths]
  ['/foo', ['/foo'], ['/foo/', '/foobar']],
  ['/foo.html', ['/foo.html'], ['/fooXhtml']],
  ['/a+b?(c)[d]{1}|^$\\', ['/a+b?(c)[d]{1}|^$\\'], ['/aab', '/a']],
  ['/en/*', ['/en/', '/en/a'], ['/en', '/en/a/b']],
  ['/en/**', ['/en/', '/en/a', '/en/a/b'], ['/en', '/english']],
  ['/ru**', ['/ru', '/rules', '/ru/a/b'], ['/r']],
  ['**/a', ['/a', '/de/a', '/de/fr/a'], ['/a/b', '/ba']],
  ['**/blog/**', ['/blog/a', '/de/blog/a/b'], ['/blog', '/blogs/a']],
  ['/drafts/**/hcp/**', ['/drafts/x/hcp/y', '/drafts/x/y/hcp/z'], ['/drafts/hcp/y']],
  ['/*-*', ['/a-b', '/-'], ['/ab', '/a/-b']],
  ['/product/*/**', ['/product/a/b', '/product/a/b/c'], ['/product/a']],
  ['/en(/**)?', ['/en', '/en/', '/en/a', '/en/a/b'], ['/english', '/e']],
  ['/en(/*)?', ['/en', '/en/', '/en/a'], ['/en/a/b', '/english']],
  ['(/**)?/a', ['/a', '/de/a'], ['/a/b', '/ba']],
  ['(/**?)/a', ['/a', '/de/a'], ['/a/b']],
  ['(/**)?/a(/**)?', ['/a', '/de/a', '/a/b', '/de/a/b'], ['/ab', '/de/ab']],
  ['/foo/**/**', ['/foo/a', '/foo/a/b'], ['/foo']],
  ['/foo/**/*', ['/foo/a', '/foo/a/b'], ['/foo']],
  ['/foo/**/*/**', ['/foo/a', '/foo/a/b'], ['/foo']],
  ['/foo/**/*.html', ['/foo/a/b.html', '/foo/a/b/c.html'], ['/foo/b.html', '/foo/a/b']],
  ['/foo/***', ['/foo/a/b'], ['/foo']],
  ['/foo(/**)?(/**)?', ['/foo', '/foo/a/b'], ['/foobar']],
];

describe('Glob Tests', () => {
  for (const [glob, matches, nonMatches] of TESTS) {
    it(`glob '${glob}' matches correctly`, () => {
      for (const path of matches) {
        assert.strictEqual(matchesGlob(path, glob), true, `expected '${glob}' to match '${path}'`);
      }
      for (const path of nonMatches) {
        assert.strictEqual(matchesGlob(path, glob), false, `expected '${glob}' not to match '${path}'`);
      }
    });
  }

  it('collapses /** followed by whole-segment wildcards', () => {
    assert.strictEqual(globToRegExp('/foo/**/*/**').source, globToRegExp('/foo/**').source);
    assert.strictEqual(globToRegExp('**/learning-centre/**/**').source, globToRegExp('**/learning-centre/**').source);
    assert.notStrictEqual(globToRegExp('/foo/*/**').source, globToRegExp('/foo/**').source);
  });

  it('rejects invalid globs', () => {
    for (const glob of ['', null, undefined, 42, '/*a*a*b', '**/a/*/**', '/a/**/b/**/c/**', '(/**)?/a/*(/**)?']) {
      assert.strictEqual(globToRegExp(glob), null, `expected '${glob}' to be invalid`);
      assert.strictEqual(isValidGlobRule(glob), false);
      assert.strictEqual(matchesGlob('/a', glob), false);
    }
  });

  it('accepts valid globs', () => {
    for (const glob of ['/foo', '/foo/**', '**/foo/**', '(/**)?/a(/**)?', '/foo/**/**/**']) {
      assert.strictEqual(isValidGlobRule(glob), true, `expected '${glob}' to be valid`);
    }
  });

  it('matches the worst case quickly', () => {
    const path = `/${'a'.repeat(4096)}`;
    const t0 = Date.now();
    assert.strictEqual(matchesGlob(path, '/**a**b'), false);
    assert.strictEqual(matchesGlob(path, '/*a*b'), false);
    assert.ok(Date.now() - t0 < 500);
  });
});
