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
import {CachePlugin} from "./CachePlugin";

export declare interface S3CachePluginOptions {
  log: Console;
  bucket: string;
  key: string;
  secret: string;
}

export declare class S3CachePlugin implements CachePlugin {
  /**
   * Decrypts a AES-GCM encrypted digest.
   * @param {string} key encryption key / password
   * @param {Buffer} data the encrypted data
   * @returns {Buffer} the plain text
   * @throws an error if the given key cannot decrypt the digest.
   */
  static encrypt(key:string, data:Buffer):Buffer;

  /**
   * Decrypts a AES-GCM encrypted digest.
   * @param {string} key encryption key / password
   * @param {Buffer} data the encrypted data
   * @returns {Buffer} the plain text
   * @throws an error if the given key cannot decrypt the digest.
   */
  static decrypt(key: string, data: Buffer):Buffer;

  constructor(opts: S3CachePluginOptions);
}
