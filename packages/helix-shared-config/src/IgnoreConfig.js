/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { BaseConfig } from './BaseConfig.js';
import { GlobfileParser } from './parsers/GlobfileParser.js';

const IGNORE_CONFIG = '.hlxignore';

export class IgnoreConfig extends BaseConfig {
  constructor() {
    super(IGNORE_CONFIG);
    this._parser = new GlobfileParser();
  }

  /**
   * @override
   * @returns {IgnoreConfig}
   */
  async init() {
    await this.loadConfig();
    return this;
  }

  /**
   * Check if path is ignored
   * @param {string} path relative to repo root
   * @returns {boolean}
   */
  ignores(path) {
    return this._parser.includes(path);
  }
}
