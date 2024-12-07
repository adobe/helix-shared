/*
 * Copyright 2019 Adobe. All rights reserved.
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
 * Helpers for working with strings.
 */

/**
 * This is a helper for declaring multiline strings.
 *
 * ```
 * const s = multiline(`
 *     Foo
 *     Bar
 *     Baz
 *
 *        Hello
 *
 *     Bang
 * `);
 * ```
 *
 * The function basically just takes a string and then
 * strips the first & last lines if they are empty.
 *
 * In order to remove indentation, we determine the common
 * whitespace prefix length (number of space 0x20 characters
 * at the start of the line). This prefix is simply removed
 * from each line...
 */
export function multiline(str) {
  // Discard the leading & trailing line
  const lines = str.split('\n');

  // Strip the first and the last line
  if (lines[0].match(/^\s*$/)) {
    lines.shift();
  }
  if (lines.length > 0 && lines[lines.length - 1].match(/^\s*$/)) {
    lines.pop();
  }

  // Find the prefix length
  const prefixLen = lines
    .filter((l) => !l.match(/^\s*$/)) // Disregarding empty lines
    .map((l) => l.match(/^ */)[0].length) // Extract prefixes length
    .reduce((a, b) => Math.min(a, b), Infinity); // minimum

  return lines
    .map((l) => l.slice(prefixLen)) // discard prefixes
    .join('\n');
}

/**
 * Splits the given name at the last '.', returning the extension and the base name.
 * @param {string} name Filename
 * @returns {string[]} Returns an array containing the base name and extension.
 */
export function splitByExtension(name) {
  const idx = name.lastIndexOf('.');
  const baseName = idx > 0 && idx < name.length - 1 ? name.substring(0, idx) : name;
  const ext = idx > 0 && idx < name.length - 1 ? name.substring(idx + 1).toLowerCase() : '';
  return [baseName, ext];
}

/**
 * Sanitizes the given string by :
 * - convert to lower case
 * - normalize all unicode characters
 * - replace all non-alphanumeric characters with a dash
 * - remove all consecutive dashes
 * - remove all leading and trailing dashes
 *
 * @param {string} name
 * @returns {string} sanitized name
 */
export function sanitizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Sanitizes the file path by:
 * - convert to lower case
 * - normalize all unicode characters
 * - replace all non-alphanumeric characters with a dash
 * - remove all consecutive dashes
 * - remove all leading and trailing dashes
 *
 * Note that only the basename of the file path is sanitized. i.e. The ancestor path and the
 * extension is not affected.
 *
 * @param {string} filepath the file path
 * @param {object} opts Options
 * @param {boolean} [opts.ignoreExtension] if {@code true} ignores the extension
 * @returns {string} sanitized file path
 */
export function sanitizePath(filepath, opts = {}) {
  const idx = filepath.lastIndexOf('/') + 1;
  const extIdx = opts.ignoreExtension ? -1 : filepath.lastIndexOf('.');
  const pfx = filepath.substring(0, idx);
  const basename = extIdx < idx ? filepath.substring(idx) : filepath.substring(idx, extIdx);
  const ext = extIdx < idx ? '' : filepath.substring(extIdx);
  const name = sanitizeName(basename);
  return `${pfx}${name}${ext}`;
}

/**
 * Compute the edit distance using a recursive algorithm. since we only expect to have relative
 * short filenames, the algorithm shouldn't be too expensive.
 *
 * @param {string} s0 Input string
 * @param {string} s1 Input string
 * @returns {number|*}
 */
export function editDistance(s0, s1) {
  // make sure that s0 length is greater than s1 length
  if (s0.length < s1.length) {
    const t = s1;
    // eslint-disable-next-line no-param-reassign
    s1 = s0;
    // eslint-disable-next-line no-param-reassign
    s0 = t;
  }
  const l0 = s0.length;
  const l1 = s1.length;

  // init first row
  const resultMatrix = [[]];
  for (let c = 0; c < l1 + 1; c += 1) {
    resultMatrix[0][c] = c;
  }
  // fill out the distance matrix and find the best path
  for (let i = 1; i < l0 + 1; i += 1) {
    resultMatrix[i] = [i];
    for (let j = 1; j < l1 + 1; j += 1) {
      const replaceCost = (s0.charAt(i - 1) === s1.charAt(j - 1)) ? 0 : 1;
      resultMatrix[i][j] = Math.min(
        resultMatrix[i - 1][j] + 1, // insert
        resultMatrix[i][j - 1] + 1, // remove
        resultMatrix[i - 1][j - 1] + replaceCost,
      );
    }
  }
  return resultMatrix[l0][l1];
}
