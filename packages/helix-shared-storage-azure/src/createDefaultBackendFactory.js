/*
 * Copyright 2026 Adobe. All rights reserved.
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
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { AzureBackend } from './AzureBackend.js';

/**
 * @typedef {Object} CreateDefaultBackendFactoryOptions
 * @property {Console} [log]
 */

/**
 * @typedef {Object} BackendFactoryOpts
 * @property {string} [connectionString]
 * @property {string} [accountName]
 * @property {string} [accountKey]
 */

/**
 * Parses the env vars consumed by `createBackendFactory()` into a plain opts object.
 *
 * @param {Record<string, string|undefined>} [env] environment variables (e.g. `context.env`)
 * @returns {BackendFactoryOpts}
 */
function parseBackendFactoryEnvOpts(env = {}) {
  const {
    HLX_AZURE_STORAGE_CONNECTION_STRING: connectionString,
    HLX_AZURE_STORAGE_ACCOUNT_NAME: accountName,
    HLX_AZURE_STORAGE_ACCOUNT_KEY: accountKey,
  } = env;

  return { connectionString, accountName, accountKey };
}

/**
 * Builds the `backendFactory` for `Storage`: Azure Blob Storage as the backend, from an
 * already-parsed {@link BackendFactoryOpts}. Use this directly when you need to override
 * individual values; use `createDefaultBackendFactory()` to build straight from `env`.
 *
 * A connection string, when given, takes precedence over account name/key credentials.
 *
 * @param {BackendFactoryOpts} opts
 * @param {CreateDefaultBackendFactoryOptions} [factoryOpts]
 * @returns {function(string): import('@adobe/helix-shared-storage').StorageBackend}
 */
export function createBackendFactory({
  connectionString,
  accountName,
  accountKey,
}, { log = console } = {}) {
  let blobServiceClient;
  if (connectionString) {
    log.debug('Creating BlobServiceClient from connection string');
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  } else {
    log.debug('Creating BlobServiceClient from account name/key');
    blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      new StorageSharedKeyCredential(accountName, accountKey),
    );
  }

  return (bucketId) => new AzureBackend({
    client: blobServiceClient.getContainerClient(bucketId),
    name: 'Azure',
    bucketName: bucketId,
    log,
  });
}

/**
 * Builds the default `backendFactory` for `Storage`: Azure Blob Storage, authenticated from
 * `env`, preferring `HLX_AZURE_STORAGE_CONNECTION_STRING` over
 * `HLX_AZURE_STORAGE_ACCOUNT_NAME`/`HLX_AZURE_STORAGE_ACCOUNT_KEY` when both are set.
 *
 * @param {Record<string, string|undefined>} [env] environment variables (e.g. `context.env`)
 * @param {CreateDefaultBackendFactoryOptions} [opts]
 * @returns {function(string): import('@adobe/helix-shared-storage').StorageBackend}
 */
export function createDefaultBackendFactory(env = {}, opts = {}) {
  return createBackendFactory(parseBackendFactoryEnvOpts(env), opts);
}
