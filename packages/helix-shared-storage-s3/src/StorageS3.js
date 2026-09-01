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

import { Storage } from '@adobe/helix-shared-storage';
import { createDefaultBackendFactory } from './createDefaultBackendFactory.js';

/**
 * `Storage` subclass pre-wired with the default S3(+R2) `backendFactory`, so existing
 * consumers of `Storage.fromContext()` migrate with a one-line import change:
 *
 * ```diff
 * - import { Storage } from '@adobe/helix-shared-storage';
 * + import { StorageS3 as Storage } from '@adobe/helix-shared-storage-s3';
 * ```
 *
 * No other call site changes are required.
 */
export class StorageS3 extends Storage {
  /**
   * Mapping from lowercase HTTP header name to the corresponding `*Command` input property.
   * Carried over unchanged from core's pre-refactor `HelixStorage.AWS_S3_SYSTEM_HEADERS`
   * static.
   */
  static AWS_S3_SYSTEM_HEADERS = {
    'content-type': 'ContentType',
    'content-disposition': 'ContentDisposition',
    'content-encoding': 'ContentEncoding',
    'content-language': 'ContentLanguage',
  };

  /**
   * @param {import('@adobe/helix-shared-storage').StorageContext} context
   * @param {Partial<import('@adobe/helix-shared-storage').StorageOptions>} [opts]
   * @returns {StorageS3}
   */
  static fromContext(context, opts = {}) {
    return super.fromContext(context, {
      backendFactory: createDefaultBackendFactory(context.env, { log: context.log }),
      ...opts,
    });
  }
}
