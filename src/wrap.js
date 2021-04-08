/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/**
 * Helper function to easily chain functions.
 *
 * **Usage:**
 *
 * ```js
 * const { wrap } = require('@adobe/helix-shared');
 *
 * async main(params) {
 *   // …my action code…
 * }
 *
 * module.exports.main = wrap(main)
 *   .with(epsagon)
 *   .with(status)
 *   .with(logger);
 * ```
 *
 * @module wrap
 */

/**
 * A function that makes your function (i.e. `main`) wrappable,
 * so that using `with` a number of wrappers can be applied. This allows
 * you to export the result as a new function.
 *
 * Usage:
 *
 * ```js
 * async main(req, context) {
 *   //…my action code…
 * }
 *
 * module.exports.main = wrap(main)
 * .with(epsagon)
 * .with(status)
 * .with(logger);
 * ```
 * Note: the execution order is that the last wrapper added will be executed first.
 * @param {Function} fn the function to prepare for wrapping
 * @returns {WrappableFunction} the same main function, now including a `with` method
 */
function wrap(fn) {
  const withfn = function withfn(wrapper, ...opts) {
    const wrapped = wrapper(this, ...opts);
    wrapped.with = withfn;
    return wrapped;
  };

  // eslint-disable-next-line no-param-reassign
  fn.with = withfn;
  return fn;
}

module.exports = wrap;
