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

  async beforeCacheAccess(cacheContext) {
    const {
      log, secret, key, bucket,
    } = this;
    try {
      log.debug('s3: read token cache', key);
      const res = await this.s3.send(new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }));
      let data = await new Response(res.Body, {}).buffer();
      if (secret) {
        data = decrypt(secret, data).toString('utf-8');
      } else {
        data = data.toString('utf-8');
      }
      cacheContext.tokenCache.deserialize(data);
      return true;
    } catch (e) {
      if (e.$metadata?.httpStatusCode === 404) {
        log.info('s3: unable to deserialize token cache: not found');
      } else {
        log.warn('s3: unable to deserialize token cache', e);
      }
    }
    return false;
  }

  async afterCacheAccess(cacheContext) {
    if (cacheContext.cacheHasChanged) {
      const {
        log, secret, key, bucket,
      } = this;
      try {
        log.debug('s3: write token cache', key);
        let data = cacheContext.tokenCache.serialize();
        if (secret) {
          data = encrypt(secret, Buffer.from(data, 'utf-8'));
        }
        await this.s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: data,
          ContentType: secret ? 'application/octet-stream' : 'text/plain',
        }));
        return true;
      } catch (e) {
        log.warn('s3: unable to serialize token cache', e);
      }
    }
    return false;
  }
}

S3CachePlugin.encrypt = encrypt;
S3CachePlugin.decrypt = decrypt;
