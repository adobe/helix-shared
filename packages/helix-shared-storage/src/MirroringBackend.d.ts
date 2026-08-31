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

export interface MirroringBackendOptions {
  primary: StorageBackend;
  secondaries?: StorageBackend[];
  log?: Console;
}

/**
 * A {@link StorageBackend} that mirrors writes to N backends of the same family, reading only
 * from `primary`. Failures are tagged with the failing backend's `name`.
 */
export declare class MirroringBackend implements StorageBackend {
  constructor(opts: MirroringBackendOptions);

  get name(): string;

  get bucketName(): string;

  get client(): unknown;

  get(...args: Parameters<StorageBackend['get']>): ReturnType<StorageBackend['get']>;

  head(...args: Parameters<StorageBackend['head']>): ReturnType<StorageBackend['head']>;

  metadata(...args: Parameters<StorageBackend['metadata']>): ReturnType<StorageBackend['metadata']>;

  put(...args: Parameters<StorageBackend['put']>): ReturnType<StorageBackend['put']>;

  putMeta(...args: Parameters<StorageBackend['putMeta']>): ReturnType<StorageBackend['putMeta']>;

  copy(...args: Parameters<StorageBackend['copy']>): ReturnType<StorageBackend['copy']>;

  remove(...args: Parameters<StorageBackend['remove']>): ReturnType<StorageBackend['remove']>;

  list(...args: Parameters<StorageBackend['list']>): ReturnType<StorageBackend['list']>;

  listFolders(prefix: string): ReturnType<StorageBackend['listFolders']>;

  browse(...args: Parameters<StorageBackend['browse']>): ReturnType<StorageBackend['browse']>;
}
