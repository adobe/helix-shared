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

import { S3Client } from '@aws-sdk/client-s3';
import { AbstractStorageBackend } from '@adobe/helix-shared-storage';

export interface S3BackendOptions {
  client: S3Client;
  /** backend family tag used for error tagging when mirrored, e.g. `'S3'` or `'R2'` */
  name: string;
  bucketName: string;
  log?: Console;
}

/**
 * S3 (and Cloudflare R2) `StorageBackend` implementation. A single instance wraps one
 * `S3Client` bound to one bucket; R2 mirroring is achieved by composing two `S3Backend`
 * instances via `MirroringBackend`.
 */
export declare class S3Backend extends AbstractStorageBackend {
  constructor(opts: S3BackendOptions);

  get name(): string;

  get bucketName(): string;

  get client(): S3Client;
}
