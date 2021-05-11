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

const Ajv = require('ajv').default;
const ajvFormats = require('ajv-formats');

const schemas = [
  /* eslint-disable global-require */
  require('./schemas/data-embed-response.schema.json'),
  require('./schemas/row.schema.json'),
  require('./schemas/sheet.schema.json'),
  require('./schemas/workbook.schema.json'),
  /* eslint-enable global-require */
];

class DataEmbedValidator {
  constructor() {
    this._ajv = new Ajv({
      allErrors: true,
      verbose: true,
      useDefaults: false,
      coerceTypes: false,
      strict: false,
    });
    this._ajv.addSchema(schemas);
    ajvFormats(this._ajv);
  }

  validate(response = {}) {
    this._ajv.errors = [];
    return this._ajv.validate('https://ns.adobe.com/helix/data-embed/response', response);
  }

  assertValid(response) {
    const valid = this.validate(response);
    if (!valid) {
      throw new Error(this._ajv.errorsText());
    }
  }
}

module.exports = DataEmbedValidator;
