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
  }

  async deleteCache() {
    try {
      await fs.rm(this.filePath);
    } catch (e) {
      this.log.warn(`error deleting cache: ${e.message}`);
      // ignore
    }
  }

  /**
   * @param {TokenCacheContext} cacheContext
   * @returns {Promise<boolean>} if cache was updated
   */
  async beforeCacheAccess(cacheContext) {
    const { log, filePath } = this;
    try {
      cacheContext.tokenCache.deserialize(await fs.readFile(filePath, 'utf-8'));
      return true;
    } catch (e) {
      if (e.code !== 'ENOENT') {
        // only log warnings if file exists, otherwise ignore
        log.warn('FSCachePlugin: unable to deserialize', e);
      }
    }
    return false;
  }

  /**
   * @param {TokenCacheContext} cacheContext
   * @returns {Promise<boolean>} if cache was updated
   */
  async afterCacheAccess(cacheContext) {
    const { filePath } = this;
    if (cacheContext.cacheHasChanged) {
      // reparse and create a nice formatted JSON
      const tokens = JSON.parse(cacheContext.tokenCache.serialize());
      await fs.writeFile(filePath, JSON.stringify(tokens, null, 2), 'utf-8');
      return true;
    }
    return false;
  }
}
