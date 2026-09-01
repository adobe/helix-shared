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

/* eslint-disable class-methods-use-this -- mandatory-primitive stubs intentionally ignore `this` */
/**
 * Convenience base class for `StorageBackend` implementations (a plain, un-typed convention:
 * `get`, `head`, `put`, `copy`, `remove`, `list`, `metadata`, `putMeta`, `listFolders`,
 * `browse`). Subclasses only need to implement the 6 mandatory primitives (`get`, `head`,
 * `put`, `copy`, `remove`, `list`) to get all 10 methods for free; `metadata`/`putMeta`/
 * `listFolders`/`browse` have generic default bodies here, in terms of the mandatory
 * primitives, overridable for efficiency.
 */
export class AbstractStorageBackend {
  async get() {
    throw new Error('get() not implemented');
  }

  async head() {
    throw new Error('head() not implemented');
  }

  async put() {
    throw new Error('put() not implemented');
  }

  async copy() {
    throw new Error('copy() not implemented');
  }

  async remove() {
    throw new Error('remove() not implemented');
  }

  async list() {
    throw new Error('list() not implemented');
  }

  /**
   * Generic default: derives metadata from {@link StorageBackend#head}.
   */
  async metadata(key) {
    const head = await this.head(key);
    return head?.metadata;
  }

  /**
   * Generic default: replaces metadata via a self-copy with `metadataDirective: 'REPLACE'`.
   * `opts` is merged verbatim (not nested) into the underlying copy call.
   */
  async putMeta(path, meta, opts = {}) {
    return this.copy(path, path, {
      metadata: meta,
      metadataDirective: 'REPLACE',
      copyOpts: opts,
    });
  }

  /**
   * Generic default: `list(prefix, {shallow: true})`, filtered to folder entries.
   */
  async listFolders(prefix) {
    const { objects } = await this.list(prefix, { shallow: true });
    return objects
      .filter((o) => o.isFolder)
      .map((o) => o.name);
  }

  /**
   * Generic default: fetches up to `opts.maxItems` entries in a single `list()` call and
   * clears the continuation token. This sacrifices true single-page pagination — backends
   * with native cursor support (e.g. S3's `ListObjectsV2` continuation tokens) should
   * override this method to expose real paging.
   */
  async browse(prefix, opts = {}) {
    const { maxItems } = opts;
    const result = await this.list(prefix, { shallow: true, maxItems });
    return { ...result, continuationToken: undefined };
  }
}
