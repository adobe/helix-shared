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
import { S3CachePlugin } from "./FSCachePlugin";

export declare interface S3CacheManagerOptions {
  log: Console;
  type: string;
  bucket: string;
  prefix: string;
  secret: string;
}

export declare class S3CacheManager {
  /**
   * Find the first cache with the given opts, that exists, otherwise the plugin using the
   * default options is returned.
   * @param {string} key
   * @param {object} defaultOpts
   * @param {object} opts
   * @returns {Promise<S3CachePlugin>}
   */
  static findCache(key:string, defaultOpts:S3CacheManagerOptions, ...opts:S3CacheManagerOptions[]):Promise<S3CachePlugin>;

  constructor(opts: S3CacheManagerOptions);

  listCacheKeys():Promise<string[]>;

  hasCache(key:string):Promise<boolean>;

  getCache(key:string):Promise<S3CachePlugin>;
}
