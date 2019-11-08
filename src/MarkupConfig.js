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
const YAML = require('yaml');
const NamedMapProxy = require('./NamedMapProxy.js');
const MarkupMappingSchema = require('./schemas/markupmapping.schema.json');
const MarkupConfigValidator = require('./MarkupConfigValidator');

class MarkupConfig {
  constructor() {
    this._source = '';
    this._document = null;
    this._markup = null;
    this._cfg = {};
  }

  get markup() {
    return this._markup;
  }

  withSource(value) {
    this._source = value;
    return this;
  }

  async validate() {
    new MarkupConfigValidator().validate(this._cfg);
  }

  async loadConfig() {
    if (this._source.indexOf('\t') >= 0) {
      throw Error('Tabs not allowed in markup.yaml');
    }
    this._document = YAML.parseDocument(this._source, {
      merge: true,
      schema: 'core',
    });
    this._cfg = this._document.toJSON() || {};
  }

  async init() {
    await this.loadConfig();
    await this.validate();

    this._markup = NamedMapProxy(this._document, 'markup', MarkupMappingSchema);
    return this;
  }
}

module.exports = MarkupConfig;
