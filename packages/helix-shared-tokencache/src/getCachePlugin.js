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

/**
 * Returns the S3 cache plugin
 *
 * @returns {ICachePlugin} the cache plugin
 */
export async function getCachePlugin(opts, type) {
  const { log, contentBusId } = opts;

  const derivedOpts = [];
  if (contentBusId) {
    derivedOpts.push({
      prefix: `${contentBusId}/.helix-auth`,
      secret: contentBusId,
    });
  }
  const basePlugin = await S3CacheManager.findCache('content', {
    log,
    prefix: 'default/.helix-auth',
    secret: 'default',
    bucket: 'helix-content-bus',
    type,
  }, ...derivedOpts);

  log.info(`using connected user from ${basePlugin.location}`);

  /** @type MemCachePluginOptions */
  const cacheOpts = {
    log,
    key: basePlugin.key,
    base: basePlugin,
  };
  if (process.env.HELIX_ONEDRIVE_LOCAL_AUTH_CACHE) {
    cacheOpts.caches = new Map();
  }
  return new MemCachePlugin(cacheOpts);
}
