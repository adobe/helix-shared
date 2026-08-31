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

import { StorageBackend } from "./StorageBackend.d";
import { Bucket } from "./Bucket.d";

/**
 * Information about a single entry — file or folder — returned by
 * {@link Bucket.list} or {@link Bucket.browse}.
 *
 * When the entry represents a common prefix (folder), `isFolder` is `true`
 * and `lastModified`/`contentLength`/`contentType` are absent.
 */
export interface ObjectInfo {
  /** absolute object key. For folders, ends with `/`. */
  key: string;
  /**
   * Basename of the entry — the last path segment, with any trailing `/`
   * stripped. E.g. `2024` for a folder `/blog/2024/`, `post.md` for an
   * object key `/blog/post.md`.
   */
  name: string;
  /** `true` for folders; `false` for object keys (files). */
  isFolder: boolean;
  /** last-modified timestamp. Files only. */
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
   * Additional, backend-native fields to merge into the underlying copy call
   * (e.g. AWS's `CacheControl`, `ContentType`, `Tagging`, ...).
   */
  copyOpts?: Record<string, unknown>;
}

export interface BrowseOptions {
  /**
   * Continuation token returned by a previous {@link Bucket.browse} call.
   * Pass it back unchanged to fetch the next page; omit to start from the
   * beginning of the listing.
   */
  continuationToken?: string;
  /**
   * Maximum number of entries to return in this page. Defaults to the
   * backend's own default when omitted.
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
 * when {@link Bucket.browse} hits a truncated page.
 */
export interface ListResult {
  /**
   * The sanitized prefix that was actually queried (always ends with `/`,
   * or is `''` when the whole bucket was listed).
   */
  prefix: string;
  /** the page of entries (files and, for shallow listings, folders) */
  objects: ObjectInfo[];
  /** continuation token to pass back to {@link Bucket.browse} for the next page */
  continuationToken?: string;
}

/**
 * Aggregated result returned by {@link Bucket.remove} when invoked with an array of keys.
 */
export interface BulkDeleteResult {
  Deleted: unknown[];
  Errors: unknown[];
}

/**
 * Options for {@link HelixStorage}.
 */
export interface HelixStorageOptions {
  /**
   * JSON string mapping bus keys (`config`, `code`, `content`, `media`, `source`)
   * to their actual bucket names. If omitted, defaults to `helix-<key>-bus`.
   */
  bucketNames?: string;
  /** Logger; defaults to `console`. */
  log?: Console;
  /**
   * Factory used to resolve a {@link StorageBackend} for a given bucket id. Backend packages
   * (e.g. `@adobe/helix-shared-storage-s3`) provide this, typically via a convenience
   * `HelixStorage` subclass overriding `fromContext`. The second argument is an opaque bag
   * forwarded verbatim from {@link HelixStorage.bucket} — core does not interpret it;
   * individual backend packages define whichever options they support (e.g.
   * `@adobe/helix-shared-storage-s3`'s `{ disableR2 }`).
   */
  backendFactory?: (bucketId: string, opts: Record<string, unknown>) => StorageBackend;
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

export { resolveMetadataForCopy } from "./Bucket.d";
export { Bucket } from "./Bucket.d";

/**
 * The Helix Storage provides a factory for simplified bucket operations against a pluggable
 * storage backend family. A single instance is configured with one `backendFactory`, used to
 * resolve every bucket it hands out.
 */
export declare class HelixStorage {
  /**
   * Get (and lazily construct + cache) a {@link HelixStorage} instance for a Helix
   * function `context`. The instance is stored on `context.attributes.storage`.
   */
  static fromContext(context: HelixStorageContext, opts?: Partial<HelixStorageOptions>): HelixStorage;

  constructor(opts?: HelixStorageOptions);

  /**
   * Create a {@link Bucket} for the given bucket id. `opts` is an opaque bag forwarded
   * verbatim to the `backendFactory` — core does not interpret it; individual backend
   * packages define whichever options they support (e.g.
   * `@adobe/helix-shared-storage-s3`'s `{ disableR2 }`).
   *
   * @param bucketId bucket name
   * @param opts backend-specific options, passed through as-is
   */
  bucket(bucketId: string, opts?: Record<string, unknown>): Bucket;

  /** Bucket for the configured `content` bus. */
  contentBus(opts?: Record<string, unknown>): Bucket;

  /** Bucket for the configured `code` bus. */
  codeBus(opts?: Record<string, unknown>): Bucket;

  /**
   * Bucket for the configured `source` bus. Mirroring defaults to disabled here,
   * since the source bus is typically not mirrored; pass `{ disableR2: false }` to override
   * with the default S3/R2 backend.
   */
  sourceBus(opts?: Record<string, unknown>): Bucket;

  /** Bucket for the configured `media` bus. */
  mediaBus(opts?: Record<string, unknown>): Bucket;

  /** Bucket for the configured `config` bus. */
  configBus(opts?: Record<string, unknown>): Bucket;

  /**
   * Close this storage, rendering this instance unusable.
   */
  close(): void;
}
