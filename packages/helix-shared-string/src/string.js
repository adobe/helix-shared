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
