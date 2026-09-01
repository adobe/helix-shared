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

import { promisify } from 'util';
import zlib from 'zlib';
import processQueue from '@adobe/helix-shared-process-queue';

const gzip = promisify(zlib.gzip);

/**
 * Response header names mapped to the corresponding common (lowerCamelCase) field on a
 * `StorageBackend`'s `put()` `opts`. When {@link Bucket#store} encounters one of these
 * headers, it forwards the value as a system field rather than writing it as user metadata.
 */
const SYSTEM_HEADER_TO_COMMON = {
  'cache-control': 'cacheControl',
  'content-type': 'contentType',
  expires: 'expires',
};

/**
 * Response headers that need to be renamed before being written as user metadata,
 * to avoid colliding with backend-controlled headers.
 */
const METADATA_HEADER_MAP = new Map([
  ['last-modified', 'x-source-last-modified'],
]);

/**
 * Sanitizes the input key or path and returns a canonical form: no leading and no trailing `/`.
 *
 * @param {string} keyOrPath
 * @returns {string}
 */
export function sanitizeKey(keyOrPath) {
  let s = keyOrPath;
  if (s.startsWith('/')) {
    s = s.substring(1);
  }
  if (s.endsWith('/')) {
    s = s.slice(0, -1);
  }
  return s;
}

/**
 * Sanitizes a listing prefix: strips leading/trailing `/` then appends a single trailing `/`
 * for non-empty values, giving canonical directory form. An empty input returns `''` (list the
 * entire bucket).
 *
 * @param {string} prefix
 * @returns {string}
 */
export function sanitizePrefix(prefix) {
  const key = sanitizeKey(prefix);
  return key ? `${key}/` : '';
}

/**
 * Resolve metadata object for copy operations.
 *
 * @param {object} commonMeta metadata as returned by a `StorageBackend`'s `head()`
 * @param {Record<string, string>} renameMeta { srcKey -> dstKey }
 * @param {Record<string, string>} addMeta { key -> value }
 * @returns {Record<string, string>}
 */
export function resolveMetadataForCopy(commonMeta = {}, renameMeta = {}, addMeta = {}) {
  const { metadata: existingMeta = {}, lastModified } = commonMeta;
  // for rename purposes, treat the backend-controlled `last-modified` header as a regular header
  const existingMetadata = {
    ...existingMeta,
    ...(lastModified ? {
      'last-modified': lastModified instanceof Date
        ? lastModified.toUTCString()
        : lastModified,
    } : {}),
  };

  const reverseRenameMap = Object.fromEntries(
    Object.entries(renameMeta).map(([to, from]) => [from, to]),
  );
  const renameMetadata = Object.entries(renameMeta)
    .reduce((acc, [from, to]) => {
      if (existingMetadata[from]) {
        acc[to] = existingMetadata[from];
        if (!reverseRenameMap[from]) {
          acc[from] = undefined;
        }
      }
      return acc;
    }, {});

  // for application of existing meta, exclude the backend-controlled `last-modified` header
  const meta = { ...existingMeta, ...renameMetadata, ...addMeta };
  Object.keys(meta).forEach((key) => {
    if (meta[key] === undefined) {
      delete meta[key];
    }
  });
  return meta;
}

/**
 * Thin, backend-agnostic facade wrapping a single `StorageBackend`. Hosts the generic
 * compositions (`store`, `copyDeep`, `rmdir`) and the hoisted copy/metadata algebra that are
 * reused by every backend, on top of the backend's mandatory primitives.
 */
export class Bucket {
  constructor({ backend, log = console }) {
    this._backend = backend;
    this._log = log;
  }

  /** @returns {unknown} the backend's native client */
  get client() {
    const c = this._backend.client;
    if (!c) {
      throw new Error('client is only available for S3-backed buckets');
    }
    return c;
  }

  /** @type {string} */
  get bucket() {
    return this._backend.bucketName;
  }

  get log() {
    return this._log;
  }

  async get(key, meta = null) {
    return this._backend.get(sanitizeKey(key), meta);
  }

  async head(path, headOpts = {}) {
    return this._backend.head(sanitizeKey(path), headOpts);
  }

  async metadata(key) {
    return this._backend.metadata(sanitizeKey(key));
  }

  /**
   * Store an object body and headers from a fetch `Response`. The body is gzipped (or passed
   * through if the response already has `content-encoding: gzip`); response headers are
   * translated into common system fields (`cache-control`, `content-type`, `expires`) or
   * written as user metadata.
   *
   * @param {string} key object key
   * @param {Response} res response whose body and headers should be stored
   * @returns {Promise<void>}
   */
  async store(key, res) {
    const buffer = await res.buffer();
    const contentEncoding = res.headers.get('content-encoding');
    const zipped = contentEncoding === 'gzip' ? buffer : await gzip(buffer);

    const putOpts = { contentEncoding: 'gzip', metadata: {} };
    Array.from(res.headers.entries()).forEach(([name, value]) => {
      const common = SYSTEM_HEADER_TO_COMMON[name];
      if (common) {
        putOpts[common] = value;
      } else {
        putOpts.metadata[METADATA_HEADER_MAP.get(name) || name] = value;
      }
    });

    const dstKey = sanitizeKey(key);
    await this._backend.put(dstKey, zipped, putOpts);
    this._log.info(`object uploaded to: ${this.bucket}/${dstKey}`);
  }

  async put(path, body, contentType = 'application/octet-stream', meta = {}, compress = true) {
    const putOpts = { contentType, metadata: meta };
    let payload = body;
    if (compress) {
      putOpts.contentEncoding = 'gzip';
      payload = await gzip(body);
    }
    const dstKey = sanitizeKey(path);
    const res = await this._backend.put(dstKey, payload, putOpts);
    this._log.info(`object uploaded to: ${this.bucket}/${dstKey}`);
    return res;
  }

  async putMeta(path, meta, opts = {}) {
    return this._backend.putMeta(sanitizeKey(path), meta, opts);
  }

  /**
   * Resolves the options to pass to `backend.copy()`. Returns `null` (a sentinel meaning
   * "source does not exist") when metadata mutation was requested but the source HEAD failed.
   *
   * @param {string} srcKey already-sanitized source key
   * @param {object} opts
   * @returns {Promise<object|null>}
   */
  async _buildCopyOptions(srcKey, opts) {
    if (!opts.addMetadata && !opts.renameMetadata) {
      return { ...opts.copyOpts };
    }
    const head = await this._backend.head(srcKey);
    if (!head) {
      return null;
    }
    return {
      ...opts.copyOpts,
      contentType: head.contentType,
      contentEncoding: head.contentEncoding,
      cacheControl: head.cacheControl,
      contentDisposition: head.contentDisposition,
      expires: head.expires,
      metadata: resolveMetadataForCopy(head, opts.renameMetadata, opts.addMetadata),
      metadataDirective: 'REPLACE',
    };
  }

  /**
   * Copy an object within the same bucket. When `addMetadata` or `renameMetadata` are
   * provided, the source's HEAD is consulted so that selected system headers are preserved
   * and metadata is rewritten with `metadataDirective: 'REPLACE'`.
   *
   * @param {string} src source key
   * @param {string} dst destination key
   * @param {object} [opts]
   * @throws an error with `status: 404` if the source object does not exist
   */
  async copy(src, dst, opts = {}) {
    const srcKey = sanitizeKey(src);
    const dstKey = sanitizeKey(dst);
    const copyOptions = await this._buildCopyOptions(srcKey, opts);
    if (copyOptions === null) {
      const e = new Error(`source does not exist: ${this.bucket}/${srcKey}`);
      e.status = 404;
      throw e;
    }
    const result = await this._backend.copy(srcKey, dstKey, copyOptions);
    this._log.info(`object copied from ${this.bucket}/${srcKey} to: ${this.bucket}/${dstKey}`);
    return result.CopyObjectResult ?? result;
  }

  async remove(path, sourceInfo = '', stopOnError = false) {
    if (Array.isArray(path)) {
      return this._backend.remove(path.map(sanitizeKey), { sourceInfo, stopOnError });
    }
    return this._backend.remove(sanitizeKey(path));
  }

  async list(prefix, opts = {}) {
    return this._backend.list(sanitizePrefix(prefix), opts);
  }

  async browse(prefix, opts = {}) {
    return this._backend.browse(sanitizePrefix(prefix), opts);
  }

  async listFolders(prefix) {
    return this._backend.listFolders(sanitizePrefix(prefix));
  }

  /**
   * Recursively copy the tree below `src` to `dst`. Lists every object under `src`, applies
   * `filter`, then issues per-object copies with concurrency 64. Errors on individual objects
   * are logged but do not abort the operation.
   *
   * @param {string} src source prefix
   * @param {string} dst destination prefix
   * @param {Function} [filter]
   * @param {object} [opts]
   */
  async copyDeep(src, dst, filter = () => true, opts = {}) {
    const tasks = [];
    const dstRoot = sanitizeKey(dst);
    this._log.info(`fetching list of files to copy ${this.bucket}/${sanitizePrefix(src)} => ${dstRoot}`);

    const { objects, prefix } = await this.list(src);
    objects.forEach((obj) => {
      const { key, contentLength, contentType } = obj;
      const relPath = key.substring(prefix.length);
      if (filter({ ...obj, relPath })) {
        tasks.push({
          src: key,
          contentLength,
          contentType,
          dst: dstRoot ? `${dstRoot}/${relPath}` : relPath,
        });
      }
    });

    let errors = 0;
    const changes = [];
    await processQueue(tasks, async (task) => {
      this._log.info(`copy to ${task.dst}`);
      try {
        const copyOptions = await this._buildCopyOptions(task.src, opts);
        if (copyOptions === null) {
          // this should never happen, since we just listed it
          return;
        }
        await this._backend.copy(task.src, task.dst, copyOptions);
        changes.push(task);
      } catch (e) {
        this._log.warn(`error while copying ${task.dst}: ${e}`);
        errors += 1;
      }
    }, 64);
    this._log.info(`copied ${changes.length} files to ${dst} (${errors} errors)`);
    return changes;
  }

  /**
   * Recursively delete every object below `src`.
   *
   * @param {string} src key prefix
   */
  async rmdir(src) {
    const key = sanitizeKey(src);
    this._log.info(`fetching list of files to delete from ${this.bucket}/${key}`);
    const { objects } = await this.list(key);
    return this.remove(objects.map((item) => item.key), key);
  }
}
