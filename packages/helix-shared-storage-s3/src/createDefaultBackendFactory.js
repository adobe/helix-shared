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
import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { MirroringBackend } from '@adobe/helix-shared-storage';
import { S3Backend } from './S3Backend.js';

/**
 * Builds the default `backendFactory` for `Storage`: S3 as the primary backend, with an
 * optional R2 mirror. Reads the same env vars that `Storage.fromContext()` used to read
 * directly before the storage-backend refactor.
 *
 * Note: the `S3Client`(s) built here are never explicitly disposed — `Storage#close()`
 * no longer owns backend client lifecycles (the `backendFactory` is a plain closure with no
 * disposal hook). This is a minor, accepted regression versus the pre-refactor behavior, which
 * called `S3Client#destroy()` on close.
 *
 * @param {Record<string, string|undefined>} [env] environment variables (e.g. `context.env`)
 * @param {{log?: Console}} [opts]
 * @returns {Function} `(bucketId, opts?) => StorageBackend`
 */
export function createDefaultBackendFactory(env = {}, { log = console } = {}) {
  const {
    HELIX_HTTP_CONNECTION_TIMEOUT: connectionTimeout = 5000,
    HELIX_HTTP_SOCKET_TIMEOUT: socketTimeout = 15000,
    HELIX_HTTP_S3_KEEP_ALIVE: keepAlive,
    HELIX_HTTP_S3_DISABLE_EXPECT_CONTINUE: disableExpectContinueHeader,
    CLOUDFLARE_ACCOUNT_ID: r2AccountId,
    CLOUDFLARE_R2_ACCESS_KEY_ID: r2AccessKeyId,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: r2SecretAccessKey,
    HELIX_STORAGE_DISABLE_R2: disableR2,
    HELIX_STORAGE_MAX_ATTEMPTS: maxAttempts,
  } = env;

  const baseOpts = {
    region: 'us-east-1',
    requestHandler: new NodeHttpHandler({
      httpsAgent: new Agent({
        keepAlive: String(keepAlive) === 'true',
      }),
      connectionTimeout,
      socketTimeout,
    }),
  };
  const parsedMaxAttempts = Number.parseInt(maxAttempts, 10);
  if (!Number.isNaN(parsedMaxAttempts)) {
    baseOpts.maxAttempts = parsedMaxAttempts;
  }
  if (String(disableExpectContinueHeader) === 'true') {
    baseOpts.expectContinueHeader = false;
  }

  log.debug('Creating S3Client without credentials');
  const s3Client = new S3Client(baseOpts);

  let r2Client;
  if (String(disableR2) === 'true') {
    log.info('R2 S3Client disabled.');
  } else {
    log.debug('Creating R2 S3Client');
    r2Client = new S3Client({
      ...baseOpts,
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      region: 'us-east-1', // https://github.com/aws/aws-sdk-js-v3/issues/1845#issuecomment-754832210
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    });
  }

  return (bucketId, { disableR2: disableR2ForBucket = false } = {}) => {
    const s3Backend = new S3Backend({
      client: s3Client, name: 'S3', bucketName: bucketId, log,
    });
    if (!r2Client || disableR2ForBucket) {
      return s3Backend;
    }
    const r2Backend = new S3Backend({
      client: r2Client, name: 'R2', bucketName: bucketId, log,
    });
    return new MirroringBackend({ primary: s3Backend, secondaries: [r2Backend], log });
  };
}
