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

import { S3Client } from "@aws-sdk/client-s3";


export interface ObjectInfo {
  key: string;
  /** the path to the object, w/o the prefix */
  path: string;
  lastModified: string;
  contentLength: number;
  contentType: string;
}

/**
 * @returns {boolean} {@code true} if the object is accepted
 */
export type ObjectFilter = (info: ObjectInfo) => boolean;

export interface CopyOptions {
  /** 
   * metadata to rename, { [from:string] => to:string } 
   * Removes existing `from` metadata property from the copied object.
   * Use `addMetadata` to include the `from` property if needed.
   */
  renameMetadata?: Record<string, string>;
  /** 
   * Metadata to merge with existing metadata.
   * Properties are applied after `renameMetadata`.
   */
  addMetadata?: Record<string, unknown>;
}

export declare interface Bucket {
  get client(): S3Client;

  get bucket(): string;

  get log(): Console;

  get(key: string, meta?: object): Promise<Buffer | null>;

  head(path: string): Promise<object | null>;

  /**
   * Return an object's metadata.
   *
   * @param {string} key object key
   * @returns object metadata or null
   * @throws an error if the object could not be loaded due to an unexpected error.
   */
  metadata(key: string): Promise<object | null>;

  /**
   * Store an object contents, along with headers.
   *
   * @param {string} key object key
   * @param {Response} res response to store
   * @returns result obtained from S3
   */
  store(key: string, res: Response): Promise<object>;

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
  put(path: string, body: Buffer, contentType?: string, meta?: object, compress?: boolean): Promise<object>;

  /**
   * Updates the metadata
   * @param {string} path
   * @param {object} meta
   * @param {object} opts
   * @returns {Promise<*>}
   */
  putMeta(path: string, meta: object, opts?: object): Promise<object>;

  /**
   * Copy an object in the same bucket.
   *
   * @param {string} src source key
   * @param {string} dst destination key
   * @param {CopyOptions} [opts]
   * @returns result obtained from S3
   */
  copy(src: string, dst: string, opts?: CopyOptions): Promise<void>;

  /**
   * Remove object(s)
   *
   * @param {string|string[]} path source key(s)
   * @returns result obtained from S3
   */
  remove(path: string): Promise<object>;

  /**
   * Returns a list of object below the given prefix
   * @param {string} prefix
   * @returns {Promise<ObjectInfo[]>}
   */
  list(prefix: string): Promise<ObjectInfo[]>;

  listFolders(prefix: string): Promise<string[]>;

  /**
   * Copies the tree below src to dst.
   * @param {string} src Source prefix
   * @param {string} dst Destination prefix
   * @param {ObjectFilter} filter Filter function
   * @param {CopyOptions} [opts]
   * @returns {Promise<*[]>}
   */
  copyDeep(src: string, dst: string, filter?: ObjectFilter, opts?: CopyOptions): Promise<object[]>;

  rmdir(src: string): Promise<void>;
}

/**
 * The Helix Storage provides a factory for simplified bucket operations to S3 and R2
 */
export declare class HelixStorage {
  static fromContext(context: AdminContext): HelixStorage;

  s3(): S3Client;

  /**
   * creates a bucket instance that allows to perform storage related operations.
   * @param bucketId
   * @returns {Bucket}
   */
  bucket(bucketId: string): Bucket;;

  /**
   * @returns {Bucket}
   */
  contentBus(): Bucket;

  /**
   * @returns {Bucket}
   */
  codeBus(): Bucket;

  /**
   * @returns {Bucket}
   */
  mediaBus(): Bucket;

  /**
   * @returns {Bucket}
   */
  configBus(): Bucket;

  /**
   * Close this storage. Destroys the S3 client used.
   */
  close(): void;
}
