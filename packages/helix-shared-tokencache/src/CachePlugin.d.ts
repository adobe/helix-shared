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
import { ICachePlugin, TokenCacheContext } from  '@azure/msal-node';

export declare interface CachePlugin extends ICachePlugin {

  afterCacheAccess(tokenCacheContext: TokenCacheContext): Promise<boolean>;

  beforeCacheAccess(tokenCacheContext: TokenCacheContext): Promise<boolean>;

  deleteCache(): Promise<void>;

  location: string;

  /**
   * gets plugin metadata.
   * @returns the plugin metadata
   */
  getPluginMetadata(): Promise<object>;

  /**
   * sets the plugin metadata.
   * @param meta
   */
  setPluginMetadata(meta): Promise<void>;
}
