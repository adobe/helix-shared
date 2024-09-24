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
 * @typedef {import('@aws-sdk/client-s3').CommandInput} CommandInput
 * @typedef {import('./storage.d').Bucket} BucketType
 * @typedef {import('./storage.d').HelixStorage} HelixStorageType
 * @typedef {import('./storage.d').ObjectInfo} ObjectInfo
 * @typedef {import('./storage.d').ObjectFilter} ObjectFilter
 * @typedef {import('./storage.d').CopyOptions} CopyOptions
 */

/**
 * Header names that AWS considers system defined.
 */
const AWS_S3_SYSTEM_HEADERS = [
  'cache-control',
  'content-type',
  'expires',
];

/**
 * result object headers
 */
const AWS_META_HEADERS = [
  'CacheControl',
  'ContentType',
  'ContentEncoding',
  'Expires',
];

/**
 * Response header names that need a different metadata name.
 */
const METADATA_HEADER_MAP = new Map([
  ['last-modified', 'x-source-last-modified'],
]);

/**
 * Sanitizes the input key or path and returns a bucket relative key (without leading / ).
 * @param {string} keyOrPath
 * @returns {string}
 */
function sanitizeKey(keyOrPath) {
  if (keyOrPath.charAt(0) === '/') {
    return keyOrPath.substring(1);
  }
  return keyOrPath;
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

  async head(path) {
    const input = {
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
   * Internal helper for sending a command to both S3 and R2 clients.
   * @param {function} CommandConstructor constructor of command to send to the client
   * @param {CommandInput} input command input
   * @returns {Promise<*>} the command result
   */
  async sendToS3andR2(CommandConstructor, input) {
    // send cmd to s3 and r2 (mirror) in parallel
    const tasks = this._clients.map((c) => c.send(new CommandConstructor(input)));
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
   * Store an object contents, along with headers.
   *
   * @param {string} key object key
   * @param {Response} res response to store
   * @returns result obtained from S3
   */
  async store(key, res) {
    const { log } = this;
    const body = await res.buffer();
    const zipped = await gzip(body);

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
    await this.sendToS3andR2(PutObjectCommand, input);
    log.info(`object uploaded to: ${input.Bucket}/${input.Key}`);
  }

  /**
   * Store an object contents, along with metadata.
   *
   * @param {string} path object key
   * @param {Buffer|string} body data to store
   * @param {string} [contentType] content type. defaults to 'application/octet-stream'
   * @param {object} [meta] metadata to store with the object. defaults to '{}'
   * @param {boolean} [compress = true]
   * @returns result obtained from S3
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
    const res = await this.sendToS3andR2(PutObjectCommand, input);
    this.log.info(`object uploaded to: ${input.Bucket}/${input.Key}`);
    return res;
  }

  /**
   * Updates the metadata
   * @param {string} path
   * @param {object} meta
   * @param {object} opts
   * @returns {Promise<*>}
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
    const result = await this.sendToS3andR2(CopyObjectCommand, input);
    this.log.info(`Metadata updated for: ${input.CopySource}`);
    return result;
  }

  /**
   * Copy an object in the same bucket.
   *
   * @param {string} src source key
   * @param {string} dst destination key
   * @param {CopyOptions} [opts]
   * @returns result obtained from S3
   */
  async copy(src, dst, opts = {}) {
    const key = sanitizeKey(src);
    const input = {
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
      await this.sendToS3andR2(CopyObjectCommand, input);
      this.log.info(`object copied from ${input.CopySource} to: ${input.Bucket}/${input.Key}`);
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
   * Remove object(s)
   *
   * @param {string|string[]} path source key(s)
   * @returns result obtained from S3
   */
  async remove(path) {
    if (Array.isArray(path)) {
      const input = {
        Bucket: this.bucket,
        Delete: {
          Objects: path.map((p) => ({ Key: sanitizeKey(p) })),
        },
      };
      // delete on s3 and r2 (mirror) in parallel
      try {
        const result = await this.sendToS3andR2(DeleteObjectsCommand, input);
        this.log.info(`${result.Deleted.length} objects deleted from bucket ${input.Bucket}.`);
        return result;
      } catch (e) {
        const msg = `removing ${input.Delete.length} objects from bucket ${input.Bucket} failed: ${e.message}`;
        this.log.error(msg);
        const e2 = new Error(msg);
        e2.status = e.$metadata.httpStatusCode;
        throw e2;
      }
    }

    const input = {
      Bucket: this.bucket,
      Key: sanitizeKey(path),
    };
    // delete on s3 and r2 (mirror) in parallel
    try {
      const result = await this.sendToS3andR2(DeleteObjectCommand, input);
      this.log.info(`object deleted: ${input.Bucket}/${input.Key}`);
      return result;
    } catch (e) {
      const msg = `removing ${input.Bucket}/${input.Key} from storage failed: ${e.message}`;
      this.log.error(msg);
      const e2 = new Error(msg);
      e2.status = e.$metadata.httpStatusCode;
      throw e2;
    }
  }

  /**
   * Returns a list of object below the given prefix
   * @param {string} prefix
   * @returns {Promise<ObjectInfo[]>}
   */
  async list(prefix) {
    let ContinuationToken;
    const objects = [];
    do {
      // eslint-disable-next-line no-await-in-loop
      const result = await this.client.send(new ListObjectsV2Command({
        Bucket: this.bucket,
        ContinuationToken,
        Prefix: prefix,
      }));
      ContinuationToken = result.IsTruncated ? result.NextContinuationToken : '';
      (result.Contents || []).forEach((content) => {
        const key = content.Key;
        objects.push({
          key,
          lastModified: content.LastModified,
          contentLength: content.Size,
          contentType: mime.getType(key),
          path: `${key.substring(prefix.length)}`,
        });
      });
    } while (ContinuationToken);
    return objects;
  }

  async listFolders(prefix) {
    let ContinuationToken;
    const folders = [];
    do {
      // eslint-disable-next-line no-await-in-loop
      const result = await this.client.send(new ListObjectsV2Command({
        Bucket: this.bucket,
        ContinuationToken,
        Prefix: prefix,
        Delimiter: '/',
      }));
      ContinuationToken = result.IsTruncated ? result.NextContinuationToken : '';
      (result.CommonPrefixes || []).forEach(({ Prefix }) => {
        folders.push(Prefix);
      });
    } while (ContinuationToken);
    return folders;
  }

  /**
   * Copies the tree below src to dst.
   * @param {string} src Source prefix
   * @param {string} dst Destination prefix
   * @param {ObjectFilter} filter Filter function
   * @param {CopyOptions} [opts={}]
   * @returns {Promise<*[]>}
   */
  async copyDeep(src, dst, filter = () => true, opts = {}) {
    const { log } = this;
    const tasks = [];
    const Prefix = sanitizeKey(src);
    const dstPrefix = sanitizeKey(dst);
    this.log.info(`fetching list of files to copy ${this.bucket}/${Prefix} => ${dstPrefix}`);
    (await this.list(Prefix)).forEach((obj) => {
      const {
        path, key, contentLength, contentType,
      } = obj;
      if (filter(obj)) {
        tasks.push({
          src: key,
          path,
          contentLength,
          contentType,
          dst: `${dstPrefix}${path}`,
        });
      }
    });

    let errors = 0;
    const changes = [];
    await processQueue(tasks, async (task) => {
      log.info(`copy to ${task.dst}`);
      const input = {
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

  async rmdir(src) {
    const { log } = this;
    src = sanitizeKey(src);
    log.info(`fetching list of files to delete from ${this.bucket}/${src}`);
    const items = await this.list(src);

    let oks = 0;
    let errors = 0;
    await processQueue(items, async (item) => {
      const { key } = item;
      log.info(`deleting ${this.bucket}/${key}`);
      const input = {
        Bucket: this.bucket,
        Key: key,
      };

      try {
        // delete on s3 and r2 (mirror) in parallel
        await this.sendToS3andR2(DeleteObjectCommand, input);
        oks += 1;
      } catch (e) {
        // at least 1 cmd failed
        log.warn(`error while deleting ${key}: ${e.$metadata.httpStatusCode}`);
        errors += 1;
      }
    }, 64);
    log.info(`deleted ${oks} files (${errors} errors)`);
  }
}

/**
 * The Helix Storage provides a factory for simplified bucket operations to S3 and R2
 * @implements {HelixStorageType}
 */
export class HelixStorage {
  static fromContext(context) {
    if (!context.attributes.storage) {
      const {
        HELIX_HTTP_CONNECTION_TIMEOUT: connectionTimeout = 5000,
        HELIX_HTTP_SOCKET_TIMEOUT: socketTimeout = 15000,
        HELIX_HTTP_S3_KEEP_ALIVE: keepAlive,
        CLOUDFLARE_ACCOUNT_ID: r2AccountId,
        CLOUDFLARE_R2_ACCESS_KEY_ID: r2AccessKeyId,
        CLOUDFLARE_R2_SECRET_ACCESS_KEY: r2SecretAccessKey,
      } = context.env;

      context.attributes.storage = new HelixStorage({
        connectionTimeout,
        socketTimeout,
        r2AccountId,
        r2AccessKeyId,
        r2SecretAccessKey,
        keepAlive: String(keepAlive) === 'true',
        log: context.log,
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
   * Create an instance
   *
   * @param {object} [opts] options
   * @param {string} [opts.region] AWS region
   * @param {string} [opts.accessKeyId] AWS access key
   * @param {string} [opts.secretAccessKey] AWS secret access key
   * @param {strong} [opts.r2AccountId]
   * @param {strong} [opts.r2AccessKeyId]
   * @param {strong} [opts.r2SecretAccessKey]
   * @param {object} [opts.log] logger
   */
  constructor(opts = {}) {
    const {
      region = 'us-east-1', accessKeyId, secretAccessKey,
      connectionTimeout, socketTimeout,
      r2AccountId, r2AccessKeyId, r2SecretAccessKey,
      log = console,
      keepAlive = true,
    } = opts;

    if (region && accessKeyId && secretAccessKey) {
      log.debug('Creating S3Client with credentials');
      this._s3 = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        requestHandler: new NodeHttpHandler({
          httpsAgent: new Agent({
            keepAlive,
          }),
          connectionTimeout,
          socketTimeout,
        }),
      });
    } else {
      log.debug('Creating S3Client without credentials');
      this._s3 = new S3Client({
        region,
        requestHandler: new NodeHttpHandler({
          httpsAgent: new Agent({
            keepAlive,
          }),
          connectionTimeout,
          socketTimeout,
        }),
      });
    }

    // initializing the R2 client which is used for mirroring all S3 writes to R2
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
    this._log = log;
  }

  s3() {
    return this._s3;
  }

  /**
   * creates a bucket instance that allows to perform storage related operations.
   * @param bucketId
   * @returns {Bucket}
   */
  bucket(bucketId) {
    if (!this._s3) {
      throw new Error('storage already closed.');
    }
    if (!bucketId) {
      throw new Error('bucketId is required.');
    }
    return new Bucket({
      bucketId,
      s3: this._s3,
      r2: this._r2,
      log: this._log,
    });
  }

  /**
   * @returns {Bucket}
   */
  contentBus() {
    return this.bucket('helix-content-bus');
  }

  /**
   * @returns {Bucket}
   */
  codeBus() {
    return this.bucket('helix-code-bus');
  }

  /**
   * @returns {Bucket}
   */
  mediaBus() {
    return this.bucket('helix-media-bus');
  }

  /**
   * @returns {Bucket}
   */
  configBus() {
    return this.bucket('helix-config-bus');
  }

  /**
   * Close this storage. Destroys the S3 client used.
   */
  close() {
    this._s3?.destroy();
    this._r2?.destroy();
    delete this._s3;
    delete this._r2;
  }
}
