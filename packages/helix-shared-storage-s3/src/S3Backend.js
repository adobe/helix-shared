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

/* eslint-disable no-param-reassign */
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
} from '@aws-sdk/client-s3';
import { Response } from '@adobe/fetch';
import mime from 'mime';
import processQueue from '@adobe/helix-shared-process-queue';
import { AbstractStorageBackend, SYSTEM_META_FIELD_NAMES } from '@adobe/helix-shared-storage';

const gunzip = promisify(zlib.gunzip);

/**
 * Maximum number of keys that can be deleted in a single `DeleteObjects` call (S3 limit).
 */
const MAX_DELETE_OBJECTS = 1000;

/**
 * `SYSTEM_META_FIELD_NAMES` (the common, lowerCamelCase system-property names shared across
 * the `StorageBackend` API), mapped to the corresponding S3 `*Command` PascalCase input
 * property. Drives `head()`'s/`put()`'s/`copy()`'s system-field mapping, and is what lets
 * `putMeta()` fake Azure's separate `setHTTPHeaders()`/`setMetadata()` split within S3's one
 * self-copy call: keys recognized here become system properties, everything else becomes
 * custom metadata.
 */
const SYSTEM_META_FIELDS = Object.fromEntries(
  SYSTEM_META_FIELD_NAMES.map((field) => [field, `${field.charAt(0).toUpperCase()}${field.slice(1)}`]),
);

/**
 * Fields on a `GetObject` response that are surfaced — using the same common, lowerCamelCase
 * names as `head()`/`CommonObjectMeta` — when the caller of {@link S3Backend#get} provides a
 * `meta` output object. The reverse of `SYSTEM_META_FIELDS`, plus the two read-only object
 * attributes `get()` has historically also surfaced (`etag`, `lastModified`).
 */
const GET_META_FIELDS = {
  ...Object.fromEntries(
    Object.entries(SYSTEM_META_FIELDS).map(([common, pascal]) => [pascal, common]),
  ),
  ETag: 'etag',
  LastModified: 'lastModified',
};

/**
 * Returns the last segment of a key, treating an optional trailing `/` as a folder separator.
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
 * Map a `ListObjectsV2` response into `ObjectInfo` entries (`{key, name, isFolder, ...}`).
 * The `Delimiter` setting on the underlying request determines whether `CommonPrefixes` are
 * present.
 *
 * @param {object} result the `ListObjectsV2Command` response
 * @returns {object[]}
 */
function listResultToObjectInfos(result) {
  const objects = [];
  (result.CommonPrefixes || []).forEach(({ Prefix }) => {
    objects.push({ key: Prefix, name: basename(Prefix), isFolder: true });
  });
  (result.Contents || []).forEach((content) => {
    const key = content.Key;
    const isFolder = key.endsWith('/');
    objects.push({
      key,
      name: basename(key),
      isFolder,
      lastModified: content.LastModified,
      contentLength: content.Size,
      contentType: mime.getType(key),
    });
  });
  return objects;
}

/**
 * @typedef {Object} S3BackendOptions
 * @property {import('@aws-sdk/client-s3').S3Client} client
 * @property {string} name backend family tag used for error tagging when mirrored, e.g.
 *  `'S3'` or `'R2'`
 * @property {string} bucketName
 * @property {Console} [log]
 */

/**
 * S3 (and Cloudflare R2, which is S3-compatible)
 * {@link import('@adobe/helix-shared-storage').StorageBackend} implementation — the default
 * backend for `@adobe/helix-shared-storage`. A single instance wraps one `S3Client` bound to
 * one bucket; R2 mirroring is achieved by composing two `S3Backend` instances (one per
 * client) via `MirroringBackend`, not by this class itself.
 *
 * @implements {import('@adobe/helix-shared-storage').StorageBackend}
 */
export class S3Backend extends AbstractStorageBackend {
  /**
   * @param {S3BackendOptions} opts
   */
  constructor({
    client, name, bucketName, log = console,
  }) {
    super();
    this._client = client;
    this._name = name;
    this._bucketName = bucketName;
    this._log = log;
  }

  /** @type {string} */
  get name() {
    return this._name;
  }

  /** @type {string} */
  get bucketName() {
    return this._bucketName;
  }

  /** @type {import('@aws-sdk/client-s3').S3Client} */
  get client() {
    return this._client;
  }

  /**
   * @param {string} key already-sanitized object key
   * @param {Record<string, unknown>} [meta] output object that receives the object's custom
   *  metadata plus its recognized system fields (using the same common, lowerCamelCase names
   *  as `head()`, e.g. `contentType`), and `etag`/`lastModified`
   * @returns {Promise<Buffer|null>}
   */
  async get(key, meta = null) {
    const input = { Bucket: this._bucketName, Key: key };
    try {
      const result = await this._client.send(new GetObjectCommand(input));
      this._log.info(`object downloaded from: ${input.Bucket}/${input.Key}`);

      const buf = await new Response(result.Body, {}).buffer();
      if (meta) {
        Object.assign(meta, result.Metadata);
        Object.entries(GET_META_FIELDS).forEach(([pascal, common]) => {
          if (pascal in result) {
            meta[common] = result[pascal];
          }
        });
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
   * @param {string} key already-sanitized object key
   * @param {Record<string, unknown>} [headOpts] extra fields merged into the underlying HEAD call
   * @returns {Promise<import('@adobe/helix-shared-storage').CommonObjectMeta|null>}
   */
  async head(key, headOpts = {}) {
    const input = { ...headOpts, Bucket: this._bucketName, Key: key };
    try {
      const raw = await this._client.send(new HeadObjectCommand(input));
      this._log.info(`Object metadata downloaded from: ${input.Bucket}/${input.Key}`);
      const result = {
        etag: raw.ETag,
        versionId: raw.VersionId,
        contentLength: raw.ContentLength,
        lastModified: raw.LastModified,
        metadata: raw.Metadata,
        raw,
      };
      Object.entries(SYSTEM_META_FIELDS).forEach(([common, pascal]) => {
        result[common] = raw[pascal];
      });
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
   * @param {string} key already-sanitized object key
   * @param {Buffer|string} body data to store
   * @param {import('@adobe/helix-shared-storage').PutOptions} [opts]
   * @returns {Promise<import('@adobe/helix-shared-storage').CommonObjectMeta>}
   */
  async put(key, body, opts = {}) {
    const input = {
      Body: body,
      Bucket: this._bucketName,
      Key: key,
      Metadata: opts.metadata,
    };
    Object.entries(SYSTEM_META_FIELDS).forEach(([common, pascal]) => {
      input[pascal] = opts[common];
    });
    const raw = await this._client.send(new PutObjectCommand(input));
    this._log.info(`object uploaded to: ${input.Bucket}/${input.Key}`);
    return {
      etag: raw.ETag, versionId: raw.VersionId, contentType: opts.contentType, raw,
    };
  }

  /**
   * Replace an object's user metadata (and any recognized system properties within `meta`)
   * via a self-copy with `MetadataDirective: 'REPLACE'`. Keys matching `SYSTEM_META_FIELDS`
   * are mapped onto the corresponding `CopyObjectCommand` system field instead of becoming
   * custom metadata — this is what keeps `meta.contentType` from ending up as a literal
   * `x-amz-meta-contenttype` header.
   *
   * @param {string} path already-sanitized object key
   * @param {Object.<string, string>} meta new metadata (fully replaces existing metadata)
   * @returns {Promise<import('@adobe/helix-shared-storage').CommonObjectMeta>}
   */
  async putMeta(path, meta = {}) {
    const input = {
      Bucket: this._bucketName,
      Key: path,
      CopySource: `${this._bucketName}/${path}`,
      MetadataDirective: 'REPLACE',
      Metadata: {},
    };
    Object.entries(meta).forEach(([key, value]) => {
      const systemField = SYSTEM_META_FIELDS[key];
      if (systemField) {
        input[systemField] = value;
      } else {
        input.Metadata[key] = value;
      }
    });
    const raw = await this._client.send(new CopyObjectCommand(input));
    this._log.info(`Metadata updated for: ${input.CopySource}`);
    return { raw };
  }

  /**
   * @param {string} src already-sanitized source key
   * @param {string} dst already-sanitized destination key
   * @param {import('@adobe/helix-shared-storage').CopyOptions} [opts]
   * @returns {Promise<import('@adobe/helix-shared-storage').CommonObjectMeta>}
   * @throws an error with `status: 404` if the source object does not exist
   */
  async copy(src, dst, opts = {}) {
    // `opts` carries raw, backend-native passthrough fields flattened at the top level by
    // Bucket._buildCopyOptions(). The named PascalCase fields below are only applied when the
    // corresponding common field is actually set *and* the raw passthrough didn't already
    // explicitly set that same field — an absent (or head-derived, "preserve on REPLACE")
    // common-field value must never clobber an explicit `copyOpts` override, in either
    // direction: neither by being missing (already handled by the `undefined` check) nor by
    // being present (the caller's explicit raw value wins).
    const input = {
      ...opts,
      Bucket: this._bucketName,
      CopySource: `${this._bucketName}/${src}`,
      Key: dst,
    };
    const systemFields = { Metadata: opts.metadata, MetadataDirective: opts.metadataDirective };
    Object.entries(SYSTEM_META_FIELDS).forEach(([common, pascal]) => {
      systemFields[pascal] = opts[common];
    });
    Object.entries(systemFields).forEach(([key, value]) => {
      if (value !== undefined && input[key] === undefined) {
        input[key] = value;
      }
    });
    try {
      const raw = await this._client.send(new CopyObjectCommand(input));
      this._log.info(`object copied from ${input.CopySource} to: ${input.Bucket}/${input.Key}`);
      return { etag: raw.CopyObjectResult?.ETag, raw };
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
   * @param {string|string[]} pathOrPaths single already-sanitized key, or array of them
   * @param {import('@adobe/helix-shared-storage').RemoveOptions} [opts]
   * @returns {Promise<Record<string, unknown>|
   *   import('@adobe/helix-shared-storage').BulkRemoveResult>}
   */
  async remove(pathOrPaths, opts = {}) {
    const { sourceInfo = '', stopOnError = false } = opts;
    const bucket = this._bucketName;
    const log = this._log;

    if (Array.isArray(pathOrPaths)) {
      // slice into chunks of MAX_DELETE_OBJECTS at most
      const chunks = Array.from({
        length: Math.ceil(pathOrPaths.length / MAX_DELETE_OBJECTS),
      }, (v, i) => pathOrPaths.slice(
        i * MAX_DELETE_OBJECTS,
        i * MAX_DELETE_OBJECTS + MAX_DELETE_OBJECTS,
      ));

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
            Objects: chunk.map((p) => ({ Key: p })),
          },
        };

        try {
          const res = await this._client.send(new DeleteObjectsCommand(input));
          if (res.Deleted) {
            result.Deleted.push(...res.Deleted);
            oks += res.Deleted.length;
          }
          if (res.Errors) {
            result.Errors.push(...res.Errors);
            errors += res.Errors.length;
          }
        } catch (e) {
          log.warn(`error while deleting ${chunk.length} from ${bucket}/${sourceInfo}: ${e.message} (${e.$metadata.httpStatusCode})`);
          errors += chunk.length;
          if (stopOnError) {
            const msg = `removing ${input.Delete.Objects.length} objects from bucket ${input.Bucket} failed: ${e.message}`;
            log.error(msg);
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
      Key: pathOrPaths,
    };
    try {
      const result = await this._client.send(new DeleteObjectCommand(input));
      log.info(`object deleted: ${bucket}/${input.Key}`);
      return result;
    } catch (e) {
      const msg = `removing ${bucket}/${input.Key} from storage failed: ${e.message}`;
      log.error(msg);

      const e2 = /Deserialization error: to see the raw response, inspect the hidden field \{error\}\.\$response/.test(e.message)
        ? new Error(e.$response.body)
        : new Error(msg);

      e2.status = e.$metadata.httpStatusCode;
      throw e2;
    }
  }

  /**
   * @param {string} prefix already-sanitized key prefix to list under
   * @param {import('@adobe/helix-shared-storage').BackendListOptions} [opts]
   * @returns {Promise<import('@adobe/helix-shared-storage').ListResult>}
   */
  async list(prefix, opts = {}) {
    const { shallow = false, maxItems = Number.POSITIVE_INFINITY } = opts;

    let ContinuationToken;
    const objects = [];
    do {
      const input = {
        Bucket: this._bucketName,
        ContinuationToken,
        Prefix: prefix,
        Delimiter: shallow ? '/' : undefined,
      };
      if (maxItems - objects.length < 1000) {
        input.MaxKeys = maxItems - objects.length;
      }
      // eslint-disable-next-line no-await-in-loop
      const result = await this._client.send(new ListObjectsV2Command(input));
      ContinuationToken = result.IsTruncated ? result.NextContinuationToken : '';
      objects.push(...listResultToObjectInfos(result));
    } while (ContinuationToken && objects.length < maxItems);
    return { prefix, objects, continuationToken: undefined };
  }

  /**
   * @param {string} prefix already-sanitized key prefix to browse
   * @param {import('@adobe/helix-shared-storage').BrowseOptions} [opts]
   * @returns {Promise<import('@adobe/helix-shared-storage').ListResult>}
   */
  async browse(prefix, opts = {}) {
    const { continuationToken, maxItems } = opts;

    const result = await this._client.send(new ListObjectsV2Command({
      Bucket: this._bucketName,
      Prefix: prefix,
      Delimiter: '/',
      ContinuationToken: continuationToken || undefined,
      MaxKeys: maxItems,
    }));

    return {
      prefix,
      objects: listResultToObjectInfos(result),
      continuationToken: result.IsTruncated
        ? result.NextContinuationToken
        : undefined,
    };
  }
}
