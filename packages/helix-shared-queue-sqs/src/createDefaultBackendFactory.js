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

import { Agent } from 'node:https';
import { SQSClient } from '@aws-sdk/client-sqs';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { SqsBackend } from './SqsBackend.js';

/**
 * @typedef {Object} CreateDefaultBackendFactoryOptions
 * @property {Console} [log]
 * @property {import('@adobe/helix-shared-storage').Bucket} [bucket] default spill bucket for
 *  every queue this factory hands out; see {@link SqsBackend}. Can be overridden per queue via
 *  `{bucket}` passed to `QueueService#queue()`.
 * @property {string} [swapPrefix] default spill key prefix; see {@link SqsBackend}. Can be
 *  overridden per queue via `{swapPrefix}` passed to `QueueService#queue()`.
 */

/**
 * @typedef {Object} BackendFactoryOpts
 * @property {string} [region]
 * @property {number} connectionTimeout
 * @property {number} socketTimeout
 * @property {boolean} keepAlive
 * @property {number} [maxAttempts]
 */

/**
 * Parses the env vars consumed by `createBackendFactory()` into a plain opts object, applying
 * the same defaults and type coercions (booleans/numbers arrive as strings in `env`).
 *
 * @param {Record<string, string|undefined>} [env] environment variables (e.g. `context.env`)
 * @returns {BackendFactoryOpts}
 */
function parseBackendFactoryEnvOpts(env = {}) {
  const {
    AWS_REGION: region,
    HELIX_HTTP_CONNECTION_TIMEOUT: connectionTimeout = 5000,
    HELIX_HTTP_SOCKET_TIMEOUT: socketTimeout = 15000,
    HELIX_HTTP_SQS_KEEP_ALIVE: keepAlive,
    HELIX_QUEUE_MAX_ATTEMPTS: maxAttempts,
  } = env;

  const parsedMaxAttempts = Number.parseInt(maxAttempts, 10);

  return {
    region,
    connectionTimeout,
    socketTimeout,
    keepAlive: String(keepAlive) === 'true',
    maxAttempts: Number.isNaN(parsedMaxAttempts) ? undefined : parsedMaxAttempts,
  };
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
export function createBackendFactory({
  region, connectionTimeout, socketTimeout, keepAlive, maxAttempts,
}, { log = console, bucket, swapPrefix } = {}) {
  const clientOpts = {
    requestHandler: new NodeHttpHandler({
      httpsAgent: new Agent({ keepAlive }),
      connectionTimeout,
      socketTimeout,
    }),
  };
  if (region !== undefined) {
    clientOpts.region = region;
  }
  if (maxAttempts !== undefined) {
    clientOpts.maxAttempts = maxAttempts;
  }

  log.debug('Creating SQSClient');
  const client = new SQSClient(clientOpts);

  return (queueName, opts = {}) => new SqsBackend({
    client,
    queueName,
    log,
    bucket: opts.bucket ?? bucket,
    swapPrefix: opts.swapPrefix ?? swapPrefix,
  });
}

/**
 * Builds the default `backendFactory` for `QueueService`: a single `SqsBackend` per queue,
 * sharing one `SQSClient`.
 *
 * @param {Record<string, string|undefined>} [env] environment variables (e.g. `context.env`)
 * @param {CreateDefaultBackendFactoryOptions} [opts]
 * @returns {function(string, {bucket?: import('@adobe/helix-shared-storage').Bucket,
 *   swapPrefix?: string}=): import('@adobe/helix-shared-queue').QueueBackend}
 */
export function createDefaultBackendFactory(env = {}, opts = {}) {
  return createBackendFactory(parseBackendFactoryEnvOpts(env), opts);
}
