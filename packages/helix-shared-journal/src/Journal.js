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

import Reader from './Reader.js';
import { resolveOptions } from './utils.js';
import Writer from './Writer.js';

/**
 * @typedef {{
 *  bucketName?: string;
 * }} Options
 */

/**
 * Create a journal log reader of an org and site.
 *
 * @param {String} org org
 * @param {String|undefined} site site, optional
 * @param {Logger} log logger
 * @param {Options} [opts] options
 * @returns {Reader} reader
 */
function createReader(org, site, log, opts) {
  return new Reader(org, site, log, resolveOptions(opts));
}

/**
 * Create a journal log writer for an org and site.
 *
 * @param {String} org org
 * @param {String|undefined} site site, optional
 * @param {Logger} log logger
 * @param {Options} [opts] options
 * @returns {Writer} writer
 */
function createWriter(org, site, log, opts) {
  return new Writer(org, site, log, resolveOptions(opts));
}

export const Journal = {
  createReader,
  createWriter,
};
