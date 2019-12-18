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
    rootschema,
    itemschema,
    proxy,
    rootprop,
    keyname = 'name',
    valuename,
  }) {
    super(filename);

    this._proxy = proxy;
    this._rootprop = rootprop;
    this._itemschema = null;
    this._itemschema = itemschema;
    this._rootschema = rootschema;
    this._keyname = keyname;
    this._valuename = valuename;
    this._content = null;
  }

  async validate() {
    const ajv = new Ajv({
      allErrors: true,
      verbose: true,
      useDefaults: true,
      coerceTypes: 'array',
    });
    ajv.addSchema(this._itemschema);
    const res = ajv.validate(this._rootschema, this._cfg);
    if (res) {
      return res;
    }
    throw new Error(this._ajv.errorsText());
  }

  async init() {
    await this.loadConfig();

    this._rootschema = await fs.readJson(path.resolve(__dirname, 'schemas', this._rootschema));
    this._itemschema = await fs.readJson(path.resolve(__dirname, 'schemas', this._itemschema));

    await this.validate();

    // load the YAML and turn it into objects
    this._content = this._proxy(
      this._document,
      this._rootprop,
      this._itemschema,
      this._keyname,
      this._valuename,
    );

    const content = this._content;

    // define the getter
    Object.defineProperty(this, this._rootprop, {
      get: () => content,
    });

    return this;
  }

  toJSON() {
    const obj = {};
    obj[this._rootprop] = this._content.toJSON();

    return obj;
  }
}

module.exports = SchemaDerivedConfig;
