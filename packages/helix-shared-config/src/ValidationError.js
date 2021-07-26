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

class ValidationError extends Error {
  constructor(msg, errors = [], mapError = ValidationError.mapError) {
    const detail = errors.map((e) => mapError(e)).join('\n');
    super(`Invalid configuration:
${detail}

${msg}`);
    this._errors = errors;
  }

  static prettyname(path, schema) {
    if (path) {
      if (path.startsWith('.strains')) {
        return `${schema.title || 'Invalid Strain'} ${path.replace(/\.strains(\.|\[')(.*)/, '$2').replace(/'.*/, '')}`;
      }
      return `${schema.title || schema.$id} ${path}`;
    }
    return `${schema.title || schema.$id}`;
  }

  // eslint-disable-next-line class-methods-use-this
  static mapError({
    keyword, dataPath, message, data, params, parentSchema,
  }) {
    if (keyword === 'additionalProperties') {
      return `${ValidationError.prettyname(dataPath, parentSchema)} has unknown property '${params.additionalProperty}'`;
    }
    if (keyword === 'required') {
      return `${ValidationError.prettyname(dataPath, parentSchema)} ${message}`;
    }
    return `${ValidationError.prettyname(dataPath, parentSchema)} ${message}: ${keyword}(${JSON.stringify(data)}, ${JSON.stringify(params)})`;
  }
}

module.exports = ValidationError;
