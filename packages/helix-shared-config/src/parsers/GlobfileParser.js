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

const ignore = require('ignore');
const BaseParser = require('./BaseParser');

const NAME = 'globfile';

class GlobfileParser extends BaseParser {
  constructor() {
    super(NAME, {
      outputs: ['string'],
    });
  }

  /**
   * Parse a globfile from string.
   *
   * @param {string} str
   * @returns {@type import('ignore').Ignore}
   *
   * @override
   */
  parse(str) {
    this._source = str;
    this._parsed = ignore().add(this._source);
    return this;
  }

  /**
   * Check if globfile contains the path.
   *
   * In the case of ignorefiles, truthy return
   * means the path IS ignored.
   * @param {string} path
   * @returns {boolean} true if not included in globs
   */
  includes(path) {
    if (!this._parsed) {
      throw new Error('Must parse first.');
    }

    return this._parsed.ignores(path);
  }

  /**
   * Check if globfile does NOT contain the path.
   *
   * In the case of ignorefiles, truthy return
   * means the path is NOT ignored.
   * @param {string} path
   * @returns {boolean} true if not included in globs
   */
  excludes(path) {
    return !this.includes(path);
  }

  /**
   * @inheritdoc
   * @override
   */
  as(format) {
    switch (format.toLowerCase()) {
      case 'string':
        return this._source;
      default:
        /* throws */
        return super.as(format);
    }
  }
}

module.exports = GlobfileParser;
