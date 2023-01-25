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
export declare interface SecretsOptions {

  /**
   * Secret name.
   * @default '/helix-deploy/${package_name}/${function_name}'
   */
  name?:string;

  /**
   * Time in milliseconds until the cached secrets expire.
   * @default 3600000 (1 hour)
   */
  expiration?:number;

  /**
   * Time in milliseconds until a recheck for update is triggered.
   * @default 60000 (1 minute)
   */
  checkDelay?: number;
}

/**
 * Secrets middleware loads secrets from the secrets manager of the respective cloud provider.
 * @example <caption></caption>
 *
 * ```js
 * const { wrap, secrets } = require('@adobe/helix-shared');
 *
 * async function main(req, context) {
 *   const { enc } = context;
 *
 *   //…my action cod using 'env'…
 * }
 *
 * module.exports.main = wrap(main)
 *   .with(secrets);
 * ```
 *
 * @function bodyData
 * @param {UniversalFunction} fn - original universal function
 * @param {SecretsOptions} [opts] - optional options.
 * @returns {UniversalFunction} a new function that wraps the original one.
 */
export declare function secrets(fn: UniversalFunction, opts: SecretsOptions): UniversalFunction;
