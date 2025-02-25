/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-param-reassign */

import { MemCachePlugin } from './MemCachePlugin.js';
import { S3CacheManager } from './S3CacheManager.js';

const BUCKET_CONTENT_BUS = process.env.CONTENT_BUS_BUCKET || 'helix-content-bus';

const BUCKET_CODE_BUS = process.env.CODE_BUS_BUCKET || 'helix-code-bus';

/**
 * @typedef GetCachePluginOptions
 * @property {Console} log logger
 * @property {string} contentBusId content-bus id
 * @property {string} owner  code owner
 * @property {string} [user = "content"] the user for which the cache is retrieved
 * @property {boolean} [readOnly = false] don't write to underlying persistence layer
 * @property {boolean} [contentBucket = 'helix-content-bus'] name of the content-bus bucket
 * @property {boolean} [codeBucket = 'helix-code-bus'] name of the code-bus bucket
 */

/**
 * Returns the S3 cache plugin by using {@link #S3CacheManager} to find the token cache based on
 * the provided options. The token cache is searched as follows:
 *
 * 1. check in `helix-code-bus/${opts.owner}/.helix-auth`
 * 2. check in `helix-content-bus/${opts.contentBusId}/.helix-auth`
 * 3. check in `helix-content-bus/default/.helix-auth`
 *
 * @param {GetCachePluginOptions} opts
 * @param {string} type The plugin type: "onedrive" or "google"
 * @returns {ICachePlugin} the cache plugin
 */
export async function getCachePlugin(opts, type) {
  const {
    log,
    contentBusId,
    owner,
    user = 'content',
    readOnly = false,
    contentBucket = BUCKET_CONTENT_BUS,
    codeBucket = BUCKET_CODE_BUS,
  } = opts;

  const derivedOpts = [];
  if (contentBusId) {
    derivedOpts.push({
      prefix: `${contentBusId}/.helix-auth`,
      secret: contentBusId,
      bucket: contentBucket,
    });
  }
  if (owner) {
    derivedOpts.push({
      prefix: `${owner}/.helix-auth`,
      secret: owner,
      bucket: codeBucket,
    });
  }
  const basePlugin = await S3CacheManager.findCache(user, {
    log,
    prefix: 'default/.helix-auth',
    secret: 'default',
    bucket: contentBucket,
    type,
    readOnly,
  }, ...derivedOpts);

  log.info(`using connected user from ${basePlugin.location}`);

  /** @type MemCachePluginOptions */
  const cacheOpts = {
    log,
    key: basePlugin.key,
    base: basePlugin,
    type,
  };
  if (process.env.HELIX_ONEDRIVE_LOCAL_AUTH_CACHE) {
    cacheOpts.caches = opts.caches ?? new Map();
  }
  return new MemCachePlugin(cacheOpts);
}
