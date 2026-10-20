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
   * Largest body in bytes that the wrapper reads. A bigger body gets a 413 response.
   * Only applies to the bodies the wrapper parses (json, form, yaml, text).
   * No limit if not set.
   */
  maxBodySize?:number;
}

/**
 * The kind of body the wrapper read.
 */
export declare type BodyType = 'json' | 'form' | 'yaml' | 'text';

/**
 * What the wrapper puts into `context.data`.
 */
export declare interface BodyData {

  /**
   * The URL query parameters, always set.
   */
  query:Record<string, any>;

  /**
   * The request body, only set for POST, PUT and PATCH requests with a json, form, yaml
   * or text body: an object or array for json, an object for form, a string for yaml and text.
   */
  body?:any;

  /**
   * The kind of body in `body`, only set together with `body`.
   */
  type?:BodyType;
}

/**
 * Body data middleware that sets the universal context 'data' property to
 * `{ query, body, type }` (see {@link BodyData}). The query parameters are always parsed.
 * For POST, PUT and PATCH requests with a json, form, yaml or text body, the body is
 * parsed too and the wrapped function gets a request with the same body bytes.
 *
 * Indexed parameters (e.g. `foo[2]=bar`) are limited to indices up to
 * {@link MAX_ARRAY_INDEX}; larger indices result in a 400 response.
 *
 * @example
 *
 * ```js
 * import wrap from '@adobe/helix-shared-wrap';
 * import bodyData from '@adobe/helix-shared-body-data';
 *
 * async function run(req, context) {
 *   const { query, body, type } = context.data;
 *
 *   // …my action code using 'query' and 'body'…
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
