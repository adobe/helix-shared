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

import { Response } from '@adobe/fetch';
import { StorageBackend, CommonObjectMeta } from './StorageBackend.d';
import {
  ObjectFilter, CopyOptions, BrowseOptions, ListOptions, ListResult, BulkDeleteResult,
} from './storage.d';

export interface BucketOptions {
  backend: StorageBackend;
  log?: Console;
}

/**
 * Resolves the metadata that should be written by a copy operation, given the source
 * object's common metadata and the rename/add directives from {@link CopyOptions}.
 */
export declare function resolveMetadataForCopy(
  commonMeta?: CommonObjectMeta,
  renameMeta?: Record<string, string>,
  addMeta?: Record<string, string>,
): Record<string, string>;

/**
 * Thin, backend-agnostic facade wrapping a single {@link StorageBackend}. All write operations
 * are dispatched through the backend (which handles any mirroring internally); reads go
 * straight to the backend as well.
 */
export declare class Bucket {
  constructor(opts: BucketOptions);

  /** the backend's native client (e.g. an `S3Client`); throws if the backend has none */
  get client(): unknown;

  /** the bucket name */
  get bucket(): string;

  /** the logger */
  get log(): Console;

  get(key: string, meta?: Record<string, unknown>): Promise<Buffer | null>;

  head(path: string, headOpts?: Record<string, unknown>): Promise<(CommonObjectMeta & Record<string, unknown>) | null>;

  metadata(key: string): Promise<Record<string, string> | undefined>;

  store(key: string, res: Response): Promise<void>;

  put(
    path: string,
    body: Buffer | string,
    contentType?: string,
    meta?: Record<string, string>,
    compress?: boolean,
  ): Promise<CommonObjectMeta & Record<string, unknown>>;

  putMeta(
    path: string,
    meta: Record<string, string>,
    opts?: Record<string, unknown>,
  ): Promise<unknown>;

  copy(src: string, dst: string, opts?: CopyOptions): Promise<(CommonObjectMeta & Record<string, unknown>) | undefined>;

  remove(path: string): Promise<Record<string, unknown>>;

  remove(
    paths: string[],
    sourceInfo?: string,
    stopOnError?: boolean,
  ): Promise<BulkDeleteResult>;

  list(prefix: string, opts?: ListOptions): Promise<ListResult>;

  listFolders(prefix: string): Promise<string[]>;

  browse(prefix: string, opts?: BrowseOptions): Promise<ListResult>;

  copyDeep(
    src: string,
    dst: string,
    filter?: ObjectFilter,
    opts?: CopyOptions,
  ): Promise<Array<{
    src: string;
    dst: string;
    contentLength?: number;
    contentType?: string | null;
  }>>;

  rmdir(src: string): Promise<BulkDeleteResult>;
}
