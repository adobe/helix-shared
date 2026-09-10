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

/**
 * Normalized error thrown by {@link QueueBackend} implementations for any failure that
 * originates from the underlying provider SDK (SQS, Azure Service Bus, ...). Every backend
 * wraps its SDK-native error into one of these before throwing, so callers ({@link Queue}
 * or application code built on `QueueBackend`) can branch on `.status`/`.code` without
 * knowing which backend they're talking to. The original, raw SDK error is always preserved,
 * unmodified, as `.cause`.
 *
 * @property {number} [status] normalized status code, when the provider has one
 * @property {string} [code] backend-specific error code, verbatim, when the SDK exposes one
 * @property {string} [backend] the originating backend's `name` (e.g. `'SQS'`)
 * @property {Error} [cause] the original, raw, backend-native SDK error, unmodified
 */
export class QueueError extends Error {
  /**
   * @param {string} message
   * @param {Object} [opts]
   * @param {number} [opts.status]
   * @param {string} [opts.code]
   * @param {string} [opts.backend]
   * @param {Error} [opts.cause] passed through to the standard `Error` `cause` option
   */
  constructor(message, {
    status, code, backend, cause,
  } = {}) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'QueueError';
    this.status = status;
    this.code = code;
    this.backend = backend;
  }
}
