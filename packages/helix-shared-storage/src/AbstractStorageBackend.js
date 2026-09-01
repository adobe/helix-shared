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

/**
 * Common, backend-agnostic object metadata fields (lowerCamelCase). Every {@link StorageBackend}
 * method that returns object metadata returns (at least) these fields, plus a spread of
 * whatever native/raw fields the backend's underlying SDK response carries (e.g. AWS's
 * PascalCase `ETag`/`VersionId`/...). Since the common fields are lowerCamelCase and AWS's
 * are PascalCase, neither clobbers the other.
 *
 * @typedef {Object} CommonObjectMeta
 * @property {string} [etag]
 * @property {string} [versionId]
 * @property {number} [contentLength]
 * @property {string} [contentType]
 * @property {string} [contentEncoding]
 * @property {string} [cacheControl]
 * @property {string} [contentDisposition]
 * @property {string|Date} [expires]
 * @property {string|Date} [lastModified]
 * @property {Object.<string, string>} [metadata]
 *
 * Plus any other raw, backend-native fields the underlying SDK response carries.
 */

/**
 * @typedef {Object} PutOptions
 * @property {string} [contentType]
 * @property {string} [contentEncoding]
 * @property {string} [cacheControl]
 * @property {string} [contentDisposition]
 * @property {string} [expires]
 * @property {Object.<string, string>} [metadata]
 */

/**
 * Options passed from {@link Bucket} to {@link StorageBackend#copy}. This is the
 * backend-level shape (already resolved from a source HEAD when needed) — distinct from the
 * public `CopyOptions` in `storage.js`, which is the `Bucket#copy`-facing shape with
 * `renameMetadata`/`addMetadata`. See {@link ./storage.js~CopyOptions} for that shape.
 *
 * @typedef {Object} CopyOptions
 * @property {string} [contentType]
 * @property {string} [contentEncoding]
 * @property {string} [cacheControl]
 * @property {string} [contentDisposition]
 * @property {string|Date} [expires]
 * @property {Object.<string, string>} [metadata]
 * @property {'COPY'|'REPLACE'} [metadataDirective]
 * @property {Object.<string, *>} [copyOpts] additional backend-native fields to merge into
 *  the underlying copy call, verbatim
 */

/**
 * @typedef {Object} RemoveOptions
 * @property {string} [sourceInfo]
 * @property {boolean} [stopOnError]
 */

/**
 * Raw, backend-native result of removing a single key.
 *
 * @typedef {Object.<string, *>} RemoveResult
 */

/**
 * Aggregated result of removing an array of keys.
 *
 * @typedef {Object} BulkRemoveResult
 * @property {Array<*>} Deleted
 * @property {Array<*>} Errors
 */

/**
 * @typedef {Object} BackendListOptions
 * @property {boolean} [shallow]
 * @property {number} [maxItems]
 */

/**
 * @typedef {RemoveResult|BulkRemoveResult} RemoveOutcome
 */

/**
 * The pluggable storage backend interface. A `StorageBackend` wraps a single bucket/container
 * against a single cloud storage family (S3, Azure Blob, ...). `Storage` is configured with a
 * `backendFactory` that produces one `StorageBackend` per bucket id; {@link Bucket} is a thin,
 * backend-agnostic facade over it.
 *
 * Implementors need to provide the 7 mandatory primitives below (`putMeta` is mandatory
 * rather than a generic default because a correct, efficient implementation is inherently
 * backend-specific — e.g. S3's self-copy trick vs. Azure's native `setMetadata`); `metadata`,
 * `listFolders`, and `browse` have generic default implementations in
 * {@link AbstractStorageBackend}, overridable for efficiency (e.g. Azure can implement
 * `listFolders` via `listBlobsByHierarchy` instead of the generic list+filter fallback).
 *
 * @typedef {Object} StorageBackend
 * @property {string} name backend family tag used for error tagging when mirrored, e.g.
 *  `'S3'`, `'R2'`, `'Azure'`
 * @property {string} bucketName the bucket/container name this backend instance is bound to
 * @property {*} [client] the backend's native client, if it has a meaningful one to expose
 *  (e.g. an `S3Client`)
 * @property {function(string, Object.<string, *>=): Promise<Buffer?>} get fetch an object's
 *  body; `meta` (if given) receives the object's metadata/system headers
 * @property {function(string, Object.<string, *>=): Promise<?CommonObjectMeta>} head issue a
 *  HEAD on the object; returns `null` if not found
 * @property {function(string): Promise<Object.<string, string>|undefined>} metadata return an
 *  object's user metadata; generic default: `(await head(key))?.metadata`
 * @property {function(string, (Buffer|string), PutOptions=): Promise<CommonObjectMeta>} put
 *  store an object's contents along with metadata/system headers
 * @property {function(string, Object.<string, string>, Object.<string, *>=): Promise<*>} putMeta
 *  replace an object's user metadata. `opts` is raw, backend-native fields merged into the
 *  underlying call (matching `Bucket#putMeta`'s own raw passthrough) — mandatory, since a
 *  correct, efficient implementation is inherently backend-specific
 * @property {function(string, string, CopyOptions=): Promise<CommonObjectMeta>} copy copy an
 *  object within the same bucket; already-resolved `opts` (system headers + metadata) are
 *  provided by {@link Bucket} when the copy needs to preserve/rewrite metadata; backends
 *  should normalize a missing source into an error with `status: 404`
 * @property {function((string|string[]), RemoveOptions=): Promise<RemoveOutcome>} remove
 *  remove one or more objects; when passed an array, the backend owns any batching/chunking
 *  required by its own service limits
 * @property {function(string, BackendListOptions=): Promise<ListResult>} list auto-paginated
 *  listing of entries below `prefix`; unlike `browse`, pages through the entire result (up to
 *  `opts.maxItems`) before resolving
 * @property {function(string): Promise<string[]>} listFolders convenience wrapper returning
 *  only folder basenames directly below `prefix`; generic default:
 *  `(await list(prefix, {shallow: true})).objects.filter(o => o.isFolder).map(o => o.name)`
 * @property {function(string, BrowseOptions=): Promise<ListResult>} browse single-page,
 *  always-shallow listing for paginated UI browsing; generic default sacrifices true
 *  single-page pagination (fetches up to `maxItems` in one shot with no continuation token) —
 *  backends with native cursor support (S3) should override this
 */

/* eslint-disable class-methods-use-this -- mandatory-primitive stubs intentionally ignore `this` */
/**
 * Convenience base class for {@link StorageBackend} implementations. Subclasses only need to
 * implement the 7 mandatory primitives (`get`, `head`, `put`, `copy`, `remove`, `list`,
 * `putMeta`) to get all 10 interface methods for free; `metadata`/`listFolders`/`browse` have
 * generic default bodies here, in terms of the mandatory primitives, overridable for
 * efficiency.
 *
 * @implements {StorageBackend}
 */
export class AbstractStorageBackend {
  async get() {
    throw new Error('get() not implemented');
  }

  async head() {
    throw new Error('head() not implemented');
  }

  async put() {
    throw new Error('put() not implemented');
  }

  async putMeta() {
    throw new Error('putMeta() not implemented');
  }

  async copy() {
    throw new Error('copy() not implemented');
  }

  async remove() {
    throw new Error('remove() not implemented');
  }

  async list() {
    throw new Error('list() not implemented');
  }

  /**
   * Generic default: derives metadata from {@link StorageBackend#head}.
   *
   * @param {string} key
   * @returns {Promise<Object.<string, string>|undefined>}
   */
  async metadata(key) {
    const head = await this.head(key);
    return head?.metadata;
  }

  /**
   * Generic default: `list(prefix, {shallow: true})`, filtered to folder entries.
   *
   * @param {string} prefix
   * @returns {Promise<string[]>}
   */
  async listFolders(prefix) {
    const { objects } = await this.list(prefix, { shallow: true });
    return objects
      .filter((o) => o.isFolder)
      .map((o) => o.name);
  }

  /**
   * Generic default: fetches up to `opts.maxItems` entries in a single `list()` call and
   * clears the continuation token. This sacrifices true single-page pagination — backends
   * with native cursor support (e.g. S3's `ListObjectsV2` continuation tokens) should
   * override this method to expose real paging.
   *
   * @param {string} prefix
   * @param {import('./storage.js').BrowseOptions} [opts]
   * @returns {Promise<import('./storage.js').ListResult>}
   */
  async browse(prefix, opts = {}) {
    const { maxItems } = opts;
    const result = await this.list(prefix, { shallow: true, maxItems });
    return { ...result, continuationToken: undefined };
  }
}
