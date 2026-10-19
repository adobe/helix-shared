/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { UniversalFunction } from '@adobe/helix-universal';

/**
 * Options for the wrap function
 */
export declare interface BodyDataOptions {

  /**
   * Flag that coerces 'true' and 'false' strings to boolean.
   */
  coerceBoolean?:boolean;

  /**
   * Flag that coerces number strings to integers.
   */
  coerceInt?:boolean;

  /**
   * Flag that coerces number strings (e.g. `-1.5`, `2e3`) to numbers.
   */
  coerceNumber?:boolean;

  /**
   * Support YAML in the POST body.
   */
  supportYAML?:boolean;
}

/**
 * Body data middleware that extracts _data_ from the given request.
 * The data can be provided either as request parameters, url-encoded form data body, or a json
 * body.
 *
 * The extracted data is added to the universal context 'data' property. Indexed parameters
 * (e.g. `foo[2]=bar`) are limited to indices up to {@link MAX_ARRAY_INDEX}; larger indices
 * result in a 400 response.
 *
 * @example
 *
 * ```js
 * import wrap from '@adobe/helix-shared-wrap';
 * import bodyData from '@adobe/helix-shared-body-data';
 *
 * async function run(req, context) {
 *   const { data } = context;
 *
 *   // …my action code using 'data'…
 * }
 *
 * export const main = wrap(run)
 *   .with(bodyData);
 * ```
 *
 * @function bodyData
 * @param {UniversalFunction} fn - original universal function
 * @param {BodyDataOptions} [opts] - optional options.
 * @returns {UniversalFunction} a new function that wraps the original one.
 */
export default function bodyData(fn: UniversalFunction, opts?: BodyDataOptions): UniversalFunction;

/**
 * Maximum array index accepted for indexed parameters like `foo[99]`.
 */
export declare const MAX_ARRAY_INDEX: number;
