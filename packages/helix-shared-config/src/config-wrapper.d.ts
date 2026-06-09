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

declare enum ConfigType {
  redirect = 'redirect',
  helix = 'helix',
  fstab = 'fstab',
  index = 'index',
  markup = 'markup',
  ignore = 'ignore',
}

/**
 * Body data middleware that extracts owner, repo, ref from the given request
 * and loads the requested configurations into the `context.config` object.
 * The data can be provided either as request parameters, url-encoded form data body, or a json
 * body.
 *
 * The loaded configs are added to the universal context 'config' property.
 *
 * If the configurations cannot be loaded due to missing parameters, a status code
 * of 400 will be returned. If the configurations cannot be loaded due to configuration
 * errors, a status code of 502 will be returned.
 *
 * @example <caption></caption>
 *
 * ```js
 * const { wrap, requiredConfig } = require('@adobe/helix-shared');
 *
 * async function main(req, context) {
 *   const { redirect } = context.config;
 *
 *   //…my action code using the redirect config
 * }
 *
 * module.exports.main = wrap(main)
 *   .with(requiredConfig, 'redirect');
 * ```
 *
 * @function requiredConfigData
 * @param {UniversalFunction} fn - original universal function
 * @param {ConfigType[]} configs - the configurations to load. Supported values are
 * @returns {UniversalFunction} a new function that wraps the original one.
 */
export declare function requiredConfig(fn: UniversalFunction, ...configs: ConfigType[]): UniversalFunction;

/**
 * Body data middleware that extracts owner, repo, ref from the given request
 * and loads the requested configurations into the `context.config` object.
 * The data can be provided either as request parameters, url-encoded form data body, or a json
 * body.
 *
 * The loaded configs are added to the universal context 'config' property.
 *
 * If the configurations cannot be loaded due to missing parameters or other configuration
 * errors, the corresponding object will remain undefined and it is up to the action code
 * to handle the error.
 *
 * @example <caption></caption>
 *
 * ```js
 * const { wrap, optionalConfig } = require('@adobe/helix-shared');
 *
 * async function main(req, context) {
 *   const { redirect } = context.config;
 *   if (redirect) {
 *     //…my action code using the redirect config
 *   }
 * }
 *
 * module.exports.main = wrap(main)
 *   .with(optionalConfig, 'redirect');
 * ```
 *
 * @function requiredConfigData
 * @param {UniversalFunction} fn - original universal function
 * @param {ConfigType[]} configs - the configurations to load. Supported values are
 * @returns {UniversalFunction} a new function that wraps the original one.
 */
export declare function optionalConfig(fn: UniversalFunction, ...configs: ConfigType[]): UniversalFunction;
