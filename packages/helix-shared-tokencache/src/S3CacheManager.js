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
import { basename } from 'path';
import { HeadObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { S3CachePlugin } from './S3CachePlugin.js';

/**
 * aliases
 * @typedef {import("@azure/msal-node").ICachePlugin} ICachePlugin
 * @typedef {import("@azure/msal-node").TokenCacheContext} TokenCacheContext
 */

export class S3CacheManager {
  /**
   * Find the first cache with the given opts, that exists, otherwise the plugin using the
   * default options is returned.
   * @param {string} key
   * @param {object} defaultOpts
   * @param {object} opts
   * @returns {Promise<S3CachePlugin>}
   */
  static async findCache(key, defaultOpts, ...opts) {
    for (const opt of opts) {
      const cacheManager = new S3CacheManager({
        ...defaultOpts,
        ...opt,
      });
      // eslint-disable-next-line no-await-in-loop
      if (await cacheManager.hasCache(key)) {
        return cacheManager.getCache(key);
      }
    }
    return new S3CacheManager(defaultOpts).getCache(key);
  }

  constructor(opts) {
    this.log = opts.log || console;
    this.bucket = opts.bucket;
    this.prefix = opts.prefix;
    this.secret = opts.secret;
    this.type = opts.type;
    this.s3 = new S3Client();
  }

  getAuthObjectKey(key) {
    return `${this.prefix}/auth-${this.type}-${key}.json`;
  }

  async listCacheKeys() {
    const {
      log, s3, bucket, prefix,
    } = this;
    log.debug('s3: list token cache', prefix);
    try {
      const res = await s3.send(new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${prefix}/`,
      }));
      return (res.Contents || [])
        .map((entry) => basename(entry.Key))
        .filter((name) => (name.startsWith(`auth-${this.type}-`) && name.endsWith('.json')))
        .map((name) => name.replace(/auth-([a-z0-9]+)-([a-z0-9]+).json/i, '$2'));
    } catch (e) {
      log.info('s3: unable to list token caches', e);
      return [];
    }
  }

  async hasCache(key) {
    const { log, bucket } = this;
    try {
      await this.s3.send(new HeadObjectCommand({
        Bucket: bucket,
        Key: this.getAuthObjectKey(key),
      }));
      return true;
    } catch (e) {
      if (e.$metadata?.httpStatusCode !== 404) {
        log.warn('s3: unable to check token cache', e);
        throw e;
      }
      return false;
    }
  }

  /**
   * @param key
   * @returns {S3CachePlugin}
   */
  async getCache(key) {
    return new S3CachePlugin({
      log: this.log,
      key: this.getAuthObjectKey(key),
      secret: this.secret,
      bucket: this.bucket,
    });
  }
}
