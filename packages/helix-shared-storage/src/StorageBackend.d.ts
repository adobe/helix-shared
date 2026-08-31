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

import { ListResult, BrowseOptions } from './storage.d';

/**
 * Common, backend-agnostic object metadata fields (lowerCamelCase). Every {@link StorageBackend}
 * method that returns object metadata returns (at least) these fields, plus a spread of
 * whatever native/raw fields the backend's underlying SDK response carries (e.g. AWS's
 * PascalCase `ETag`/`VersionId`/...). Since the common fields are lowerCamelCase and AWS's
 * are PascalCase, neither clobbers the other.
 */
export interface CommonObjectMeta {
  etag?: string;
  versionId?: string;
  contentLength?: number;
  contentType?: string;
  contentEncoding?: string;
  cacheControl?: string;
  contentDisposition?: string;
  expires?: string | Date;
  lastModified?: string | Date;
  metadata?: Record<string, string>;
  [key: string]: unknown;
}

export interface PutOptions {
  contentType?: string;
  contentEncoding?: string;
  cacheControl?: string;
  contentDisposition?: string;
  expires?: string;
  metadata?: Record<string, string>;
}

/**
 * Options passed from {@link Bucket} to {@link StorageBackend.copy}. This is the
 * backend-level shape (already resolved from a source HEAD when needed) — distinct from the
 * public `CopyOptions` in `storage.d.ts`, which is the `Bucket.copy()`-facing shape with
 * `renameMetadata`/`addMetadata`. See {@link ./storage.d.CopyOptions} for that shape.
 */
export interface CopyOptions {
  contentType?: string;
  contentEncoding?: string;
  cacheControl?: string;
  contentDisposition?: string;
  expires?: string | Date;
  metadata?: Record<string, string>;
  metadataDirective?: 'COPY' | 'REPLACE';
  /** additional backend-native fields to merge into the underlying copy call, verbatim */
  copyOpts?: Record<string, unknown>;
}

export interface RemoveOptions {
  sourceInfo?: string;
  stopOnError?: boolean;
}

/** raw, backend-native result of removing a single key */
export interface RemoveResult {
  [key: string]: unknown;
}

/** aggregated result of removing an array of keys */
export interface BulkRemoveResult {
  Deleted: unknown[];
  Errors: unknown[];
}

export interface BackendListOptions {
  shallow?: boolean;
  maxItems?: number;
}

/**
 * The pluggable storage backend interface. A `StorageBackend` wraps a single bucket/container
 * against a single cloud storage family (S3, Azure Blob, ...). `HelixStorage` is configured
 * with a `backendFactory` that produces one `StorageBackend` per bucket id; {@link Bucket} is a
 * thin, backend-agnostic facade over it.
 *
 * Implementors only need to provide the 6 mandatory primitives below; `metadata`, `putMeta`,
 * `listFolders`, and `browse` have generic default implementations in
 * {@link AbstractStorageBackend}, overridable for efficiency (e.g. Azure can implement
 * `listFolders` via `listBlobsByHierarchy` instead of the generic list+filter fallback).
 */
export declare interface StorageBackend {
  /** backend family tag used for error tagging when mirrored, e.g. `'S3'`, `'R2'`, `'Azure'` */
  readonly name: string;

  /** the bucket/container name this backend instance is bound to */
  readonly bucketName: string;

  /** the backend's native client, if it has a meaningful one to expose (e.g. an `S3Client`) */
  readonly client?: unknown;

  /**
   * Fetch an object's body.
   *
   * @param key already-sanitized object key
   * @param meta optional output object that receives the object's metadata / system headers
   * @returns object contents as a Buffer, or `null` when the key does not exist
   */
  get(key: string, meta?: Record<string, unknown>): Promise<Buffer | null>;

  /**
   * Issue a HEAD on the object.
   *
   * @param key already-sanitized object key
   * @param opts extra, backend-native fields merged into the underlying HEAD call
   * @returns a {@link CommonObjectMeta} (plus raw backend fields), or `null` if not found
   */
  head(key: string, opts?: Record<string, unknown>): Promise<(CommonObjectMeta & Record<string, unknown>) | null>;

  /**
   * Return an object's user metadata. Generic default: `(await head(key))?.metadata`.
   */
  metadata(key: string): Promise<Record<string, string> | undefined>;

  /**
   * Store an object's contents along with metadata/system headers.
   *
   * @param key already-sanitized object key
   * @param body data to store
   * @param opts common put options
   */
  put(key: string, body: Buffer | string, opts?: PutOptions): Promise<CommonObjectMeta & Record<string, unknown>>;

  /**
   * Replace an object's user metadata. Generic default: a self-copy with
   * `metadataDirective: 'REPLACE'`.
   *
   * @param opts raw, backend-native fields merged into the underlying call (NOT nested
   *  under `copyOpts` — this mirrors `Bucket.putMeta()`'s own raw passthrough)
   */
  putMeta(key: string, meta: Record<string, string>, opts?: Record<string, unknown>): Promise<unknown>;

  /**
   * Copy an object within the same bucket. Already-resolved `opts` (system headers +
   * metadata) are provided by {@link Bucket} when the copy needs to preserve/rewrite
   * metadata; backends should normalize a missing source into an error with `status: 404`.
   */
  copy(src: string, dst: string, opts?: CopyOptions): Promise<CommonObjectMeta & Record<string, unknown>>;

  /**
   * Remove one or more objects. When passed an array, the backend owns any batching/chunking
   * required by its own service limits.
   */
  remove(pathOrPaths: string | string[], opts?: RemoveOptions): Promise<RemoveResult | BulkRemoveResult>;

  /**
   * Auto-paginated listing of entries below `prefix`. Unlike {@link StorageBackend.browse},
   * pages through the entire result (up to `opts.maxItems`) before resolving.
   */
  list(prefix: string, opts?: BackendListOptions): Promise<ListResult>;

  /**
   * Convenience wrapper returning only folder basenames directly below `prefix`. Generic
   * default: `(await list(prefix, {shallow: true})).objects.filter(o => o.isFolder).map(o => o.name)`.
   */
  listFolders(prefix: string): Promise<string[]>;

  /**
   * Single-page, always-shallow listing for paginated UI browsing. Generic default sacrifices
   * true single-page pagination (fetches up to `maxItems` in one shot with no continuation
   * token) — backends with native cursor support (S3) should override this.
   */
  browse(prefix: string, opts?: BrowseOptions): Promise<ListResult>;
}
