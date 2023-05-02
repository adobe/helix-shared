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
import path from 'path';
import { FSCachePlugin } from './FSCachePlugin.js';

/**
 * aliases
 * @typedef {import("@azure/msal-node").ICachePlugin} ICachePlugin
 * @typedef {import("@azure/msal-node").TokenCacheContext} TokenCacheContext
 */

export class FSCacheManager {
  constructor(opts) {
    this.dirPath = opts.dirPath;
    this.log = opts.log || console;
    this.type = opts.type;
  }

  getCacheFilePath(key) {
    return path.resolve(this.dirPath, `auth-${this.type}-${key}.json`);
  }

  async listCacheKeys() {
    try {
      const files = await fs.readdir(this.dirPath);
      return files
        .filter((name) => (name.startsWith('auth-') && name.endsWith('.json')))
        .map((name) => name.replace(/auth-([a-z0-9]+)-([a-z0-9]+).json/i, '$2'));
    } catch (e) {
      if (e.code === 'ENOENT') {
        return [];
      }
      throw e;
    }
  }

  async hasCache(key) {
    try {
      await fs.lstat(this.getCacheFilePath(key));
      return true;
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
      return false;
    }
  }

  /**
   * @param key
   * @returns {FSCachePlugin}
   */
  async getCache(key) {
    try {
      await fs.lstat(this.dirPath);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
      await fs.mkdir(this.dirPath);
    }
    return new FSCachePlugin({
      log: this.log,
      filePath: this.getCacheFilePath(key),
    });
  }
}
