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

/* eslint-disable max-classes-per-file */

const Ajv = require('ajv');
const schemas = [
  /* eslint-disable global-require */
  require('./schemas/config.schema.json'),
  require('./schemas/runtimestrain.schema.json'),
  require('./schemas/proxystrain.schema.json'),
  require('./schemas/strains.schema.json'),
  require('./schemas/giturl.schema.json'),
  require('./schemas/staticgiturl.schema.json'),
  require('./schemas/origin.schema.json'),
  require('./schemas/performance.schema.json'),
  require('./schemas/redirectrule.schema.json'),
  require('./schemas/conditions.schema.json'),
  require('./schemas/markup.schema.json'),
  require('./schemas/markupmapping.schema.json'),
  /* eslint-enable global-require */
];

class ValidationError extends Error {
  constructor(msg, errors = []) {
    function prettyname(path, schema) {
      if (path.startsWith('.strains')) {
        return `${schema.title || 'Invalid Strain'} ${path.replace(/\.strains(\.|\[')(.*)/, '$2').replace(/'.*/, '')}`;
      }
      return `${schema.title || schema.$id} ${path}`;
    }

    const detail = errors.map(({
      keyword, dataPath, message, data, params, parentSchema,
    }) => {
      if (keyword === 'additionalProperties') {
        return `${prettyname(dataPath, parentSchema)} has unknown property '${params.additionalProperty}'`;
      }
      if (keyword === 'required' && dataPath === '') {
        return 'A set of strains and a default strain are missing.';
      }
      if (keyword === 'required' && dataPath === '.strains') {
        return 'A default strain is missing.';
      }
      if (keyword === 'required') {
        return `${prettyname(dataPath, parentSchema)} ${message}`;
      }
      if (keyword === 'oneOf' && dataPath.startsWith('.strains')) {
        return `${prettyname(dataPath, parentSchema)} must be either a Runtime Strain or a Proxy Strain`;
      }
      return `${prettyname(dataPath, parentSchema)} ${message}: ${keyword}(${JSON.stringify(data)}, ${JSON.stringify(params)})`;
    }).join('\n');
    super(`Invalid configuration:
${detail}

${msg}`);
    this._errors = errors;
  }
}

class ConfigValidator {
  constructor() {
    this._ajv = new Ajv({
      allErrors: true,
      verbose: true,
      useDefaults: true,
      coerceTypes: true,
    });
    this._ajv.addSchema(schemas);
  }

  validate(config = {}) {
    this._ajv.errors = [];
    return this._ajv.validate('https://ns.adobe.com/helix/shared/config', config);
  }

  assetValid(config = {}) {
    // handle simple case for no strains. since the ajv error is a bit cryptic.
    if (config.strains
      && !((config.strains.find && config.strains.find((s) => s.name === 'default'))
        || config.strains.default)) {
      throw new ValidationError('A list of strains and a strain with the name "default" is required.');
    }
    const valid = this.validate(config);
    if (!valid) {
      throw new ValidationError(this._ajv.errorsText(), this._ajv.errors);
    }
  }
}

module.exports = ConfigValidator;
