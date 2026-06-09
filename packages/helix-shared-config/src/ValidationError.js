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

export class ValidationError extends Error {
  constructor(
    type,
    msg,
    errors = [],
    mapError = ValidationError.mapError,
    prettyname = ValidationError.prettyname,
  ) {
    const detail = errors.map((e) => mapError(e, prettyname)).join('\n');
    super(`Invalid ${type} configuration:
${detail}

${msg}`);
    this._errors = errors;
  }

  static prettyname(path, schema) {
    return path ? `${schema.title || schema.$id} ${path}` : `${schema.title || schema.$id}`;
  }

  static mapError({
    keyword, dataPath, message, data, params, parentSchema,
  }, prettyname) {
    if (keyword === 'additionalProperties') {
      return `${prettyname(dataPath, parentSchema)} has unknown property '${params.additionalProperty}'`;
    }
    if (keyword === 'required') {
      return `${prettyname(dataPath, parentSchema)} ${message}`;
    }
    return `${prettyname(dataPath, parentSchema)} ${message}: ${keyword}(${JSON.stringify(data)}, ${JSON.stringify(params)})`;
  }
}
