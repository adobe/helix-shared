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

import { Request, Response, UniversalContext, UniversalFunction } from '@adobe/helix-universal';

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
   * Flag that coerces  number strings to numbers.
   */
  coerceNumber?:boolean;
}

/**
 * Body data middleware that extracts _data_ from the given request.
 * The data can be provided either as request parameters, url-encoded form data body, or a json
 * body.
 *
 * The extracted data is added to the universal context 'data' property.
 *
 * @example <caption></caption>
 *
 * ```js
 * const { wrap, bodyData } = require('@adobe/helix-shared');
 *
 * async function main(req, context) {
 *   const { data } = context;
 *
 *   //…my action cod using 'data'…
 * }
 *
 * module.exports.main = wrap(main)
 *   .with(bodyData);
 * ```
 *
 * @function bodyData
 * @param {UniversalFunction} fn - original universal function
 * @param {BodyDataOptions} [opts] - optional options.
 * @returns {UniversalFunction} a new function that wraps the original one.
 */
export declare function bodyData(fn: UniversalFunction, opts: BodyDataOptions): UniversalFunction;
