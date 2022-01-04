/*
 * Copyright 2022 Adobe. All rights reserved.
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
export declare interface BounceOptions {

  /**
   * A fast-returning universal function that generates the ack response
   */
  responder:UniversalFunction;

  /**
   * Timeout to delay the start of the fast function.
   */
  timeout?:number;
}

/**
 * The bounce middleware can be used to get fast pro-forma responses from a slow running function.
 * To use it, wrap the slower function with the bounce middleware and provide a faster `responder`
 * function. Upon first invocation, both the fast responder and the slow function will be invoked,
 * and the faster of the two responses returned. As the invocation of the slow function happens via
 * a fetch request, it won't be aborted, even when the fast responder returns.
 *
 * @example <caption></caption>
 *
 * ```js
 * const { wrap, bounce } = require('@adobe/helix-shared');
 * const { Response } = require('@adobe/helix-fetch')
 *
 * async function fast(req, context) {
 *   return new Response(`I am working on it. Use ${context.invocation.bounceId} to track the status.`);
 * }
 * 
 * async function main(req, context) {
 *   // do something slow
 * }
 *
 * module.exports.main = wrap(main)
 *   .with(bounce, { responder: fast });
 * ```
 *
 * @function bodyData
 * @param {UniversalFunction} fn - original universal function
 * @param {BounceOptions} [opts] - optional options.
 * @returns {UniversalFunction} a new function that wraps the original one.
 */
export declare function bounce(fn: UniversalFunction, opts: BounceOptions): UniversalFunction;
