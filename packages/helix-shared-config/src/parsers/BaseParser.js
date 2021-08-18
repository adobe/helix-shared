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

class BaseParser {
  /**
   *
   * @param {string} name name of the parser, e.g. `yaml`
   * @param {Object} opts
   * @param {string[]} opts.outputs supported output formats, used with `#as()`
   *
   */
  constructor(name, {
    outputs,
  }) {
    this._name = name;
    this._outputs = outputs;
    this._source = null;
    this._parsed = null;
  }

  /**
   * The parser name
   * @type {string}
   */
  get name() {
    return this._name;
  }

  /**
   * The source as passed to `parse()`
   * @type {string}
   */
  get source() {
    return this._source;
  }

  /**
   * The parsed instance from last `parse()`
   * @type {any}
   */
  get parsed() {
    return this._parsed;
  }

  /**
   * Check if parser supports an output format.
   * @param {string} format
   * @returns {boolean}
   */
  outputs(format) {
    return this._outputs.includes(format);
  }

  /**
   * @abstract
   *
   * Parse string
   * @param {string} source
   */
  parse(_) {
    throw new Error(`parse() not implemented for ${this._name}.`);
  }

  /**
   * @abstract
   *
   * Get parsed data as format
   * @param {string} format
   */
  as(format) {
    throw new Error(`${format} output not implemented for ${this._name}.`);
  }
}

module.exports = BaseParser;
