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

const Ajv = require('ajv');
const schemas = [
  /* eslint-disable global-require */
  require('./schemas/config.schema.json'),
  require('./schemas/strain.schema.json'),
  require('./schemas/strains.schema.json'),
  require('./schemas/giturl.schema.json'),
  require('./schemas/origin.schema.json'),
  /* eslint-enable global-require */
];

class ConfigValidator {
  constructor() {
    this._ajv = new Ajv({ allErrors: true, verbose: true });
    this._ajv.addSchema(schemas);
  }

  validate(config = {}) {
    return this._ajv.validate('https://ns.adobe.com/helix/shared/config', config);
  }

  assetValid(config = {}) {
    const valid = this.validate(config);
    if (!valid) {
      throw new Error(`Invalid configuration: ${this._ajv.errorsText()}`);
    }
  }
}

module.exports = ConfigValidator;
