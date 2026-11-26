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

function tokenize(glob) {
  if (typeof glob !== 'string' || !glob) {
    return null;
  }
  const normalized = normalize(glob);
  const tokens = [];
  let last = 0;
  let count = 0;
  for (const match of normalized.matchAll(TOKENIZER)) {
    count += 1;
    if (count > MAX_GLOB_WILDCARDS) {
      return null;
    }
    if (match.index > last) {
      tokens.push({ type: 'lit', value: normalized.substring(last, match.index) });
    }
    tokens.push({ type: match[0] });
    last = match.index + match[0].length;
  }
  if (last < normalized.length) {
    tokens.push({ type: 'lit', value: normalized.substring(last) });
  }
  return tokens;
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
  const tokens = tokenize(glob);
  if (!tokens) {
    return null;
  }
  const re = tokens
    .map((tok) => (tok.type === 'lit' ? escape(tok.value) : TOKEN_REGEXPS[tok.type]))
    .join('');
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

/**
 * Checks if the glob may match the given folder or a path below it, i.e. if the folder path
 * is a prefix of some path matched by the glob. Invalid globs never match.
 *
 * @param {string} glob the glob
 * @param {string} folderPath folder path, ending with `/`
 * @returns {boolean} {@code true} if a path at or below the folder may match
 */
export function globMayMatchBelow(glob, folderPath) {
  if (typeof folderPath !== 'string' || !folderPath.endsWith('/')) {
    return false;
  }
  const tokens = tokenize(glob);
  if (!tokens) {
    return false;
  }

  const seen = new Set();
  function matchPrefix(ti, pos) {
    if (ti === tokens.length) {
      return false;
    }
    const key = `${ti}:${pos}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);

    const tok = tokens[ti];
    if (tok.type === 'lit') {
      const rem = folderPath.length - pos;
      if (tok.value.length >= rem) {
        return tok.value.startsWith(folderPath.substring(pos));
      }
      if (!folderPath.startsWith(tok.value, pos)) {
        return false;
      }
      return matchPrefix(ti + 1, pos + tok.value.length);
    }
    if (tok.type === '**') {
      return true;
    }
    if (tok.type === '*') {
      const end = folderPath.indexOf('/', pos);
      for (let next = end; next >= pos; next -= 1) {
        if (matchPrefix(ti + 1, next)) {
          return true;
        }
      }
      return false;
    }
    if (tok.type === '(/**)?') {
      return matchPrefix(ti + 1, pos) || folderPath[pos] === '/';
    }
    // '(/*)?'
    if (matchPrefix(ti + 1, pos)) {
      return true;
    }
    if (folderPath[pos] !== '/') {
      return false;
    }
    if (pos + 1 === folderPath.length) {
      return true;
    }
    const end = folderPath.indexOf('/', pos + 1);
    for (let next = end; next >= pos + 1; next -= 1) {
      if (matchPrefix(ti + 1, next)) {
        return true;
      }
    }
    return false;
  }

  return matchPrefix(0, 0);
}
