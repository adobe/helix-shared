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

import { Bucket } from './Bucket.js';

/**
 * @typedef {import('./storage.d').HelixStorage} HelixStorageType
 * @typedef {import('./storage.d').HelixStorageOptions} HelixStorageOptions
 * @typedef {import('./storage.d').HelixStorageContext} HelixStorageContext
 * @typedef {import('./storage.d').BucketMap} BucketMap
 * @typedef {import('./StorageBackend.d').StorageBackend} StorageBackend
 */

const BUCKET_KEYS = ['config', 'code', 'content', 'media', 'source'];

/**
 * Parses the `HELIX_BUCKET_NAMES` env var into a {@link BucketMap}. When `bucketNames`
 * is falsy, returns the default `helix-<key>-bus` mapping for each well-known bus.
 *
 * @param {string} [bucketNames] JSON-encoded bus-key -> bucket-name map
 * @returns {BucketMap}
 */
export function parseBucketNames(bucketNames) {
  if (!bucketNames) {
    return Object.fromEntries(BUCKET_KEYS.map((key) => [key, `helix-${key}-bus`]));
  }
  return JSON.parse(bucketNames);
}

export { resolveMetadataForCopy } from './Bucket.js';

/**
 * The Helix Storage provides a factory for simplified bucket operations against a pluggable
 * storage backend family (e.g. S3+R2, Azure Blob, ...). A single `HelixStorage` instance is
 * configured with one `backendFactory`, used to resolve every bucket it hands out.
 *
 * @implements {HelixStorageType}
 */
export class HelixStorage {
  /**
   * Get (and lazily construct + cache) a {@link HelixStorage} for a Helix function
   * `context`. Caches the resulting instance on `context.attributes.storage` so repeat calls
   * within the same invocation share it. Uses `new this(...)` so that a subclass (e.g.
   * `HelixStorageS3` from `@adobe/helix-shared-storage-s3`) calling `super.fromContext(...)`
   * gets an instance of itself, not of the base `HelixStorage`.
   *
   * @param {HelixStorageContext} context
   * @param {Partial<HelixStorageOptions>} [opts]
   * @returns {HelixStorage}
   */
  static fromContext(context, opts = {}) {
    if (!context.attributes.storage) {
      const { HELIX_BUCKET_NAMES: bucketNames, ...rest } = context.env;
      context.attributes.storage = new this({
        bucketNames,
        log: context.log,
        ...rest,
        ...opts,
      });
    }
    return context.attributes.storage;
  }

  /**
   * Create a storage instance.
   *
   * @param {HelixStorageOptions} [opts]
   */
  constructor(opts = {}) {
    const { bucketNames, log = console, backendFactory } = opts;
    this._bucketMap = parseBucketNames(bucketNames);
    this._log = log;
    this._backendFactory = backendFactory;
    this._closed = false;
  }

  /**
   * Create a {@link Bucket} for the given bucket id, resolved via the configured
   * `backendFactory`. `opts` is an opaque bag forwarded verbatim to the `backendFactory` —
   * core does not interpret it; individual backend packages define whichever options they
   * support (e.g. `@adobe/helix-shared-storage-s3`'s `{ disableR2 }`).
   *
   * @param {string} bucketId bucket name
   * @param {Record<string, unknown>} [opts] backend-specific options, passed through as-is
   * @returns {Bucket}
   * @throws if the storage has been closed, if `bucketId` is empty, or if no
   *  `backendFactory` was configured
   */
  bucket(bucketId, opts = {}) {
    if (this._closed) {
      throw new Error('storage already closed.');
    }
    if (!bucketId) {
      throw new Error('bucketId is required.');
    }
    if (!this._backendFactory) {
      throw new Error(
        'No backendFactory configured. Install @adobe/helix-shared-storage-s3 (or another '
        + 'backend package) and pass its factory as `backendFactory`, e.g. '
        + 'new HelixStorage({ backendFactory: createDefaultBackendFactory(env) }).',
      );
    }
    return new Bucket({
      backend: this._backendFactory(bucketId, opts),
      log: this._log,
    });
  }

  /**
   * Bucket for the configured `content` bus.
   *
   * @param {Record<string, unknown>} [opts]
   * @returns {Bucket}
   */
  contentBus(opts = {}) {
    return this.bucket(this._bucketMap.content, opts);
  }

  /**
   * Bucket for the configured `code` bus.
   *
   * @param {Record<string, unknown>} [opts]
   * @returns {Bucket}
   */
  codeBus(opts = {}) {
    return this.bucket(this._bucketMap.code, opts);
  }

  /**
   * Bucket for the configured `media` bus.
   *
   * @param {Record<string, unknown>} [opts]
   * @returns {Bucket}
   */
  mediaBus(opts = {}) {
    return this.bucket(this._bucketMap.media, opts);
  }

  /**
   * Bucket for the configured `source` bus. Mirroring defaults to disabled since the source
   * bus is typically not mirrored; pass `{ disableR2: false }` to override with the default
   * S3/R2 backend.
   *
   * @param {Record<string, unknown>} [opts]
   * @returns {Bucket}
   */
  sourceBus(opts = {}) {
    return this.bucket(this._bucketMap.source, { disableR2: true, ...opts });
  }

  /**
   * Bucket for the configured `config` bus.
   *
   * @param {Record<string, unknown>} [opts]
   * @returns {Bucket}
   */
  configBus(opts = {}) {
    return this.bucket(this._bucketMap.config, opts);
  }

  /**
   * Close this storage, rendering this instance unusable; subsequent calls to
   * {@link HelixStorage#bucket} throw. The configured `backendFactory` owns the lifecycle of
   * any native clients it created.
   */
  close() {
    this._closed = true;
  }
}
