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

import { StorageBackend } from './StorageBackend.d';

/**
 * Convenience base class implementing the 4 generic-default {@link StorageBackend} methods
 * (`metadata`, `putMeta`, `listFolders`, `browse`) in terms of the 6 mandatory primitives.
 * Subclasses must still implement `get`/`head`/`put`/`copy`/`remove`/`list`.
 */
export declare abstract class AbstractStorageBackend implements StorageBackend {
  abstract readonly name: string;

  abstract readonly bucketName: string;

  readonly client?: unknown;

  abstract get(...args: Parameters<StorageBackend['get']>): ReturnType<StorageBackend['get']>;

  abstract head(...args: Parameters<StorageBackend['head']>): ReturnType<StorageBackend['head']>;

  abstract put(...args: Parameters<StorageBackend['put']>): ReturnType<StorageBackend['put']>;

  abstract copy(...args: Parameters<StorageBackend['copy']>): ReturnType<StorageBackend['copy']>;

  abstract remove(...args: Parameters<StorageBackend['remove']>): ReturnType<StorageBackend['remove']>;

  abstract list(...args: Parameters<StorageBackend['list']>): ReturnType<StorageBackend['list']>;

  metadata(key: string): ReturnType<StorageBackend['metadata']>;

  putMeta(...args: Parameters<StorageBackend['putMeta']>): ReturnType<StorageBackend['putMeta']>;

  listFolders(prefix: string): ReturnType<StorageBackend['listFolders']>;

  browse(...args: Parameters<StorageBackend['browse']>): ReturnType<StorageBackend['browse']>;
}
