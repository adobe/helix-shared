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
 * @typedef {Object} MirroringBackendOptions
 * @property {import('./AbstractStorageBackend.js').StorageBackend} primary
 * @property {import('./AbstractStorageBackend.js').StorageBackend[]} [secondaries]
 * @property {Console} [log]
 */

/**
 * A {@link StorageBackend} that mirrors writes to N backends of the same family (e.g. S3 +
 * R2), reading only from the `primary`. This generalizes the previous S3-only, exactly-2-client
 * mirroring: any number of `secondaries` may be configured, and failures are tagged by the
 * failing backend's identity (`name`), not by its position in the result array.
 *
 * Semantics: writes are dispatched to `[primary, ...secondaries]` in parallel. If all succeed,
 * the primary's result is returned. If any backend fails (primary or a secondary), the whole
 * call rejects with that backend's error, its `message` prefixed with `[<name>]` — matching the
 * first-failing-backend-in-array precedence of the original implementation when multiple fail.
 *
 * @implements {import('./AbstractStorageBackend.js').StorageBackend}
 */
export class MirroringBackend {
  /**
   * @param {MirroringBackendOptions} opts
   */
  constructor({ primary, secondaries = [], log = console }) {
    this._primary = primary;
    this._backends = [primary, ...secondaries];
    this._log = log;
  }

  get name() {
    return this._primary.name;
  }

  get bucketName() {
    return this._primary.bucketName;
  }

  get client() {
    return this._primary.client;
  }

  get(...args) {
    return this._primary.get(...args);
  }

  head(...args) {
    return this._primary.head(...args);
  }

  metadata(...args) {
    return this._primary.metadata(...args);
  }

  list(...args) {
    return this._primary.list(...args);
  }

  listFolders(...args) {
    return this._primary.listFolders(...args);
  }

  browse(...args) {
    return this._primary.browse(...args);
  }

  /**
   * Fans `method(...args)` out to every backend in parallel. Returns the primary's result if
   * all succeed; otherwise throws the first-failing backend's error (array order), tagged
   * with `[<backend.name>] ` on its message.
   */
  async _fanOut(method, args) {
    const settled = await Promise.allSettled(this._backends.map((b) => b[method](...args)));
    const zipped = settled.map((result, i) => ({ backend: this._backends[i], result }));
    const rejected = zipped.filter(({ result }) => result.status === 'rejected');
    if (!rejected.length) {
      return zipped[0].result.value;
    }
    const { backend, result } = rejected[0];
    const err = result.reason;
    err.message = `[${backend.name}] ${err.message}`;
    throw err;
  }

  put(...args) {
    return this._fanOut('put', args);
  }

  copy(...args) {
    return this._fanOut('copy', args);
  }

  remove(...args) {
    return this._fanOut('remove', args);
  }

  putMeta(...args) {
    return this._fanOut('putMeta', args);
  }
}
