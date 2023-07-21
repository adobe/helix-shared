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
const caches = new Map();

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
export class MemCachePlugin {
  /**
   * @param {MemCachePluginOptions} opts
   */
  constructor(opts = {}) {
    this.log = opts.log || console;
    this.key = opts.key;
    this.base = opts.base;
    this.caches = opts.caches || caches;
  }

  clear() {
    this.caches.clear();
  }

  async deleteCache() {
    this.log.debug('mem: delete token cache', this.key);
    this.caches.delete(this.key);
    if (this.base) {
      await this.base.deleteCache();
    }
  }

  #getOrCreateCache() {
    let cache = this.caches.get(this.key);
    if (!cache) {
      cache = {};
      this.caches.set(this.key, cache);
    }
    return cache;
  }

  /**
   * @param {TokenCacheContext} cacheContext
   */
  async beforeCacheAccess(cacheContext) {
    try {
      this.log.debug('mem: read token cache', this.key);
      const cache = this.#getOrCreateCache();
      if (cache.data) {
        cacheContext.tokenCache.deserialize(cache.data);
        return true;
      } else if (this.base) {
        this.log.debug('mem: read token cache failed. asking base');
        const ret = await this.base.beforeCacheAccess(cacheContext);
        if (ret) {
          this.log.debug('mem: base updated. remember.');
          cache.data = cacheContext.tokenCache.serialize();
        }
        return ret;
      }
    } catch (e) {
      this.log.warn('mem: unable to deserialize token cache.', e);
    }
    return false;
  }

  /**
   * @param {TokenCacheContext} cacheContext
   */
  async afterCacheAccess(cacheContext) {
    if (cacheContext.cacheHasChanged) {
      this.log.debug('mem: write token cache', this.key);
      const cache = this.#getOrCreateCache();
      cache.data = cacheContext.tokenCache.serialize();
      if (this.base) {
        this.log.debug('mem: write token cache done. telling base', this.key);
        return this.base.afterCacheAccess(cacheContext);
      }
      return true;
    }
    return false;
  }

  get location() {
    return this.base ? this.base.location : this.key;
  }

  async getPluginMetadata() {
    const cache = this.#getOrCreateCache();
    if (!cache.metadata && this.base) {
      cache.metadata = await this.base.getPluginMetadata();
    }
    return cache.metadata;
  }

  async setPluginMetadata(meta) {
    const cache = this.#getOrCreateCache();
    cache.metadata = meta;
    await this.base?.setPluginMetadata(meta);
  }
}
