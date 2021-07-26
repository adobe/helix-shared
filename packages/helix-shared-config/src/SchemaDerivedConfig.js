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
const Ajv = require('ajv').default;
const ajvFormats = require('ajv-formats');
const BaseConfig = require('./BaseConfig.js');
const ValidationError = require('./ValidationError.js');

/**
 * A Helix Config that is based on a (number of) JSON Schema(s).
 */
class SchemaDerivedConfig extends BaseConfig {
  /**
   *
   * @param {object} opts
   * @param {string} opts.filename - the source file when loading the config from disk
   * @param {object} opts.schemas - a mapping between JSON paths (regex) and schema file names
   * @param {object} opts.handlers - a mapping between JSON paths (regex) and proxy handlers
   */
  constructor({
    filename,
    schemas,
    handlers,
  }) {
    super(filename);

    this._content = null;

    // ensure that sub classes don't accidentally override this properties.
    Object.defineProperties(this, {
      _schemas: {
        writable: false,
        configurable: false,
        value: schemas,
      },
      _handlers: {
        writable: false,
        configurable: false,
        value: handlers,
      },
    });
  }

  /**
   * Validates the loaded configuration and coerces types and sets defaulst
   */
  async validate() {
    const ajv = new Ajv({
      allErrors: true,
      verbose: true,
      useDefaults: true,
      coerceTypes: 'array',
      strict: false,
    });
    ajvFormats(ajv);

    ajv.addSchema(Object.values(this._schemas));
    const res = ajv.validate(this._schemas['^/$'], this._cfg);
    if (res) {
      return res;
    }
    throw new ValidationError(ajv.errorsText(), ajv.errors);
  }

  /**
   * Creates a matcher function that determines if a given property path
   * pattern matches the provided property path
   * @param {string} propertypath - the JSON Pointer path of the property
   */
  static matches(propertypath) {
    return (pattern) => new RegExp(pattern).test(propertypath);
  }

  /**
   * Creates a default proxy handler that looks up the correct handler
   * for the current property path and then wraps the corresponding
   * config object with it as a handler.
   * @param {string} root - the JSON Pointer path of the root property
   */
  defaultHandler(root) {
    return {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          // never proxy private fields
          if (prop.charAt(0) === '_') {
            return target[prop];
          }
          const handler = this.getHandler(`${root}/${prop}`);
          const handled = handler && (prop in target)
            ? new Proxy(target[prop], handler)
            : target[prop];

          if (handled !== null && typeof handled === 'object') {
            // we are getting an object, so better wrap it again to intercept property access
            const wrapped = new Proxy(handled, this.defaultHandler(`${root}/${prop}`));

            if (typeof wrapped.length === 'number') {
              return Array.from(wrapped);
            }
            return wrapped;
          }
          // this is a plain value
          return handled;
        }
        return undefined;
      },
    };
  }

  /**
   * Looks up the handler registered to the current property path (if any)
   * @param {string} propertypath - the JSON Pointer path of the current property
   */
  getHandler(propertypath) {
    const matching = Object.keys(this._handlers).filter(SchemaDerivedConfig.matches(propertypath));
    if (matching.length > 0) {
      const [firstmatch] = matching;
      return this._handlers[firstmatch];
    }
    return undefined;
  }

  /**
   * Initialize the configuration
   */
  async init() {
    await this.loadConfig();
    await this.validate();

    this._content = new Proxy(this._cfg, this.defaultHandler(''));

    // redefine getters
    Object.keys(this._cfg).forEach((key) => {
      if (!(key in this)) {
        this[key] = this._content[key];
      }
    });

    return this;
  }

  toJSON() {
    return this._cfg;
  }
}

module.exports = SchemaDerivedConfig;
