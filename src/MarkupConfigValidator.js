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

/* eslint-disable max-classes-per-file */

const Ajv = require('ajv');
const schemas = [
  /* eslint-disable global-require */
  require('./schemas/markupconfig.schema.json'),
  require('./schemas/markupmapping.schema.json'),
  require('./schemas/markup.schema.json'),
  /* eslint-enable global-require */
];

class MarkupConfigValidator {
  constructor() {
    this._ajv = new Ajv({
      allErrors: true,
      verbose: true,
      useDefaults: true,
      coerceTypes: 'array',
    });
    this._ajv.addSchema(schemas);
  }

  validate(config = {}) {
    this._ajv.errors = [];
    return this._ajv.validate('https://ns.adobe.com/helix/shared/markupconfig', config);
  }
}

module.exports = MarkupConfigValidator;
