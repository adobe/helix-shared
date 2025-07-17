/*
 * Copyright 2025 Adobe. All rights reserved.
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
 * Timer
 */
export declare interface RequestTimer {
  /**
   * Records the timestamp of the given `step`
   */
  update(step:string): void;
}

/**
 * Server timing data middleware adds the {code RequestTimer} to the context.
 *
 * @example <caption></caption>
 *
 * ```js
 * const { wrap, serverTiming } = require('@adobe/helix-shared');
 *
 * async function main(req, context) {
 *   const { timer } = context;
 *
 *   timer.update('begin some operation')
 * }
 *
 * module.exports.main = wrap(main)
 *   .with(serverTiming);
 * ```
 *
 * @function serverTiming
 * @param {UniversalFunction} fn - original universal function
 * @returns {UniversalFunction} a new function that wraps the original one.
 */
export declare function serverTiming(fn: UniversalFunction): UniversalFunction;
