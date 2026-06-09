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

/**
 * Determine whether a onedrive auth token is empty. @azure/msal-node tries
 * to store an empty auth token in its initial `getAccounts` call, when there
 * is no match for that project in our storage.
 */
export function isAuthTokenEmpty(data) {
  const { Account = {}, AccessToken = {} } = data;
  return Object.keys(Account).length === 0 && Object.keys(AccessToken).length === 0;
}
