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

import { StorageBackend } from '@adobe/helix-shared-storage';

export interface CreateDefaultBackendFactoryOptions {
  log?: Console;
}

/**
 * Builds the default S3(+R2) `backendFactory` for `HelixStorage`, reading the same env vars
 * `HelixStorage.fromContext()` used to read directly before the storage-backend refactor.
 */
export declare function createDefaultBackendFactory(
  env?: Record<string, string | undefined>,
  opts?: CreateDefaultBackendFactoryOptions,
): (bucketId: string, opts?: { disableR2?: boolean }) => StorageBackend;
