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
 * Information about a single entry — file or folder — returned by
 * {@link Bucket#list} or {@link Bucket#browse}.
 *
 * When the entry represents a common prefix (folder), `isFolder` is `true`
 * and `lastModified`/`contentLength`/`contentType` are absent.
 *
 * @typedef {Object} ObjectInfo
 * @property {string} key absolute object key. For folders, ends with `/`.
 * @property {string} name basename of the entry — the last path segment, with any trailing
 *  `/` stripped. E.g. `2024` for a folder `/blog/2024/`, `post.md` for an object key
 *  `/blog/post.md`.
 * @property {boolean} isFolder `true` for folders; `false` for object keys (files).
 * @property {Date} [lastModified] last-modified timestamp. Files only.
 * @property {number} [contentLength] object size in bytes. Files only.
 * @property {?string} [contentType] content type guessed from the key extension. Files only.
 */

/**
 * Filter callback used by {@link Bucket#copyDeep}.
 *
 * @typedef {function(ObjectInfo): boolean} ObjectFilter
 */

/**
 * @typedef {Object} CopyOptions
 * @property {Object.<string, string>} [renameMetadata] metadata keys to rename, in the form
 *  `{ [from]: to }`. Removes the existing `from` metadata property from the copied object.
 *  Use `addMetadata` to keep the `from` property as well.
 * @property {Object.<string, string>} [addMetadata] metadata to merge with existing metadata.
 *  Properties are applied after `renameMetadata`.
 * @property {Object.<string, *>} [copyOpts] additional, backend-native fields to merge into
 *  the underlying copy call (e.g. AWS's `CacheControl`, `ContentType`, `Tagging`, ...).
 */

/**
 * @typedef {Object} BrowseOptions
 * @property {string} [continuationToken] continuation token returned by a previous
 *  {@link Bucket#browse} call. Pass it back unchanged to fetch the next page; omit to start
 *  from the beginning of the listing.
 * @property {number} [maxItems] maximum number of entries to return in this page. Defaults to
 *  the backend's own default when omitted.
 */

/**
 * @typedef {Object} ListOptions
 * @property {boolean} [shallow] whether to list shallow, i.e. not recursive (uses `/` as
 *  delimiter). Default `false`.
 * @property {number} [maxItems] maximum number of items to return across all pages. Default
 *  unlimited.
 */

/**
 * Common return shape for {@link Bucket#list} and {@link Bucket#browse}.
 *
 * `continuationToken` is `undefined` for {@link Bucket#list} (which always
 * auto-paginates) and for an exhausted {@link Bucket#browse} call; it is set
 * when {@link Bucket#browse} hits a truncated page.
 *
 * @typedef {Object} ListResult
 * @property {string} prefix the sanitized prefix that was actually queried (always ends with
 *  `/`, or is `''` when the whole bucket was listed)
 * @property {ObjectInfo[]} objects the page of entries (files and, for shallow listings,
 *  folders)
 * @property {string} [continuationToken] continuation token to pass back to
 *  {@link Bucket#browse} for the next page
 */

/**
 * Aggregated result returned by {@link Bucket#remove} when invoked with an array of keys.
 *
 * @typedef {Object} BulkDeleteResult
 * @property {Array<*>} Deleted
 * @property {Array<*>} Errors
 */

/**
 * Options for {@link Storage}.
 *
 * @typedef {Object} StorageOptions
 * @property {string} [bucketNames] JSON string mapping bus keys (`config`, `code`, `content`,
 *  `media`, `source`) to their actual bucket names. If omitted, defaults to `helix-<key>-bus`.
 * @property {Console} [log] logger; defaults to `console`.
 * @property {function(string, Object.<string, *>):
 *   import('./AbstractStorageBackend.js').StorageBackend} [backendFactory]
 *  factory used to resolve a `StorageBackend` for a given bucket id. Backend packages (e.g.
 *  `@adobe/helix-shared-storage-s3`) provide this, typically via a convenience `Storage`
 *  subclass overriding `fromContext`. The second argument is an opaque bag forwarded verbatim
 *  from {@link Storage#bucket} — core does not interpret it; individual backend packages
 *  define whichever options they support (e.g. `@adobe/helix-shared-storage-s3`'s
 *  `{ disableR2 }`).
 */

/**
 * Helix function context shape used by {@link Storage.fromContext}. The storage instance is
 * cached on `context.attributes.storage`; configuration is read from `context.env`.
 *
 * @typedef {Object} StorageContext
 * @property {Object.<string, string|undefined>} env
 * @property {Console} log
 * @property {Object.<string, *>} attributes
 */

/**
 * Mapping from bus key to bucket name as parsed by {@link parseBucketNames}.
 *
 * @typedef {Object} BucketMap
 * @property {string} config
 * @property {string} code
 * @property {string} content
 * @property {string} media
 * @property {string} source
 */

const BUCKET_KEYS = ['config', 'code', 'content', 'media', 'source'];

/**
 * Parses the `HELIX_BUCKET_NAMES` env var into a {@link BucketMap}. When
 * `bucketNames` is falsy, returns the default `helix-<key>-bus` mapping for each well-known
 * bus.
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
 * The Storage provides a factory for simplified bucket operations against a pluggable
 * storage backend family (e.g. S3+R2, Azure Blob, ...). A single `Storage` instance is
 * configured with one `backendFactory`, used to resolve every bucket it hands out.
 */
export class Storage {
  /**
   * Get (and lazily construct + cache) a {@link Storage} for a Helix function
   * `context`. Caches the resulting instance on `context.attributes.storage` so repeat calls
   * within the same invocation share it. Uses `new this(...)` so that a subclass (e.g.
   * `StorageS3` from `@adobe/helix-shared-storage-s3`) calling `super.fromContext(...)`
   * gets an instance of itself, not of the base `Storage`.
   *
   * @param {StorageContext} context
   * @param {Partial<StorageOptions>} [opts]
   * @returns {Storage}
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
   * @param {StorageOptions} [opts]
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
        + 'new Storage({ backendFactory: createDefaultBackendFactory(env) }).',
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
   * {@link Storage#bucket} throw. The configured `backendFactory` owns the lifecycle of
   * any native clients it created.
   */
  close() {
    this._closed = true;
  }
}
