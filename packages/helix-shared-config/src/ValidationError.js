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

class ValidationError extends Error {
  constructor(msg, errors = []) {
    function prettyname(path, schema) {
      if (path) {
        if (path.startsWith('.strains')) {
          return `${schema.title || 'Invalid Strain'} ${path.replace(/\.strains(\.|\[')(.*)/, '$2').replace(/'.*/, '')}`;
        }
        return `${schema.title || schema.$id} ${path}`;
      }
      return `${schema.title || schema.$id}`;
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

module.exports = ValidationError;
