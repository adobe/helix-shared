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

/**
 * @typedef {import("@azure/msal-node").ISerializableTokenCache} ISerializableTokenCache
 *
 * @extends TokenCacheContext
 */
export class MockTokenCacheContext {
  constructor(opts = {}) {
    this.cacheHasChanged = opts.cacheHasChanged;
    this.data = opts.data || { Account: {}, AccessToken: {} };

    this.tokenCache = {
      serialize: () => JSON.stringify(this.data),
      deserialize: (value) => {
        this.data = JSON.parse(value);
      },
    };
  }

  get token() {
    return this.data.AccessToken?.['foo-id']?.secret ?? '';
  }
}
