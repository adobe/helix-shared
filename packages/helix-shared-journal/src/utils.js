/*
 * Copyright 2023 Adobe. All rights reserved.
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
 * Bucket to use for logging.
 */
const DEFAULT_BUCKET_NAME = 'helix-adobe-logs';

/**
 * Index file in project folder. This is a LF separated text file with
 * the list of all log files in ascending order.
 */
export const INDEX_FILE = '.index';

/**
 * Resolve options object to contain all properties.
 *
 * @param {import("./Journal.js").Options} [opts]
 * @returns {Required<import("./Journal.js").Options>}
 */
export function resolveOptions(opts = {}) {
  return {
    bucketName: DEFAULT_BUCKET_NAME,
    ...opts,
  };
}
