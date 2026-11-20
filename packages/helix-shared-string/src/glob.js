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

/**
 * Maximum number of wildcards allowed in a glob. Every wildcard is an unbounded quantifier in
 * the resulting regexp, so the worst-case matching cost grows with `pathLength ^ wildcards`.
 * Limiting to 2 keeps matching quadratic in the worst case.
 * @type {number}
 */
export const MAX_GLOB_WILDCARDS = 2;

const TOKEN_REGEXPS = {
  '*': '[^/]*',
  '**': '.*',
  '(/*)?': '(?:/[^/]*)?',
  '(/**)?': '(?:/.*)?',
};

const TOKENIZER = /\(\/\*\*?\)\?|\*\*|\*/g;

function escape(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

function normalize(glob) {
  return glob
    // `***` → `**`
    .replace(/\*{3,}/g, '**')
    // common typo `(/**?)` → `(/**)?`
    .replaceAll('(/**?)', '(/**)?')
    // `/**` followed by whole-segment `/**` or `/*` → `/**`
    .replace(/\/\*\*(?:\/\*\*?(?=\/|$))+/g, '/**')
    // `(/**)?(/**)?` → `(/**)?`
    .replace(/(?:\(\/\*\*\)\?){2,}/g, '(/**)?');
}

/**
 * Converts a glob to a regular expression. Supported syntax:
 *
 * - `*` matches any characters except `/` (within a path segment)
 * - `**` matches any characters, including `/`
 * - `(/*)?` matches nothing or a single child segment (e.g. `/en(/*)?` matches `/en` and `/en/a`)
 * - `(/**)?` matches nothing or any descendants (e.g. `/en(/**)?` matches `/en` and `/en/a/b`)
 * - all other characters match literally
 *
 * Whole-segment wildcards (`/*` or `/**`) directly following a `/**` are collapsed into it.
 * Globs with more than {@link MAX_GLOB_WILDCARDS} wildcards are rejected.
 *
 * @param {string} glob the glob
 * @returns {RegExp|null} the regular expression or `null` if the glob is invalid
 */
export function globToRegExp(glob) {
  if (typeof glob !== 'string' || !glob) {
    return null;
  }
  const normalized = normalize(glob);
  let re = '';
  let last = 0;
  let count = 0;
  for (const match of normalized.matchAll(TOKENIZER)) {
    count += 1;
    if (count > MAX_GLOB_WILDCARDS) {
      return null;
    }
    re += escape(normalized.substring(last, match.index)) + TOKEN_REGEXPS[match[0]];
    last = match.index + match[0].length;
  }
  re += escape(normalized.substring(last));
  return new RegExp(`^${re}$`);
}

/**
 * Checks if the given glob is valid, i.e. can be converted to a regular expression.
 * @param {string} glob the glob
 * @returns {boolean} {@code true} if the glob is valid
 */
export function isValidGlobRule(glob) {
  return globToRegExp(glob) !== null;
}

/**
 * Checks if the given path matches the glob. Invalid globs never match.
 * Note that the glob is compiled on every invocation; use {@link globToRegExp} and reuse the
 * regular expression when matching many paths.
 *
 * @param {string} path the path to match
 * @param {string} glob the glob
 * @returns {boolean} {@code true} if the path matches
 */
export function matchesGlob(path, glob) {
  const re = globToRegExp(glob);
  return re !== null && re.test(path);
}
