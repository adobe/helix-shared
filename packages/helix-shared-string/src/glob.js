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
 * Splits the normalized glob into literal strings and wildcard tokens (`*`, `**`, `(/*)?` and
 * `(/**)?`). Wildcards are wrapped in objects to distinguish them from literals.
 *
 * @param {string} glob the glob
 * @returns {Array<string|{wildcard: string}>|null} the tokens or `null` if the glob is invalid
 */
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
      tokens.push(normalized.substring(last, match.index));
    }
    last = match.index + match[0].length;
    // optional wildcards must end a segment, e.g. `/a(/*)?b` is invalid
    if (match[0].startsWith('(') && last < normalized.length && normalized[last] !== '/') {
      return null;
    }
    tokens.push({ wildcard: match[0] });
  }
  if (last < normalized.length) {
    tokens.push(normalized.substring(last));
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
 * Globs with more than {@link MAX_GLOB_WILDCARDS} wildcards, or with `(/*)?` or `(/**)?` not
 * followed by `/` or the end of the glob, are rejected.
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
    .map((token) => (typeof token === 'string' ? escape(token) : TOKEN_REGEXPS[token.wildcard]))
    .join('');
  return new RegExp(`^${re}$`);
}

/**
 * Checks if the given glob is valid, i.e. can be converted to a regular expression.
 * @param {string} glob the glob
 * @returns {boolean} {@code true} if the glob is valid
 */
export function isValidGlobRule(glob) {
  return tokenize(glob) !== null;
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
  return Boolean(globToRegExp(glob)?.test(path));
}

/**
 * Expands the optional wildcards (`(/*)?` and `(/**)?`) of the tokens into globs without and
 * with the respective wildcard. The resulting globs only contain `*` and `**` wildcards.
 *
 * @param {Array<string|{wildcard: string}>} tokens glob tokens
 * @returns {string[]} the expanded globs
 */
function expandOptionals(tokens) {
  let globs = [''];
  for (const token of tokens) {
    if (typeof token === 'string') {
      globs = globs.map((glob) => glob + token);
    } else if (token.wildcard.startsWith('(')) {
      const wildcard = token.wildcard.slice(1, -2);
      globs = globs.flatMap((glob) => [glob, glob + wildcard]);
    } else {
      globs = globs.map((glob) => glob + token.wildcard);
    }
  }
  return globs;
}

/**
 * Compiles a single glob segment (without `/`). A segment containing `**` matches every path
 * segment starting with the part before the `**`, as the `**` can consume the rest of the path.
 *
 * @param {string} segment glob segment
 * @returns {{re: RegExp, descendants: boolean}} compiled segment
 */
function compileSegment(segment) {
  const idx = segment.indexOf('**');
  const descendants = idx >= 0;
  const pattern = (descendants ? segment.substring(0, idx) : segment)
    .split('*')
    .map(escape)
    .join('[^/]*');
  return { re: new RegExp(`^${pattern}${descendants ? '' : '$'}`), descendants };
}

/**
 * Creates a function that checks if the glob may match a folder or a path below it, i.e. if the
 * folder path is a prefix of some path matched by the glob. Use this instead of
 * {@link globMayMatchBelow} when checking many folders.
 *
 * @param {string} glob the glob
 * @returns {function(string): boolean|null} matcher accepting a folder path ending with `/`, or
 *          `null` if the glob is invalid
 */
export function createBelowMatcher(glob) {
  const tokens = tokenize(glob);
  if (!tokens) {
    return null;
  }
  const alternatives = expandOptionals(tokens)
    .map((expanded) => expanded.split('/').map(compileSegment));

  return (folderPath) => {
    // `/jp/` → ['', 'jp']
    const folders = folderPath.split('/').slice(0, -1);
    return alternatives.some((segments) => {
      for (let k = 0; k < folders.length; k += 1) {
        if (k >= segments.length) {
          return false;
        }
        const { re, descendants } = segments[k];
        if (descendants) {
          return re.test(folders[k]);
        }
        if (!re.test(folders[k])) {
          return false;
        }
      }
      // the glob must continue below the folder
      return segments.length > folders.length;
    });
  };
}

/**
 * Checks if the glob may match the given folder or a path below it, i.e. if the folder path
 * is a prefix of some path matched by the glob. Invalid globs never match.
 * Note that the glob is compiled on every invocation; use {@link createBelowMatcher} when
 * checking many folders.
 *
 * @param {string} glob the glob
 * @param {string} folderPath folder path, ending with `/`
 * @returns {boolean} {@code true} if the glob may match the folder or a path below it
 */
export function globMayMatchBelow(glob, folderPath) {
  const matcher = createBelowMatcher(glob);
  return matcher !== null && matcher(folderPath);
}
