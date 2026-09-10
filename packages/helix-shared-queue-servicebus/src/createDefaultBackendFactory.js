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

import { ServiceBusClient } from '@azure/service-bus';
import { ServiceBusBackend } from './ServiceBusBackend.js';

/**
 * @typedef {Object} CreateDefaultBackendFactoryOptions
 * @property {Console} [log]
 * @property {import('@adobe/helix-shared-storage').Bucket} [bucket] default spill bucket for
 *  every queue this factory hands out; see {@link ServiceBusBackend}. Can be overridden per
 *  queue via `{bucket}` passed to `QueueService#queue()`.
 * @property {string} [swapPrefix] default spill key prefix; see {@link ServiceBusBackend}. Can
 *  be overridden per queue via `{swapPrefix}` passed to `QueueService#queue()`.
 */

/**
 * @typedef {Object} BackendFactoryOpts
 * @property {string} connectionString
 */

/**
 * Parses the env vars consumed by `createBackendFactory()` into a plain opts object.
 *
 * Authentication is connection-string only for now — unlike `@adobe/helix-shared-storage-s3`'s
 * R2 credentials or `@adobe/helix-shared-storage-azure`'s account name/key, there is no
 * managed-identity (`@azure/identity`) support yet; see issue #1271 for context.
 *
 * @param {Record<string, string|undefined>} [env] environment variables (e.g. `context.env`)
 * @returns {BackendFactoryOpts}
 */
function parseBackendFactoryEnvOpts(env = {}) {
  const { HLX_AZURE_SERVICE_BUS_CONNECTION_STRING: connectionString } = env;
  return { connectionString };
}

/**
 * Builds the `backendFactory` for `QueueService`, from an already-parsed
 * {@link BackendFactoryOpts}. Use this directly when you need to override individual values;
 * use `createDefaultBackendFactory()` to build straight from `env`.
 *
 * @param {BackendFactoryOpts} opts
 * @param {CreateDefaultBackendFactoryOptions} [factoryOpts]
 * @returns {function(string, {bucket?: import('@adobe/helix-shared-storage').Bucket,
 *   swapPrefix?: string}=): import('@adobe/helix-shared-queue').QueueBackend}
 */
export function createBackendFactory({ connectionString }, {
  log = console, bucket, swapPrefix,
} = {}) {
  log.debug('Creating ServiceBusClient from connection string');
  const client = new ServiceBusClient(connectionString);

  return (queueName, opts = {}) => new ServiceBusBackend({
    sender: client.createSender(queueName),
    receiver: client.createReceiver(queueName),
    queueName,
    log,
    bucket: opts.bucket ?? bucket,
    swapPrefix: opts.swapPrefix ?? swapPrefix,
  });
}

/**
 * Builds the default `backendFactory` for `QueueService`: a single `ServiceBusBackend` per
 * queue, sharing one `ServiceBusClient`.
 *
 * @param {Record<string, string|undefined>} [env] environment variables (e.g. `context.env`)
 * @param {CreateDefaultBackendFactoryOptions} [opts]
 * @returns {function(string, {bucket?: import('@adobe/helix-shared-storage').Bucket,
 *   swapPrefix?: string}=): import('@adobe/helix-shared-queue').QueueBackend}
 */
export function createDefaultBackendFactory(env = {}, opts = {}) {
  return createBackendFactory(parseBackendFactoryEnvOpts(env), opts);
}
