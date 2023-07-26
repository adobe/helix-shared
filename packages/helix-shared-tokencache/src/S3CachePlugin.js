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
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Response } from '@adobe/fetch';
import { decrypt, encrypt } from './encrypt.js';

/**
 * aliases
 * @typedef {import("@azure/msal-node").ICachePlugin} ICachePlugin
 * @typedef {import("@azure/msal-node").TokenCacheContext} TokenCacheContext
 */

/**
 * Cache plugin for MSAL
 * @class MemCachePlugin
 * @implements ICachePlugin
 */
export class S3CachePlugin {
  /**
   * @param {S3CachePluginOptions} opts
   */
  constructor(opts) {
    this.log = opts.log || console;
    this.bucket = opts.bucket;
    this.key = opts.key;
    this.secret = opts.secret;
    this.s3 = new S3Client();
    this.meta = null;
    this.data = null;
  }

  async deleteCache() {
    const { log, key, bucket } = this;
    try {
      log.debug('s3: read token cache', key);
      await this.s3.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }));
    } catch (e) {
      if (e.$metadata?.httpStatusCode === 404) {
        log.info('s3: unable to deserialize token cache: not found');
      } else {
        log.warn('s3: unable to deserialize token cache', e);
      }
    }
  }

  async #loadData() {
    const {
      log, secret, key, bucket,
    } = this;
    try {
      log.debug('s3: read token cache', key);
      const res = await this.s3.send(new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }));
      let raw = await new Response(res.Body, {}).buffer();
      if (secret) {
        raw = decrypt(secret, raw).toString('utf-8');
      } else {
        raw = raw.toString('utf-8');
      }
      const data = JSON.parse(raw);
      if (data.cachePluginMetadata) {
        this.meta = data.cachePluginMetadata;
        delete data.cachePluginMetadata;
        raw = JSON.stringify(data);
      } else {
        this.meta = {};
      }
      this.data = data;
      return raw;
    } catch (e) {
      if (e.$metadata?.httpStatusCode === 404) {
        log.info('s3: unable to deserialize token cache: not found');
      } else {
        log.warn('s3: unable to deserialize token cache', e);
      }
    }
    return null;
  }

  async beforeCacheAccess(cacheContext) {
    const raw = await this.#loadData();
    if (raw) {
      cacheContext.tokenCache.deserialize(raw);
      return true;
    }
    return false;
  }

  async #saveData() {
    const {
      log, secret, key, bucket,
    } = this;
    try {
      log.debug('s3: write token cache', key);
      const data = this.data || {};
      if (Object.keys(this.meta || {}).length) {
        data.cachePluginMetadata = this.meta;
      }
      let raw = JSON.stringify(data);
      delete data.cachePluginMetadata;
      if (secret) {
        raw = encrypt(secret, Buffer.from(raw, 'utf-8'));
      }
      await this.s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: raw,
        ContentType: secret ? 'application/octet-stream' : 'text/plain',
      }));
      return true;
    } catch (e) {
      log.warn('s3: unable to serialize token cache', e);
    }
    return false;
  }

  async afterCacheAccess(cacheContext) {
    if (cacheContext.cacheHasChanged) {
      if (!this.meta) {
        await this.#loadData();
      }
      this.data = JSON.parse(cacheContext.tokenCache.serialize());
      return this.#saveData();
    }
    return false;
  }

  async getPluginMetadata() {
    if (!this.meta) {
      await this.#loadData();
    }
    return this.meta;
  }

  async setPluginMetadata(meta) {
    if (!this.data) {
      await this.#loadData();
    }
    this.meta = meta || {};
    await this.#saveData();
  }

  get location() {
    return `${this.bucket}/${this.key}`;
  }
}

S3CachePlugin.encrypt = encrypt;
S3CachePlugin.decrypt = decrypt;
