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

/* eslint-disable max-classes-per-file,no-param-reassign */
import { Agent } from 'node:https';
import { promisify } from 'util';
import zlib from 'zlib';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';

import { Response } from '@adobe/fetch';
import mime from 'mime';
import processQueue from '@adobe/helix-shared-process-queue';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Maximum number of keys that can be deleted in a single `DeleteObjects` call (S3 limit).
 */
const MAX_DELETE_OBJECTS = 1000;

/**
 * @typedef {import('@aws-sdk/client-s3').CommandInput} CommandInput
 * @typedef {import('@aws-sdk/client-s3').HeadObjectCommandOutput} HeadObjectCommandOutput
 * @typedef {import('@aws-sdk/client-s3').PutObjectCommandOutput} PutObjectCommandOutput
 * @typedef {import('@aws-sdk/client-s3').CopyObjectCommandOutput} CopyObjectCommandOutput
 * @typedef {import('@aws-sdk/client-s3').CopyObjectResult} CopyObjectResult
 * @typedef {import('@aws-sdk/client-s3').DeleteObjectCommandOutput} DeleteObjectCommandOutput
 * @typedef {import('./storage.d').Bucket} BucketType
 * @typedef {import('./storage.d').HelixStorage} HelixStorageType
 * @typedef {import('./storage.d').HelixStorageOptions} HelixStorageOptions
 * @typedef {import('./storage.d').HelixStorageContext} HelixStorageContext
 * @typedef {import('./storage.d').BucketMap} BucketMap
 * @typedef {import('./storage.d').BulkDeleteResult} BulkDeleteResult
 * @typedef {import('./storage.d').ObjectInfo} ObjectInfo
 * @typedef {import('./storage.d').ObjectFilter} ObjectFilter
 * @typedef {import('./storage.d').CopyOptions} CopyOptions
 * @typedef {import('./storage.d').ListOptions} ListOptions
 * @typedef {import('./storage.d').BrowseOptions} BrowseOptions
 * @typedef {import('./storage.d').ListResult} ListResult
 */

/**
 * Response header names treated as S3 system fields. When `store()` encounters one of
 * these, it forwards the value to the corresponding `*Command` input property
 * (e.g. `content-type` -> `ContentType`) rather than writing it as user metadata.
 */
const AWS_S3_SYSTEM_HEADERS = [
  'cache-control',
  'content-type',
  'expires',
];

/**
 * Fields on a `GetObject` response that are surfaced as metadata when the caller of
 * {@link Bucket#get} provides a `meta` output object.
 */
const AWS_META_HEADERS = [
  'CacheControl',
  'ContentType',
  'ContentEncoding',
  'ETag',
  'Expires',
  'LastModified',
];

/**
 * Response headers that need to be renamed before being written as user metadata,
 * to avoid colliding with S3-controlled headers.
 */
const METADATA_HEADER_MAP = new Map([
  ['last-modified', 'x-source-last-modified'],
]);

/**
 * Sanitizes the input key or path and returns a canonical S3 form: no
 * leading and no trailing `/`.
 *
 * @param {string} keyOrPath
 * @returns {string}
 */
function sanitizeKey(keyOrPath) {
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
 * Normalize a directory-style path: ensures it starts *and* ends with `/`.
 * Used when building an S3 list prefix from a `prefix + path` pair where
 * `path` is always interpreted as a directory.
 *
 * @param {string} path
 * @returns {string}
 */
function ensureDirPath(path) {
  let p = path.startsWith('/') ? path : `/${path}`;
  if (!p.endsWith('/')) {
    p += '/';
  }
  return p;
}

/**
 * Returns the last segment of a key, treating an optional trailing `/` as a
 * folder separator. E.g. `/blog/2024/post.md` → `post.md`,
 * `/blog/2024/` → `2024`, `foo` → `foo`.
 *
 * @param {string} key
 * @returns {string}
 */
function basename(key) {
  const trimmed = key.endsWith('/') ? key.slice(0, -1) : key;
  const slash = trimmed.lastIndexOf('/');
  return slash >= 0 ? trimmed.substring(slash + 1) : trimmed;
}

/**
 * Map a `ListObjectsV2` response into {@link ObjectInfo} entries. Used by both
 * {@link Bucket#list} and {@link Bucket#browse}; the `Delimiter` setting on
 * the underlying request determines whether `CommonPrefixes` are present.
 *
 * The `path` field on each entry is computed by stripping `pathBase` from the
 * front of the entry's key. `pathBase` is `''` when the listing root is the
 * bucket root, otherwise `${root}/`. A leading `/` is then prepended so every
 * returned path starts with `/`, and any trailing `/` (for common prefixes)
 * is dropped — paths are uniform: start with `/`, never end with `/`. The
 * `isFolder` flag carries the file/folder distinction.
 *
 * @param {object} result the `ListObjectsV2Command` response
 * @param {string} pathBase prefix to strip from each entry's `key` to compute
 *  its `path` (empty string when the listing root is the bucket root)
 * @returns {ObjectInfo[]}
 */
function listResultToObjectInfos(result, pathBase) {
  const baseLen = pathBase.length;
  const objects = [];
  (result.CommonPrefixes || []).forEach(({ Prefix }) => {
    objects.push({
      key: Prefix,
      // S3 always returns CommonPrefix values ending with `/`; drop it.
      path: `/${Prefix.substring(baseLen).replace(/\/$/, '')}`,
      name: basename(Prefix),
      isFolder: true,
    });
  });
  (result.Contents || []).forEach((content) => {
    const key = content.Key;
    objects.push({
      key,
      path: `/${key.substring(baseLen)}`,
      name: basename(key),
      isFolder: false,
      lastModified: content.LastModified,
      contentLength: content.Size,
      contentType: mime.getType(key),
    });
  });
  return objects;
}

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

/**
 * Resolve metadata object for copy operations.
 *
 * @param {Record<string, string>} s3Headers response headers from S3
 * @param {Record<string, string>} renameMeta { srcKey -> dstKey }
 * @param {Record<string, string>} addMeta { key -> value }
 * @returns {Record<string, string>}
 */
export function resolveMetadataForCopy(s3Headers = {}, renameMeta = {}, addMeta = {}) {
  const { Metadata: existingMeta = {}, LastModified } = s3Headers;
  // for rename purposes, treat the amz controlled `last-modified` header as a regular header
  const existingMetadata = {
    ...existingMeta,
    ...(LastModified ? {
      'last-modified': LastModified instanceof Date
        ? LastModified.toUTCString()
        : LastModified,
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

  // for application of exisitng meta, exclude the amz controlled `last-modified` header
  const meta = { ...existingMeta, ...renameMetadata, ...addMeta };
  Object.keys(meta).forEach((key) => {
    if (meta[key] === undefined) {
      delete meta[key];
    }
  });
  return meta;
}

/**
 * Bucket class
 * @implements {BucketType}
 */
class Bucket {
  /** @type {S3Client} */
  _s3;

  /** @type {S3Client} */
  _r2;

  /** @type {Console} */
  _log;

  /** @type {S3Client[]} */
  _clients;

  /** @type {string} */
  _bucket;

  constructor(opts) {
    Object.assign(this, {
      _s3: opts.s3,
      _r2: opts.r2,
      _log: opts.log,
      _clients: [opts.s3],
      _bucket: opts.bucketId,
    });
    if (opts.r2) {
      this._clients.push(opts.r2);
    }
  }

  /** @type {S3Client} */
  get client() {
    return this._s3;
  }

  /** @type {string} */
  get bucket() {
    return this._bucket;
  }

  get log() {
    return this._log;
  }

  /**
   * Return an object contents.
   *
   * @param {string} key object key
   * @param {object} [meta] output object to receive metadata if specified
   * @returns object contents as a Buffer or null if no found.
   * @throws an error if the object could not be loaded due to an unexpected error.
   */
  async get(key, meta = null) {
    const { log } = this;
    const input = {
      Bucket: this.bucket,
      Key: sanitizeKey(key),
    };

    try {
      const result = await this.client.send(new GetObjectCommand(input));
      log.info(`object downloaded from: ${input.Bucket}/${input.Key}`);

      const buf = await new Response(result.Body, {}).buffer();
      if (meta) {
        Object.assign(meta, result.Metadata);
        for (const name of AWS_META_HEADERS) {
          if (name in result) {
            meta[name] = result[name];
          }
        }
      }
      if (result.ContentEncoding === 'gzip') {
        return await gunzip(buf);
      }
      return buf;
    } catch (e) {
      /* c8 ignore next 3 */
      if (e.$metadata.httpStatusCode !== 404) {
        throw e;
      }
      return null;
    }
  }

  /**
   * Issue a HEAD on the object and return the raw S3 response.
   *
   * @param {string} path object key
   * @param {object} [headOpts] extra fields merged into the `HeadObjectCommand` input
   * @returns {Promise<HeadObjectCommandOutput|null>}
   *  the HEAD response, or `null` when the key does not exist
   * @throws an error if the object could not be loaded due to an unexpected error.
   */
  async head(path, headOpts = {}) {
    const input = {
      ...headOpts,
      Bucket: this._bucket,
      Key: sanitizeKey(path),
    };
    try {
      const result = await this.client.send(new HeadObjectCommand(input));
      this.log.info(`Object metadata downloaded from: ${input.Bucket}/${input.Key}`);
      return result;
    } catch (e) {
      /* c8 ignore next 3 */
      if (e.$metadata.httpStatusCode !== 404) {
        throw e;
      }
      return null;
    }
  }

  /**
   * Return an object's metadata.
   *
   * @param {string} key object key
   * @returns object metadata or null
   * @throws an error if the object could not be loaded due to an unexpected error.
   */
  async metadata(key) {
    const res = await this.head(key);
    return res?.Metadata;
  }

  /**
   * Internal helper that sends the same command to both S3 and R2 in parallel.
   * The result of the primary (S3) call is returned. If only one client fails,
   * the rejection from that client is rethrown with an `[S3]` or `[R2]` prefix
   * on its message so the failing leg is identifiable.
   *
   * @param {function} CommandConstructor command class to instantiate
   * @param {CommandInput} input command input
   * @param {string[]} [measures] when provided, populated with the per-client
   *  latency in seconds (one entry per client, in `_clients` order)
   * @returns {Promise<*>} the command result from the primary (S3) client
   */
  async sendToS3andR2(CommandConstructor, input, measures) {
    // send cmd to s3 and r2 (mirror) in parallel
    const tasks = this._clients.map(async (c, index) => {
      const t0 = Date.now();
      const ret = await c.send(new CommandConstructor(input));
      const t1 = Date.now();
      if (measures) {
        measures[index] = `${(t1 - t0) / 1000}s`;
      }
      return ret;
    });
    const result = await Promise.allSettled(tasks);

    const rejected = result.filter(({ status }) => status === 'rejected');
    if (!rejected.length) {
      return result[0].value;
    } else {
      // at least 1 cmd failed
      /* c8 ignore next */
      const type = result[0].status === 'rejected' ? 'S3' : 'R2';
      const err = rejected[0].reason;
      err.message = `[${type}] ${err.message}`;
      throw err;
    }
  }

  /**
   * Store an object body and headers from a fetch `Response`. The body is gzipped
   * (or passed through if the response already has `content-encoding: gzip`);
   * response headers are translated into S3 system fields (for `cache-control`,
   * `content-type`, `expires`) or written as user metadata. Mirrored to R2 when
   * enabled.
   *
   * @param {string} key object key
   * @param {Response} res response whose body and headers should be stored
   * @returns {Promise<void>} resolves once both clients have completed; failures throw
   */
  async store(key, res) {
    const { log } = this;
    const buffer = await res.buffer();
    const contentEncoding = res.headers.get('content-encoding');
    const zipped = contentEncoding === 'gzip' ? buffer : await gzip(buffer);

    const input = {
      Body: zipped,
      Bucket: this.bucket,
      ContentEncoding: 'gzip',
      Metadata: {},
      Key: sanitizeKey(key),
    };

    Array.from(res.headers.entries()).forEach(([name, value]) => {
      if (AWS_S3_SYSTEM_HEADERS.includes(name)) {
        // system headers are stored in the command itself, e.g.
        // `content-type` header is stored as `ContentType` property
        const property = name.split('-').map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1)).join('');
        input[property] = value;
      } else {
        // use preferred name in metadata if any
        input.Metadata[METADATA_HEADER_MAP.get(name) || name] = value;
      }
    });

    // write to s3 and r2 (mirror) in parallel
    const measures = Array.from({ length: this._clients.length });
    await this.sendToS3andR2(PutObjectCommand, input, measures);
    log.info(`object uploaded to: ${input.Bucket}/${input.Key} (${measures.join('/')})`);
  }

  /**
   * Store an object's contents along with metadata. Mirrored to R2 when enabled.
   *
   * @param {string} path object key
   * @param {Buffer|string} body data to store
   * @param {string} [contentType] content type. Defaults to `application/octet-stream`.
   * @param {Record<string, string>} [meta] metadata to store with the object. Defaults to `{}`.
   * @param {boolean} [compress] whether to gzip the body and set
   *  `ContentEncoding: gzip`. Defaults to `true`.
   * @returns {Promise<PutObjectCommandOutput>} result of the primary S3 PutObject call
   */
  async put(path, body, contentType = 'application/octet-stream', meta = {}, compress = true) {
    const input = {
      Body: body,
      Bucket: this.bucket,
      ContentType: contentType,
      Metadata: meta,
      Key: sanitizeKey(path),
    };
    if (compress) {
      input.ContentEncoding = 'gzip';
      input.Body = await gzip(body);
    }
    // write to s3 and r2 (mirror) in parallel
    const measures = Array.from({ length: this._clients.length });
    const res = await this.sendToS3andR2(PutObjectCommand, input, measures);
    this.log.info(`object uploaded to: ${input.Bucket}/${input.Key} (${measures.join('/')})`);
    return res;
  }

  /**
   * Replace an object's user metadata via a self-copy with `MetadataDirective: REPLACE`.
   * Mirrored to R2 when enabled.
   *
   * @param {string} path object key
   * @param {Record<string, string>} meta new metadata (fully replaces existing metadata)
   * @param {object} [opts] extra fields merged into the underlying `CopyObjectCommand` input
   * @returns {Promise<CopyObjectCommandOutput>}
   */
  async putMeta(path, meta, opts = {}) {
    const key = sanitizeKey(path);
    const input = {
      Bucket: this._bucket,
      Key: key,
      CopySource: `${this.bucket}/${key}`,
      Metadata: meta,
      MetadataDirective: 'REPLACE',
      ...opts,
    };

    // write to s3 and r2 (mirror) in parallel
    const measures = Array.from({ length: this._clients.length });
    const result = await this.sendToS3andR2(CopyObjectCommand, input, measures);
    this.log.info(`Metadata updated for: ${input.CopySource} (${measures.join('/')})`);
    return result;
  }

  /**
   * Copy an object within the same bucket. When `addMetadata` or `renameMetadata`
   * are provided, the source's HEAD is consulted so that selected system headers
   * (`ContentType`, `ContentEncoding`, `CacheControl`, `ContentDisposition`,
   * `Expires`) are preserved and metadata is rewritten with
   * `MetadataDirective: REPLACE`. Mirrored to R2 when enabled.
   *
   * @param {string} src source key
   * @param {string} dst destination key
   * @param {CopyOptions} [opts]
   * @returns {Promise<CopyObjectResult|undefined>} the `CopyObjectResult` from the
   *  primary S3 call (S3 may omit it under some conditions)
   * @throws an error with `status: 404` if the source object does not exist
   */
  async copy(src, dst, opts = {}) {
    const key = sanitizeKey(src);
    const input = {
      ...opts.copyOpts,
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${key}`,
      Key: sanitizeKey(dst),
    };

    try {
      if (opts.addMetadata || opts.renameMetadata) {
        const headers = await this.head(key);
        if (!headers) {
          const e = new Error('not found');
          e.Code = 'NoSuchKey';
          throw e;
        }
        ['ContentType', 'ContentEncoding', 'CacheControl', 'ContentDisposition', 'Expires'].forEach((name) => {
          if (headers[name]) {
            input[name] = headers[name];
          }
        });

        input.Metadata = resolveMetadataForCopy(
          headers,
          opts.renameMetadata,
          opts.addMetadata,
        );
        input.MetadataDirective = 'REPLACE';
      }
      // write to s3 and r2 (mirror) in parallel
      const measures = Array.from({ length: this._clients.length });
      const result = await this.sendToS3andR2(CopyObjectCommand, input, measures);
      this.log.info(`object copied from ${input.CopySource} to: ${input.Bucket}/${input.Key} (${measures.join('/')})`);
      return result.CopyObjectResult;
    } catch (e) {
      /* c8 ignore next 3 */
      if (e.Code !== 'NoSuchKey') {
        throw e;
      }
      const e2 = new Error(`source does not exist: ${input.CopySource}`);
      e2.status = 404;
      throw e2;
    }
  }

  /**
   * Remove one or more objects. Mirrored to R2 when enabled.
   *
   * When passed an array, the input is sliced into chunks of up to
   * {@link MAX_DELETE_OBJECTS} keys (the S3 limit) and the chunks are processed
   * in parallel (concurrency 2). Errors per chunk are accumulated into the
   * returned `Errors` array unless `stopOnError` is set, in which case the first
   * failing chunk throws.
   *
   * When passed a single key string, a `DeleteObject` command is sent and any
   * failure is rethrown as an error with `status` set to the HTTP status code.
   *
   * @param {string|string[]} path single key, or array of keys
   * @param {string} [sourceInfo] informational message used in log output
   *  (only relevant for the array form)
   * @param {boolean} [stopOnError] when `true` and `path` is an array, throw on
   *  the first chunk that fails instead of collecting errors
   * @returns {Promise<DeleteObjectCommandOutput|BulkDeleteResult>}
   *  the raw `DeleteObject` response for a single key, or an aggregated
   *  `{ Deleted, Errors }` object for an array of keys
   */
  async remove(path, sourceInfo = '', stopOnError = false) {
    const { log, bucket } = this;

    if (Array.isArray(path)) {
      // slice into chunks of MAX_DELETE_OBJECTS at most
      const chunks = Array.from({
        length: Math.ceil(path.length / MAX_DELETE_OBJECTS),
      }, (v, i) => path.slice(i * MAX_DELETE_OBJECTS, i * MAX_DELETE_OBJECTS + MAX_DELETE_OBJECTS));

      let oks = 0;
      let errors = 0;
      const result = {
        Deleted: [],
        Errors: [],
      };
      await processQueue(chunks, async (chunk) => {
        log.debug(`deleting ${chunk.length} from ${bucket}`);
        const input = {
          Bucket: bucket,
          Delete: {
            Objects: chunk.map((p) => ({ Key: sanitizeKey(p) })),
          },
        };

        try {
          // delete on s3 and r2 (mirror) in parallel
          const res = await this.sendToS3andR2(DeleteObjectsCommand, input);
          if (res.Deleted) {
            result.Deleted.push(...res.Deleted);
            oks += res.Deleted.length;
          }
          if (res.Errors) {
            result.Errors.push(...res.Errors);
            errors += res.Errors.length;
          }
        } catch (e) {
          // at least 1 cmd failed
          log.warn(`error while deleting ${chunk.length} from ${bucket}/${sourceInfo}: ${e.message} (${e.$metadata.httpStatusCode})`);
          errors += chunk.length;
          if (stopOnError) {
            const msg = `removing ${input.Delete.Objects.length} objects from bucket ${input.Bucket} failed: ${e.message}`;
            this.log.error(msg);
            const e2 = new Error(msg);
            e2.status = e.$metadata.httpStatusCode;
            throw e2;
          }
        }
      }, 2);
      log.info(`deleted ${oks} files (${errors} errors)`);
      return result;
    }

    const input = {
      Bucket: bucket,
      Key: sanitizeKey(path),
    };
    // delete on s3 and r2 (mirror) in parallel
    try {
      const result = await this.sendToS3andR2(DeleteObjectCommand, input);
      log.info(`object deleted: ${bucket}/${input.Key}`);
      return result;
    } catch (e) {
      const msg = `removing ${bucket}/${input.Key} from storage failed: ${e.message}`;
      log.error(msg);
      const e2 = new Error(msg);
      e2.status = e.$metadata.httpStatusCode;
      throw e2;
    }
  }

  /**
   * List objects below `prefix + path`. Pages through `ListObjectsV2` until the
   * result is no longer truncated or `maxItems` is reached.
   *
   * `prefix` is the fixed root of the subtree; `path` is the subdirectory
   * within it (always interpreted as a directory: normalized to start *and*
   * end with `/`). Each returned `ObjectInfo.path` is relative to `prefix`,
   * starts with `/`, and never ends with `/` — the `isFolder` flag carries
   * the file/folder distinction. When `shallow: true`, common prefixes
   * (folders directly below the listed dir) are returned alongside files;
   * callers filter by `isFolder` if they want only one kind.
   *
   * @param {string} prefix root of the subtree to list under
   * @param {string} [path] subdirectory within `prefix`. Defaults to `'/'`.
   * @param {ListOptions} [opts]
   * @returns {Promise<ListResult>}
   */
  async list(prefix, path = '/', opts = {}) {
    const { shallow = false, maxItems = Number.POSITIVE_INFINITY } = opts;
    const root = sanitizeKey(prefix);
    const dir = ensureDirPath(path);
    // strip any leading `/` from the concatenation: it only appears when
    // `root` is empty (canonical S3 keys don't start with `/`).
    const Prefix = `${root}${dir}`.replace(/^\//, '');
    const pathBase = `${root}/`.replace(/^\//, '');

    let ContinuationToken;
    const objects = [];
    do {
      const input = {
        Bucket: this.bucket,
        ContinuationToken,
        Prefix,
        Delimiter: shallow ? '/' : undefined,
      };
      if (maxItems - objects.length < 1000) {
        input.MaxKeys = maxItems - objects.length;
      }
      // eslint-disable-next-line no-await-in-loop
      const result = await this.client.send(new ListObjectsV2Command(input));
      ContinuationToken = result.IsTruncated ? result.NextContinuationToken : '';
      objects.push(...listResultToObjectInfos(result, pathBase));
    } while (ContinuationToken && objects.length < maxItems);
    return { objects, continuationToken: undefined };
  }

  /**
   * Single-page, always-shallow listing intended for paginated UI browsing.
   *
   * `prefix` is the fixed root (constant during navigation); `path` is the
   * subdirectory within it (always interpreted as a directory: normalized
   * to start *and* end with `/`). The actual S3 prefix sent is
   * `prefix + path`. Each returned `ObjectInfo.path` is relative to
   * `prefix`, starts with `/`, and never ends with `/`; the `isFolder` flag
   * carries the file/folder distinction. The caller can pass an entry's
   * `path` straight back as the next call's `path` argument to drill in
   * without reconstructing breadcrumbs.
   *
   * Example:
   *
   * ```js
   * const ROOT = 'owner/repo/main/';
   * const r1 = await bus.browse(ROOT);
   * // r1.objects[i].path -> '/blog', '/images', '/index.md', ...
   * const r2 = await bus.browse(ROOT, r1.objects[0].path); // '/blog'
   * // r2.objects[i].path -> '/blog/2024', '/blog/index.md', ...
   * ```
   *
   * Unlike {@link Bucket#list}, this does not auto-page: it issues one
   * `ListObjectsV2` call, returns the entries it received, and exposes the
   * `NextContinuationToken` so the caller can request the next page on
   * demand. `maxItems` controls the page size only.
   *
   * @param {string} prefix root of the subtree being browsed
   * @param {string} [path] subdirectory within `prefix` to list. Defaults
   *  to `'/'`.
   * @param {BrowseOptions} [opts]
   * @returns {Promise<ListResult>}
   */
  async browse(prefix, path = '/', opts = {}) {
    const { continuationToken, maxItems } = opts;
    const root = sanitizeKey(prefix);
    const dir = ensureDirPath(path);
    const Prefix = `${root}${dir}`.replace(/^\//, '');
    const pathBase = `${root}/`.replace(/^\//, '');

    const result = await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix,
      Delimiter: '/',
      ContinuationToken: continuationToken || undefined,
      MaxKeys: maxItems,
    }));

    return {
      objects: listResultToObjectInfos(result, pathBase),
      continuationToken: result.IsTruncated
        ? result.NextContinuationToken
        : undefined,
    };
  }

  /**
   * Recursively copy the tree below `src` to `dst`. Lists every object under
   * `src`, applies `filter`, then issues per-object `CopyObject` commands with
   * concurrency 64. Errors on individual objects are logged but do not abort
   * the operation.
   *
   * @param {string} src source prefix
   * @param {string} dst destination prefix
   * @param {ObjectFilter} [filter] filter function; only objects for which it
   *  returns truthy are copied
   * @param {CopyOptions} [opts]
   * @returns {Promise<Array<{src: string, dst: string, path: string,
   *  contentLength?: number, contentType?: string|null}>>}
   *  the list of tasks that were copied successfully
   */
  async copyDeep(src, dst, filter = () => true, opts = {}) {
    const { log } = this;
    const tasks = [];
    const Prefix = sanitizeKey(src);
    // dst is sanitized to canonical form (no leading/trailing `/`) so it
    // can be concatenated with `path`, which is root-relative and always
    // starts with `/`.
    const dstRoot = sanitizeKey(dst);
    this.log.info(`fetching list of files to copy ${this.bucket}/${Prefix} => ${dstRoot}`);
    const { objects } = await this.list(Prefix);
    objects.forEach((obj) => {
      const {
        path, key, contentLength, contentType,
      } = obj;
      if (filter(obj)) {
        tasks.push({
          src: key,
          path,
          contentLength,
          contentType,
          // strip the leading `/` that `path` always carries; for non-empty
          // `dstRoot` the leading `/` acts as the separator, for empty
          // `dstRoot` (copying to the bucket root) we'd otherwise end up
          // with a non-canonical S3 key.
          dst: `${dstRoot}${path}`.replace(/^\//, ''),
        });
      }
    });

    let errors = 0;
    const changes = [];
    await processQueue(tasks, async (task) => {
      log.info(`copy to ${task.dst}`);
      const input = {
        ...opts.copyOpts,
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${task.src}`,
        Key: task.dst,
      };
      try {
        if (opts.addMetadata || opts.renameMetadata) {
          const headers = await this.head(task.src);
          if (!headers) {
            // this should never happen, since we just listed it
            return;
          }
          ['ContentType', 'ContentEncoding', 'CacheControl', 'ContentDisposition', 'Expires'].forEach((name) => {
            if (headers[name]) {
              input[name] = headers[name];
            }
          });
          input.Metadata = resolveMetadataForCopy(
            headers,
            opts.renameMetadata,
            opts.addMetadata,
          );
          input.MetadataDirective = 'REPLACE';
        }
        // write to s3 and r2 (mirror) in parallel
        await this.sendToS3andR2(CopyObjectCommand, input);
        changes.push(task);
      } catch (e) {
        // at least 1 cmd failed
        log.warn(`error while copying ${task.dst}: ${e}`);
        errors += 1;
      }
    }, 64);
    log.info(`copied ${changes.length} files to ${dst} (${errors} errors)`);
    return changes;
  }

  /**
   * Recursively delete every object below `src`. Equivalent to listing the
   * prefix and then bulk-deleting all returned keys.
   *
   * @param {string} src key prefix
   * @returns {Promise<BulkDeleteResult>}
   */
  async rmdir(src) {
    src = sanitizeKey(src);
    this.log.info(`fetching list of files to delete from ${this.bucket}/${src}`);
    const { objects } = await this.list(src);
    return this.remove(objects.map((item) => item.key), src);
  }
}

/**
 * The Helix Storage provides a factory for simplified bucket operations to S3 and R2
 * @implements {HelixStorageType}
 */
export class HelixStorage {
  /**
   * Get (and lazily construct + cache) a {@link HelixStorage} for a Helix function
   * `context`. Reads configuration from `context.env` (region, credentials, R2
   * settings, timeouts, bucket-name overrides) and caches the resulting instance
   * on `context.attributes.storage` so repeat calls within the same invocation
   * share clients.
   *
   * @param {HelixStorageContext} context
   * @returns {HelixStorage}
   */
  static fromContext(context) {
    if (!context.attributes.storage) {
      const {
        HELIX_HTTP_CONNECTION_TIMEOUT: connectionTimeout = 5000,
        HELIX_HTTP_SOCKET_TIMEOUT: socketTimeout = 15000,
        HELIX_HTTP_S3_KEEP_ALIVE: keepAlive,
        CLOUDFLARE_ACCOUNT_ID: r2AccountId,
        CLOUDFLARE_R2_ACCESS_KEY_ID: r2AccessKeyId,
        CLOUDFLARE_R2_SECRET_ACCESS_KEY: r2SecretAccessKey,
        HELIX_STORAGE_DISABLE_R2: disableR2,
        HELIX_BUCKET_NAMES: bucketNames,
        HELIX_STORAGE_MAX_ATTEMPTS: maxAttempts,
      } = context.env;

      context.attributes.storage = new HelixStorage({
        connectionTimeout,
        socketTimeout,
        r2AccountId,
        r2AccessKeyId,
        r2SecretAccessKey,
        disableR2: String(disableR2) === 'true',
        keepAlive: String(keepAlive) === 'true',
        bucketNames,
        log: context.log,
        maxAttempts: Number.parseInt(maxAttempts, 10),
      });
    }
    return context.attributes.storage;
  }

  static AWS_S3_SYSTEM_HEADERS = {
    'content-type': 'ContentType',
    'content-disposition': 'ContentDisposition',
    'content-encoding': 'ContentEncoding',
    'content-language': 'ContentLanguage',
  };

  /**
   * Create a storage instance. Constructs an S3 client (using explicit credentials
   * if provided, otherwise the SDK default credential chain) and an R2 client
   * unless `disableR2` is `true`.
   *
   * @param {HelixStorageOptions} [opts]
   */
  constructor(opts = {}) {
    const {
      region = 'us-east-1', accessKeyId, secretAccessKey,
      connectionTimeout, socketTimeout,
      r2AccountId, r2AccessKeyId, r2SecretAccessKey, disableR2,
      bucketNames,
      keepAlive = true,
      log = console,
      maxAttempts = Number.NaN,
    } = opts;

    const baseOpts = {
      region,
      requestHandler: new NodeHttpHandler({
        httpsAgent: new Agent({
          keepAlive,
        }),
        connectionTimeout,
        socketTimeout,
      }),
    };
    if (!Number.isNaN(maxAttempts)) {
      baseOpts.maxAttempts = maxAttempts;
    }

    if (region && accessKeyId && secretAccessKey) {
      log.debug('Creating S3Client with credentials');
      this._s3 = new S3Client({
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        ...baseOpts,
      });
    } else {
      log.debug('Creating S3Client without credentials');
      this._s3 = new S3Client(baseOpts);
    }

    // initializing the R2 client which is used for mirroring all S3 writes to R2
    if (disableR2) {
      log.info('R2 S3Client disabled.');
    } else {
      log.debug('Creating R2 S3Client');
      this._r2 = new S3Client({
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        region: 'us-east-1', // https://github.com/aws/aws-sdk-js-v3/issues/1845#issuecomment-754832210
        credentials: {
          accessKeyId: r2AccessKeyId,
          secretAccessKey: r2SecretAccessKey,
        },
        requestHandler: new NodeHttpHandler({
          httpsAgent: new Agent({
            keepAlive,
          }),
          connectionTimeout,
          socketTimeout,
        }),
      });
    }
    this._bucketMap = parseBucketNames(bucketNames);
    this._log = log;
  }

  /**
   * @returns {S3Client} the underlying primary S3 client
   */
  s3() {
    return this._s3;
  }

  /**
   * Create a {@link Bucket} for the given bucket id. The returned bucket reuses
   * the storage's S3 client (and R2 client unless `disableR2` is `true`).
   *
   * @param {string} bucketId bucket name
   * @param {boolean} [disableR2] when `true`, this bucket will not mirror writes
   *  to R2 even if R2 is otherwise configured
   * @returns {Bucket}
   * @throws if the storage has been closed or if `bucketId` is empty
   */
  bucket(bucketId, disableR2 = false) {
    if (!this._s3) {
      throw new Error('storage already closed.');
    }
    if (!bucketId) {
      throw new Error('bucketId is required.');
    }
    return new Bucket({
      bucketId,
      s3: this._s3,
      r2: disableR2 ? null : this._r2,
      log: this._log,
    });
  }

  /**
   * Bucket for the configured `content` bus.
   *
   * @param {boolean} [disableR2]
   * @returns {Bucket}
   */
  contentBus(disableR2 = false) {
    return this.bucket(this._bucketMap.content, disableR2);
  }

  /**
   * Bucket for the configured `code` bus.
   *
   * @param {boolean} [disableR2]
   * @returns {Bucket}
   */
  codeBus(disableR2 = false) {
    return this.bucket(this._bucketMap.code, disableR2);
  }

  /**
   * Bucket for the configured `media` bus. R2 mirroring is always disabled here.
   *
   * @returns {Bucket}
   */
  mediaBus() {
    return this.bucket(this._bucketMap.media);
  }

  /**
   * Bucket for the configured `source` bus. R2 mirroring defaults to disabled
   * since the source bus is typically not mirrored.
   *
   * @param {boolean} [disableR2]
   * @returns {Bucket}
   */
  sourceBus(disableR2 = true) {
    return this.bucket(this._bucketMap.source, disableR2);
  }

  /**
   * Bucket for the configured `config` bus. R2 mirroring is always disabled here.
   *
   * @returns {Bucket}
   */
  configBus() {
    return this.bucket(this._bucketMap.config);
  }

  /**
   * Close this storage. Destroys the underlying S3 (and R2) clients and renders
   * this instance unusable; subsequent calls to {@link HelixStorage#bucket}
   * throw.
   */
  close() {
    this._s3?.destroy();
    this._r2?.destroy();
    delete this._s3;
    delete this._r2;
  }
}
