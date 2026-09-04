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

/* eslint-disable no-param-reassign */
import { promisify } from 'util';
import { buffer } from 'node:stream/consumers';
import zlib from 'zlib';
import processQueue from '@adobe/helix-shared-process-queue';
import { AbstractStorageBackend } from '@adobe/helix-shared-storage';

const gunzip = promisify(zlib.gunzip);

/**
 * Maximum number of blobs deleted concurrently in a bulk `remove()` call. Azure has no
 * S3-style bulk-delete API, so each key needs its own request; this bounds concurrency
 * instead of chunk size.
 */
const REMOVE_CONCURRENCY = 8;

/**
 * `SYSTEM_META_FIELD_NAMES` (the common, lowerCamelCase system-property names shared across
 * the `StorageBackend` API), mapped to the corresponding Azure `BlobHTTPHeaders` field. Drives
 * `head()`'s/`put()`'s system-field mapping. Azure has no native equivalent of S3's `Expires`
 * header, so `expires` is intentionally left unmapped (dropped) rather than faked via custom
 * metadata.
 */
const SYSTEM_META_FIELDS = {
  contentType: 'blobContentType',
  contentEncoding: 'blobContentEncoding',
  cacheControl: 'blobCacheControl',
  contentDisposition: 'blobContentDisposition',
  contentLanguage: 'blobContentLanguage',
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
 * Azure metadata property names must be valid C# identifiers and cannot contain `-`. Since
 * none of our metadata keys ever legitimately contain a literal `_`, `-` is transparently and
 * losslessly substituted with `_` on write, and reversed on read, so callers never need to
 * know about this Azure-specific restriction (this is also what blobs migrated from S3, whose
 * metadata keys freely used `-`, ended up doing).
 *
 * @param {Object.<string, string>} [metadata]
 * @returns {Object.<string, string>}
 */
function toAzureMetadata(metadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key.replace(/-/g, '_'), value]),
  );
}

/**
 * The inverse of {@link toAzureMetadata}, applied to metadata read back from Azure.
 *
 * @param {Object.<string, string>} [metadata]
 * @returns {Object.<string, string>}
 */
function fromAzureMetadata(metadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key.replace(/_/g, '-'), value]),
  );
}

/**
 * Maps a downloaded blob's HTTP headers into the common, lowerCamelCase `CommonObjectMeta`
 * field names, shared by `get()`'s `meta` output and `head()`'s return value. Falls back to a
 * `content_encoding` custom metadata property when the native `Content-Encoding` header is
 * empty — blobs migrated from S3 don't always have the native header set, but the migration
 * preserves the original encoding under this metadata key.
 *
 * @param {object} raw a blob download or getProperties response
 * @returns {object}
 */
function commonFieldsFromRaw(raw) {
  const result = {};
  Object.entries(SYSTEM_META_FIELDS).forEach(([common]) => {
    if (raw[common] !== undefined) {
      result[common] = raw[common];
    }
  });
  if (!result.contentEncoding && raw.metadata?.content_encoding) {
    result.contentEncoding = raw.metadata.content_encoding;
  }
  return result;
}

/**
 * @typedef {Object} AzureBackendOptions
 * @property {import('@azure/storage-blob').ContainerClient} client
 * @property {string} [name] backend family tag used for error tagging when mirrored
 * @property {string} bucketName
 * @property {Console} [log]
 */

/**
 * Azure Blob Storage {@link import('@adobe/helix-shared-storage').StorageBackend}
 * implementation. A single instance wraps one Azure `ContainerClient` bound to one
 * container (Azure's equivalent of a bucket).
 *
 * @implements {import('@adobe/helix-shared-storage').StorageBackend}
 */
export class AzureBackend extends AbstractStorageBackend {
  /**
   * @param {AzureBackendOptions} opts
   */
  constructor({
    client, name = 'Azure', bucketName, log = console,
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

  /** @type {import('@azure/storage-blob').ContainerClient} */
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
    const blobClient = this._client.getBlobClient(key);
    try {
      const result = await blobClient.download();
      this._log.info(`object downloaded from: ${this._bucketName}/${key}`);

      const buf = await buffer(result.readableStreamBody);
      const commonFields = commonFieldsFromRaw(result);
      if (meta) {
        Object.assign(meta, fromAzureMetadata(result.metadata));
        meta.etag = result.etag;
        meta.lastModified = result.lastModified;
        Object.assign(meta, commonFields);
      }
      if (commonFields.contentEncoding === 'gzip') {
        return await gunzip(buf);
      }
      return buf;
    } catch (e) {
      /* c8 ignore next 3 */
      if (e.statusCode !== 404) {
        throw e;
      }
      return null;
    }
  }

  /**
   * @param {string} key already-sanitized object key
   * @param {Record<string, unknown>} [headOpts] extra fields merged into the underlying
   *  `getProperties()` call
   * @returns {Promise<import('@adobe/helix-shared-storage').CommonObjectMeta|null>}
   */
  async head(key, headOpts = {}) {
    const blobClient = this._client.getBlobClient(key);
    try {
      const raw = await blobClient.getProperties(headOpts);
      this._log.info(`Object metadata downloaded from: ${this._bucketName}/${key}`);
      return {
        etag: raw.etag,
        contentLength: raw.contentLength,
        lastModified: raw.lastModified,
        metadata: fromAzureMetadata(raw.metadata),
        ...commonFieldsFromRaw(raw),
        raw,
      };
    } catch (e) {
      /* c8 ignore next 3 */
      if (e.statusCode !== 404) {
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
    const data = typeof body === 'string' ? Buffer.from(body) : body;
    const blockBlobClient = this._client.getBlockBlobClient(key);
    const blobHTTPHeaders = {};
    Object.entries(SYSTEM_META_FIELDS).forEach(([common, azure]) => {
      blobHTTPHeaders[azure] = opts[common];
    });
    const raw = await blockBlobClient.upload(data, data.length, {
      blobHTTPHeaders,
      metadata: toAzureMetadata(opts.metadata),
    });
    this._log.info(`object uploaded to: ${this._bucketName}/${key}`);
    return {
      etag: raw.etag, contentType: opts.contentType, raw,
    };
  }

  /**
   * Replace an object's user metadata (and any recognized system properties within `meta`).
   * Azure has no S3-style single self-copy trick for this, so metadata and HTTP headers are
   * updated via two separate, parallel calls — `setMetadata()` and `setHTTPHeaders()` — each of
   * which fully replaces its respective property set, matching `putMeta()`'s
   * "fully replaces existing metadata" contract.
   *
   * @param {string} path already-sanitized object key
   * @param {Object.<string, string>} meta new metadata (fully replaces existing metadata)
   * @returns {Promise<import('@adobe/helix-shared-storage').CommonObjectMeta>}
   */
  async putMeta(path, meta = {}) {
    const blobClient = this._client.getBlobClient(path);
    const customMetadata = {};
    const blobHTTPHeaders = {};
    Object.entries(meta).forEach(([key, value]) => {
      const azureField = SYSTEM_META_FIELDS[key];
      if (azureField) {
        blobHTTPHeaders[azureField] = value;
      } else {
        customMetadata[key] = value;
      }
    });
    const [metadataRaw, headersRaw] = await Promise.all([
      blobClient.setMetadata(toAzureMetadata(customMetadata)),
      blobClient.setHTTPHeaders(blobHTTPHeaders),
    ]);
    this._log.info(`Metadata updated for: ${this._bucketName}/${path}`);
    return { raw: { metadata: metadataRaw, headers: headersRaw } };
  }

  /**
   * @param {string} src already-sanitized source key
   * @param {string} dst already-sanitized destination key
   * @param {import('@adobe/helix-shared-storage').CopyOptions} [opts]
   * @returns {Promise<import('@adobe/helix-shared-storage').CommonObjectMeta>}
   * @throws an error with `status: 404` if the source object does not exist
   */
  async copy(src, dst, opts = {}) {
    const srcBlobClient = this._client.getBlobClient(src);
    const dstBlobClient = this._client.getBlobClient(dst);

    // Unlike S3, Azure's `beginCopyFromURL` always copies the source's HTTP headers verbatim
    // and only lets the request override `metadata` (S3's `COPY` vs. `REPLACE` directive maps
    // onto omitting vs. passing `metadata` here). There is no way to override system HTTP
    // headers (contentType, etc.) as part of the copy call itself, so a `REPLACE` directive
    // needs a follow-up `setHTTPHeaders()` call against the destination once the copy lands.
    const copyOpts = { ...opts.copyOpts };
    if (opts.metadataDirective === 'REPLACE') {
      copyOpts.metadata = opts.metadata ?? {};
    }

    try {
      const poller = await dstBlobClient.beginCopyFromURL(srcBlobClient.url, copyOpts);
      let raw = await poller.pollUntilDone();
      if (opts.metadataDirective === 'REPLACE') {
        const blobHTTPHeaders = {};
        Object.entries(SYSTEM_META_FIELDS).forEach(([common, azure]) => {
          blobHTTPHeaders[azure] = opts[common];
        });
        raw = await dstBlobClient.setHTTPHeaders(blobHTTPHeaders);
      }
      this._log.info(`object copied from ${this._bucketName}/${src} to: ${this._bucketName}/${dst}`);
      return { etag: raw.etag, raw };
    } catch (e) {
      /* c8 ignore next 3 */
      if (e.statusCode !== 404) {
        throw e;
      }
      const e2 = new Error(`source does not exist: ${this._bucketName}/${src}`);
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
    const { stopOnError = false } = opts;
    const bucket = this._bucketName;
    const log = this._log;

    if (Array.isArray(pathOrPaths)) {
      const result = { Deleted: [], Errors: [] };
      await processQueue(pathOrPaths, async (key) => {
        try {
          const raw = await this._client.getBlobClient(key).deleteIfExists();
          result.Deleted.push({ Key: key, raw });
        } catch (e) {
          log.warn(`error while deleting ${bucket}/${key}: ${e.message} (${e.statusCode})`);
          result.Errors.push({ Key: key, message: e.message });
          if (stopOnError) {
            const msg = `removing ${key} from bucket ${bucket} failed: ${e.message}`;
            log.error(msg);
            const e2 = new Error(msg);
            e2.status = e.statusCode;
            throw e2;
          }
        }
      }, REMOVE_CONCURRENCY);
      log.info(`deleted ${result.Deleted.length} files (${result.Errors.length} errors)`);
      return result;
    }

    try {
      const raw = await this._client.getBlobClient(pathOrPaths).deleteIfExists();
      log.info(`object deleted: ${bucket}/${pathOrPaths}`);
      return raw;
    } catch (e) {
      const msg = `removing ${bucket}/${pathOrPaths} from storage failed: ${e.message}`;
      log.error(msg);
      const e2 = new Error(msg);
      e2.status = e.statusCode;
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

    const objects = [];
    const iter = shallow
      ? this._client.listBlobsByHierarchy('/', { prefix })
      : this._client.listBlobsFlat({ prefix });
    // eslint-disable-next-line no-restricted-syntax
    for await (const item of iter) {
      if (objects.length >= maxItems) {
        break;
      }
      if (item.kind === 'prefix') {
        objects.push({ key: item.name, name: basename(item.name), isFolder: true });
      } else {
        objects.push({
          key: item.name,
          name: basename(item.name),
          isFolder: item.name.endsWith('/'),
          lastModified: item.properties.lastModified,
          contentLength: item.properties.contentLength,
          contentType: item.properties.contentType,
        });
      }
    }
    return { prefix, objects, continuationToken: undefined };
  }

  /**
   * @param {string} prefix already-sanitized key prefix to browse
   * @param {import('@adobe/helix-shared-storage').BrowseOptions} [opts]
   * @returns {Promise<import('@adobe/helix-shared-storage').ListResult>}
   */
  async browse(prefix, opts = {}) {
    const { continuationToken, maxItems } = opts;

    const iter = this._client
      .listBlobsByHierarchy('/', { prefix })
      .byPage({ continuationToken, maxPageSize: maxItems });
    const { value } = await iter.next();

    const objects = [];
    value.segment.blobPrefixes.forEach(({ name }) => {
      objects.push({ key: name, name: basename(name), isFolder: true });
    });
    value.segment.blobItems.forEach((item) => {
      objects.push({
        key: item.name,
        name: basename(item.name),
        isFolder: false,
        lastModified: item.properties.lastModified,
        contentLength: item.properties.contentLength,
        contentType: item.properties.contentType,
      });
    });

    return {
      prefix,
      objects,
      continuationToken: value.continuationToken || undefined,
    };
  }
}
