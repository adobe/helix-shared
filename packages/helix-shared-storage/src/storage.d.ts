/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  CopyObjectCommandInput,
  CopyObjectCommandOutput,
  CopyObjectResult,
  DeleteObjectCommandOutput,
  DeleteObjectsCommandOutput,
  HeadObjectCommandInput,
  HeadObjectCommandOutput,
  PutObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import { Response } from "@adobe/fetch";

/**
 * Information about a single entry — file or folder — returned by
 * {@link Bucket.list} or {@link Bucket.browse}.
 *
 * When the entry represents a common prefix (folder), `isFolder` is `true`
 * and `lastModified`/`contentLength`/`contentType` are absent.
 */
export interface ObjectInfo {
  /** absolute object key. For folders, S3's `CommonPrefix` value (ends with `/`). */
  key: string;
  /**
   * Path relative to the listing's `prefix` argument. Always starts with
   * `/` and never ends with `/` — the {@link ObjectInfo.isFolder} flag
   * carries the file/folder distinction. The same form the caller would
   * pass back as the `path` argument to drill into a folder.
   */
  path: string;
  /**
   * Basename of the entry — the last path segment, with any trailing `/`
   * stripped. E.g. `2024` for a folder `/blog/2024/`, `post.md` for an
   * object key `/blog/post.md`.
   */
  name: string;
  /** `true` for common prefixes (folders); `false` for object keys (files). */
  isFolder: boolean;
  /** last-modified timestamp as returned by S3. Files only. */
  lastModified?: Date;
  /** object size in bytes. Files only. */
  contentLength?: number;
  /** content type guessed from the key extension. Files only. */
  contentType?: string | null;
}

/**
 * Filter callback used by {@link Bucket.copyDeep}.
 *
 * @returns `true` if the object should be included in the operation
 */
export type ObjectFilter = (info: ObjectInfo) => boolean;

export interface CopyOptions {
  /**
   * Metadata keys to rename, in the form `{ [from]: to }`.
   * Removes the existing `from` metadata property from the copied object.
   * Use {@link CopyOptions.addMetadata} to keep the `from` property as well.
   */
  renameMetadata?: Record<string, string>;
  /**
   * Metadata to merge with existing metadata.
   * Properties are applied after {@link CopyOptions.renameMetadata}.
   */
  addMetadata?: Record<string, string>;
  /**
   * Additional fields to merge into the underlying `CopyObjectCommand` input
   * (e.g. `CacheControl`, `ContentType`, `Tagging`, ...).
   */
  copyOpts?: Partial<CopyObjectCommandInput>;
}

export interface BrowseOptions {
  /**
   * Continuation token returned by a previous {@link Bucket.browse} call.
   * Pass it back unchanged to fetch the next page; omit to start from the
   * beginning of the listing.
   */
  continuationToken?: string;
  /**
   * Maximum number of entries to return in this page (S3 `MaxKeys`). Capped
   * at 1000 by S3; defaults to the S3 default when omitted.
   */
  maxItems?: number;
}

export interface ListOptions {
  /** whether to list shallow, i.e. not recursive (uses `/` as delimiter). Default `false`. */
  shallow?: boolean;
  /** maximum number of items to return across all pages. Default unlimited. */
  maxItems?: number;
}

/**
 * Common return shape for {@link Bucket.list} and {@link Bucket.browse}.
 *
 * `continuationToken` is `undefined` for {@link Bucket.list} (which always
 * auto-paginates) and for an exhausted {@link Bucket.browse} call; it is set
 * when {@link Bucket.browse} hits a truncated S3 response.
 */
export interface ListResult {
  /** the page of entries (files and, for shallow listings, folders) */
  objects: ObjectInfo[];
  /** continuation token to pass back to {@link Bucket.browse} for the next page */
  continuationToken?: string;
}

/**
 * Aggregated result returned by {@link Bucket.remove} when invoked with an array of keys.
 */
export interface BulkDeleteResult {
  Deleted: NonNullable<DeleteObjectsCommandOutput["Deleted"]>;
  Errors: NonNullable<DeleteObjectsCommandOutput["Errors"]>;
}

/**
 * Options for {@link HelixStorage}.
 */
export interface HelixStorageOptions {
  /** AWS region. Defaults to `us-east-1`. */
  region?: string;
  /** AWS access key. If omitted, the SDK default credential chain is used. */
  accessKeyId?: string;
  /** AWS secret access key. */
  secretAccessKey?: string;
  /** Cloudflare account id used to derive the R2 endpoint. */
  r2AccountId?: string;
  /** R2 access key id. */
  r2AccessKeyId?: string;
  /** R2 secret access key. */
  r2SecretAccessKey?: string;
  /** When `true`, disables the R2 mirror entirely. */
  disableR2?: boolean;
  /**
   * JSON string mapping bus keys (`config`, `code`, `content`, `media`, `source`)
   * to their actual bucket names. If omitted, defaults to `helix-<key>-bus`.
   */
  bucketNames?: string;
  /** Whether to enable HTTP keep-alive on the underlying agent. Default `true`. */
  keepAlive?: boolean;
  /** Connection timeout in milliseconds passed to the HTTP handler. */
  connectionTimeout?: number;
  /** Socket timeout in milliseconds passed to the HTTP handler. */
  socketTimeout?: number;
  /** Logger; defaults to `console`. */
  log?: Console;
  /** Max retry attempts for the underlying S3 clients. */
  maxAttempts?: number;
}

/**
 * Helix function context shape used by {@link HelixStorage.fromContext}. The storage instance
 * is cached on `context.attributes.storage`; configuration is read from `context.env`.
 */
export interface HelixStorageContext {
  env: Record<string, string | undefined>;
  log: Console;
  attributes: {
    storage?: HelixStorage;
    [key: string]: unknown;
  };
}

/**
 * Mapping from bus key to bucket name as parsed by {@link parseBucketNames}.
 */
export interface BucketMap {
  config: string;
  code: string;
  content: string;
  media: string;
  source: string;
  [key: string]: string;
}

/**
 * Parses the `HELIX_BUCKET_NAMES` env var (a JSON object) into a {@link BucketMap}.
 * When `bucketNames` is falsy, returns the default `helix-<key>-bus` mapping.
 */
export declare function parseBucketNames(bucketNames?: string): BucketMap;

/**
 * Resolves the metadata that should be written by a copy operation, given the
 * source object's response headers and the rename/add directives from {@link CopyOptions}.
 */
export declare function resolveMetadataForCopy(
  s3Headers?: Record<string, unknown>,
  renameMeta?: Record<string, string>,
  addMeta?: Record<string, string>,
): Record<string, string>;

/**
 * Wraps a single S3 (and optional R2 mirror) bucket. All write operations are issued in
 * parallel against both clients; reads use the primary S3 client only.
 */
export declare interface Bucket {
  /** the primary S3 client used for reads and the first leg of writes */
  get client(): S3Client;

  /** the bucket name */
  get bucket(): string;

  /** the logger */
  get log(): Console;

  /**
   * Fetch an object's body. Transparently un-gzips objects whose `ContentEncoding` is `gzip`.
   *
   * @param key object key
   * @param meta optional output object that receives the object's metadata and selected
   *  system headers (`CacheControl`, `ContentType`, `ContentEncoding`, `ETag`, `Expires`,
   *  `LastModified`)
   * @returns object contents as a Buffer, or `null` when the key does not exist
   * @throws when the object cannot be loaded for a non-404 reason
   */
  get(key: string, meta?: Record<string, unknown>): Promise<Buffer | null>;

  /**
   * Issue a HEAD on the object and return the raw S3 response.
   *
   * @param path object key
   * @param headOpts extra fields merged into the `HeadObjectCommand` input
   * @returns the HEAD response, or `null` when the key does not exist
   */
  head(path: string, headOpts?: Partial<HeadObjectCommandInput>): Promise<HeadObjectCommandOutput | null>;

  /**
   * Return an object's user metadata.
   *
   * @param key object key
   * @returns the object's metadata map, or `undefined` when the key does not exist
   * @throws when the object cannot be loaded for a non-404 reason
   */
  metadata(key: string): Promise<Record<string, string> | undefined>;

  /**
   * Store an object body and headers from a fetch `Response`. The body is gzipped (or passed
   * through if the response is already `content-encoding: gzip`); response headers are mapped
   * to the corresponding S3 system headers / user metadata. Mirrored to R2 when enabled.
   *
   * Returns no value; failures throw.
   */
  store(key: string, res: Response): Promise<void>;

  /**
   * Store an object's contents along with metadata. Mirrored to R2 when enabled.
   *
   * @param path object key
   * @param body data to store
   * @param contentType content type. Defaults to `application/octet-stream`.
   * @param meta metadata to store with the object. Defaults to `{}`.
   * @param compress whether to gzip the body and set `ContentEncoding: gzip`. Defaults to `true`.
   * @returns the result from the primary S3 PutObject call
   */
  put(
    path: string,
    body: Buffer | string,
    contentType?: string,
    meta?: Record<string, string>,
    compress?: boolean,
  ): Promise<PutObjectCommandOutput>;

  /**
   * Replace an object's user metadata via a self-copy with `MetadataDirective: REPLACE`.
   *
   * @param path object key
   * @param meta new metadata (fully replaces existing metadata)
   * @param opts extra fields merged into the `CopyObjectCommand` input
   */
  putMeta(
    path: string,
    meta: Record<string, string>,
    opts?: Partial<CopyObjectCommandInput>,
  ): Promise<CopyObjectCommandOutput>;

  /**
   * Copy an object within the same bucket. When `addMetadata` or `renameMetadata` are
   * provided, the source's HEAD is consulted so that selected system headers are preserved
   * and metadata can be rewritten with `MetadataDirective: REPLACE`.
   *
   * @throws an error with `status: 404` when the source key does not exist
   */
  copy(src: string, dst: string, opts?: CopyOptions): Promise<CopyObjectResult | undefined>;

  /**
   * Remove a single object.
   *
   * @returns the raw `DeleteObject` response
   * @throws an error with `status` set to the HTTP status code on failure
   */
  remove(path: string): Promise<DeleteObjectCommandOutput>;

  /**
   * Remove multiple objects. Slices the input into chunks of up to 1000 keys (the S3 limit)
   * and issues them in parallel (concurrency 2).
   *
   * @param paths source keys
   * @param sourceInfo informational message used in log output
   * @param stopOnError when `true`, throws on the first chunk that fails; otherwise errors
   *  are accumulated into the returned `Errors` array
   */
  remove(
    paths: string[],
    sourceInfo?: string,
    stopOnError?: boolean,
  ): Promise<BulkDeleteResult>;

  /**
   * Auto-paginated listing of entries below `prefix + path`.
   *
   * `prefix` is the fixed root of the subtree; `path` is the subdirectory
   * within it (always interpreted as a directory: normalized to start *and*
   * end with `/`). When `shallow: true`, common prefixes (folders directly
   * below the listed dir) are returned alongside files; callers filter by
   * `isFolder` if they want only one kind. Each returned `ObjectInfo.path`
   * is relative to `prefix`.
   *
   * @param prefix root of the subtree to list under
   * @param path subdirectory within `prefix`. Defaults to `'/'`.
   */
  list(prefix: string, path?: string, opts?: ListOptions): Promise<ListResult>;

  /**
   * Convenience wrapper around {@link Bucket.list} that returns only the
   * folder paths directly below `prefix + path`. Equivalent to
   * `(await list(prefix, path, { shallow: true })).objects.filter(o => o.isFolder).map(o => o.path)`.
   *
   * @param prefix root of the subtree
   * @param path subdirectory within `prefix`. Defaults to `'/'`.
   * @returns folder paths, each relative to `prefix`, starting with `/`,
   *  never ending with `/`
   */
  listFolders(prefix: string, path?: string): Promise<string[]>;

  /**
   * Single-page, always-shallow listing intended for paginated UI browsing.
   *
   * Same `prefix` / `path` conventions as {@link Bucket.list}. Unlike `list`,
   * `browse` does not auto-page: it issues one `ListObjectsV2` call, returns
   * the entries it received, and exposes the `NextContinuationToken` (if
   * any) so the caller can request the next page on demand. `maxItems`
   * controls the page size only.
   *
   * Each returned `ObjectInfo.path` is in the same form as the `path`
   * argument, so the caller can pass an entry's `path` straight back to
   * drill in.
   *
   * @param prefix root of the subtree being browsed
   * @param path subdirectory within `prefix` to list. Defaults to `'/'`.
   */
  browse(prefix: string, path?: string, opts?: BrowseOptions): Promise<ListResult>;

  /**
   * Copies the tree below `src` to `dst`. Concurrency is fixed at 64; per-object errors are
   * logged but do not abort the operation.
   *
   * @param filter optional filter; only objects for which it returns truthy are copied
   * @returns the list of tasks that were copied successfully
   */
  copyDeep(
    src: string,
    dst: string,
    filter?: ObjectFilter,
    opts?: CopyOptions,
  ): Promise<Array<{
    src: string;
    dst: string;
    path: string;
    contentLength?: number;
    contentType?: string | null;
  }>>;

  /**
   * Recursively delete every object below `src`.
   */
  rmdir(src: string): Promise<BulkDeleteResult>;
}

/**
 * The Helix Storage provides a factory for simplified bucket operations to S3 and R2.
 *
 * Writes are mirrored: every mutating call (`put`, `store`, `copy`, `putMeta`, `remove`)
 * is dispatched in parallel to the primary S3 client and to the R2 client when enabled.
 */
export declare class HelixStorage {
  /**
   * Mapping from lowercase HTTP header name to the corresponding `*Command` input property.
   * Used internally to translate response headers into S3 system fields.
   */
  static AWS_S3_SYSTEM_HEADERS: Record<string, string>;

  /**
   * Get (and lazily construct + cache) a {@link HelixStorage} instance for a Helix
   * function `context`. The instance is stored on `context.attributes.storage`.
   */
  static fromContext(context: HelixStorageContext): HelixStorage;

  constructor(opts?: HelixStorageOptions);

  /** the underlying primary S3 client */
  s3(): S3Client;

  /**
   * Create a {@link Bucket} for the given bucket id.
   *
   * @param bucketId bucket name
   * @param disableR2 when `true`, this bucket will not mirror writes to R2
   *  (even if R2 is otherwise configured)
   */
  bucket(bucketId: string, disableR2?: boolean): Bucket;

  /** Bucket for the configured `content` bus. */
  contentBus(disableR2?: boolean): Bucket;

  /** Bucket for the configured `code` bus. */
  codeBus(disableR2?: boolean): Bucket;

  /**
   * Bucket for the configured `source` bus. R2 mirroring defaults to disabled here,
   * since the source bus is typically not mirrored.
   */
  sourceBus(disableR2?: boolean): Bucket;

  /** Bucket for the configured `media` bus. R2 mirroring is always disabled. */
  mediaBus(): Bucket;

  /** Bucket for the configured `config` bus. R2 mirroring is always disabled. */
  configBus(): Bucket;

  /**
   * Close this storage. Destroys the underlying S3 (and R2) clients and renders this
   * instance unusable.
   */
  close(): void;
}
