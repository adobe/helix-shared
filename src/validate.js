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
const configschema = require('./schemas/config.schema.json');
const strainschema = require('./schemas/strain.schema.json');
const strainsschema = require('./schemas/strains.schema.json');
const giturlschema = require('./schemas/giturl.schema.json');

const ajv = new Ajv({ allErrors: true, verbose: true });
ajv.addSchema([configschema, strainschema, strainsschema, giturlschema]);

function validate(config = {}) {
  const valid = ajv.validate('https://ns.adobe.com/helix/shared/config', config);
  if (!valid) {
    throw new Error(`Invalid configuration: ${ajv.errorsText()}`);
  }
  return true;
}

module.exports = validate;
