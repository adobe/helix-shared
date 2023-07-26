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
import fs from 'fs/promises';

/**
 * aliases
 * @typedef {import("@azure/msal-node").ICachePlugin} ICachePlugin
 * @typedef {import("@azure/msal-node").TokenCacheContext} TokenCacheContext
 */

/**
 * Cache plugin for MSAL
 * @param {FSCachePluginOptions} opts
 * @class FSCachePlugin
 * @implements ICachePlugin
 */
export class FSCachePlugin {
  constructor(opts) {
    this.filePath = opts.filePath;
    this.log = opts.log || console;
    this.meta = null;
    this.data = null;
  }

  async deleteCache() {
    this.data = null;
    this.meta = null;
    try {
      await fs.rm(this.filePath);
    } catch (e) {
      this.log.warn(`error deleting cache: ${e.message}`);
      // ignore
    }
  }

  async #loadData() {
    const { log, filePath } = this;
    try {
      let raw = await fs.readFile(filePath, 'utf-8');
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
      if (e.code !== 'ENOENT') {
        // only log warnings if file exists, otherwise ignore
        log.warn('FSCachePlugin: unable to deserialize', e);
      }
    }
    this.data = null;
    return null;
  }

  async #saveData() {
    const { filePath } = this;
    const data = this.data || {};
    if (Object.keys(this.meta || {}).length) {
      data.cachePluginMetadata = this.meta;
    }
    const raw = JSON.stringify(data, null, 2);
    delete data.cachePluginMetadata;
    await fs.writeFile(filePath, raw, 'utf-8');
  }

  /**
   * @param {TokenCacheContext} cacheContext
   * @returns {Promise<boolean>} if cache was updated
   */
  async beforeCacheAccess(cacheContext) {
    const raw = await this.#loadData();
    if (raw) {
      cacheContext.tokenCache.deserialize(raw);
      return true;
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

  /**
   * @param {TokenCacheContext} cacheContext
   * @returns {Promise<boolean>} if cache was updated
   */
  async afterCacheAccess(cacheContext) {
    if (cacheContext.cacheHasChanged) {
      if (!this.meta) {
        await this.#loadData();
      }
      this.data = JSON.parse(cacheContext.tokenCache.serialize());
      await this.#saveData();
      return true;
    }
    return false;
  }

  get location() {
    return this.filePath;
  }
}
