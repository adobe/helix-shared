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
const fs = require('fs-extra');
const path = require('path');
const Ajv = require('ajv');
const BaseConfig = require('./BaseConfig.js');

class SchemaDerivedConfig extends BaseConfig {
  constructor({
    filename,
    schemas = {},
    handlers = {},
  } = {}) {
    super(filename);

    this._content = null;
    this._schemas = schemas;
    this._handlers = handlers;
  }

  async validate() {
    const ajv = new Ajv({
      allErrors: true,
      verbose: true,
      useDefaults: true,
      coerceTypes: 'array',
    });

    for (const value of Object.values(this._schemas || {})) {
      ajv.addSchema(value);
    }

    const res = ajv.validate(this._schemas['^/$'], this._cfg);
    if (res) {
      return res;
    }
    throw new Error(ajv.errorsText());
  }

  static matches(propertypath) {
    return (pattern) => new RegExp(pattern).test(propertypath);
  }

  defaultHandler(root = '') {
    return {
      get: (target, prop) => {
        if (prop === 'then') {
          return target[prop];
        }
        if (prop === 'toJSON') {
          return () => this._cfg;
        }
        const handler = this.getHandler(`${root}/${prop}`);
        const handled = handler ? new Proxy(target[prop], handler) : target[prop];

        if (typeof handled === 'object') {
          // we are getting an object, so better wrap it again to
          // intercept property access
          return new Proxy(handled, this.defaultHandler(`${root}/${prop}`));
        }
        // this is a plain value
        return handled;
      },
    };
  }

  getHandler(propertypath) {
    const matching = Object.keys(this._handlers).filter(SchemaDerivedConfig.matches(propertypath));
    if (matching.length > 0) {
      const [firstmatch] = matching;
      return this._handlers[firstmatch];
    }
    return undefined;
  }

  async init() {
    await this.loadConfig();

    for (const [key, value] of Object.entries(this._schemas || {})) {
      const schema = fs.readJsonSync(path.resolve(__dirname, 'schemas', value));
      this._schemas[key] = schema;
    }

    await this.validate();

    this._content = new Proxy(this._cfg, this.defaultHandler(''));

    return this._content;
  }

  toJSON() {
    return this._cfg;
  }
}

module.exports = SchemaDerivedConfig;
