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

import { promisify } from 'util';
import zlib from 'zlib';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Response } from '@adobe/fetch';
import { INDEX_FILE } from './utils.js';
import DateFormat from './DateFormat.js';

const gunzip = promisify(zlib.gunzip);

/**
 * @typedef LogLocation
 * @property {number} fileIndex file index into log file array
 * @property {number} entryIndex entry index into entries array of that log file
 *
 * @typedef LogEntries
 * @property {number} fileIndex file index into log file array
 * @property {number} entryIndex entry index into entries array of that log file
 * @property {LogEntry[]} entries log entry
 *
 * @typedef LogResult
 * @property {LogEntry[]} entries log entry
 * @property {string} nextToken optional next token
 */

/**
 * Return a slice of entries that don't exceed a given size
 * @param {number|undefined} maxSize maximum size
 * @param {LogEntry[]} obj.entries entries
 * @param {number} obj.fileIndex file index
 * @param {number} obj.entryIndex entry index
 * @param {object} next next iterator to return unless we exceed the maximum size
 * @returns {LogEntry[]} slice of entries
 */
function checkSize(maxSize, {
  entries, fileIndex, entryIndex, next,
}) {
  if (maxSize && JSON.stringify(entries).length >= maxSize) {
    let totalSize = 2;
    for (const [index, entry] of entries.entries()) {
      totalSize += JSON.stringify(entry).length + 1;
      if (totalSize > maxSize) {
        // return at least one item
        const count = Math.max(1, index);
        return {
          entries: entries.slice(0, count),
          next: { fileIndex, entryIndex: entryIndex + count },
        };
      }
    }
    /* c8 ignore next */
  }
  return next ? { entries, next } : { entries };
}

/**
 * Journal reader implemented in S3.
 */
export default class Reader {
  /**
   * @param {String} org org
   * @param {String|undefined} site site, optional
   * @param {import('@adobe/helix-universal').Logger} log logger
   * @param {Required<import('./Journal.js').Options>} opts options
   */
  constructor(org, site, log, opts) {
    this.prefix = site ? `${org}/${site}` : `${org}/.all`;
    this.log = log;
    this.bucketName = opts.bucketName;
  }

  /**
   * Initialize this log, retrieves the list of log files available.
   */
  async init() {
    this.s3 = new S3Client({});

    const { prefix } = this;

    try {
      const res = await this.s3.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: `${prefix}/${INDEX_FILE}`,
      }));
      const logContents = await new Response(res.Body, {}).text();
      this.logFiles = logContents.split('\n').map((name) => ({
        name,
        timestamp: DateFormat.parse(name).getTime(),
      }));
    } catch (e) {
      /* c8 ignore next 3 */
      if (e.$metadata?.httpStatusCode !== 404) {
        throw e;
      }
      this.logFiles = [];
    }
    return this;
  }

  /**
   * Read the log contents of a log file from S3.
   *
   * @param {number} fileIndex file index
   *
   * @returns {Promise<LogEntry[]>} array of entries
   */
  async #getLogContents(fileIndex) {
    const {
      prefix, logFiles, s3, log,
    } = this;

    const key = `${prefix}/${logFiles[fileIndex].name}.gz`;
    try {
      const res = await s3.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));
      const buf = await new Response(res.Body, {}).buffer();
      return JSON.parse(await gunzip(buf));
    } catch (e) {
      log.debug(e);
      throw new Error(`Unable to find journal file '${key}': ${e.message}`);
    }
  }

  /**
   * Find entries starting at a given date.
   *
   * @param {number} after timestamp
   *
   * @returns {Promise<LogEntries>} entries, fileIndex and entryIndex
   */
  async #findEntries(after) {
    const { logFiles } = this;

    // stop if there are no log files at all
    if (logFiles.length === 0) {
      return { entries: [] };
    }

    // find the last log file that started before the given date
    const fileIndex = logFiles.findLastIndex(({ timestamp }) => timestamp <= after);
    if (fileIndex === -1) {
      // none found, so return the very first log file
      return { entries: await this.#getLogContents(0), fileIndex: 0, entryIndex: 0 };
    }

    // we found a log file that was created earlier, so locate the first entry that started
    // at or after the given date
    let entries = await this.#getLogContents(fileIndex);

    const entryIndex = entries.findIndex(({ timestamp }) => timestamp >= after);
    if (entryIndex !== -1) {
      // found: so return that slice
      return { entries: entries.slice(entryIndex), fileIndex, entryIndex };
    }

    // the log file found stops before the date given, so start at next one
    if (fileIndex === logFiles.length - 1) {
      // there is no next log file
      return { entries: [] };
    }

    entries = await this.#getLogContents(fileIndex + 1);
    return { entries, fileIndex: fileIndex + 1, entryIndex: 0 };
  }

  /**
   * Locate entries given a previously saved location
   *
   * @param {LogLocation} location location
   * @returns {Promise<LogEntries>} entries, fileIndex and entryIndex
   */
  async #locateEntries(location) {
    const { log, logFiles } = this;

    const { fileIndex, entryIndex } = location;
    if (!Number.isInteger(fileIndex) || !Number.isInteger(entryIndex)) {
      log.warn(`Next file and entry index are not numbers: ${fileIndex}/${entryIndex}`);
      return { entries: [] };
    }
    if (fileIndex < 0 || fileIndex >= logFiles.length) {
      log.warn(`Next file index (${fileIndex}) out of log files range: ${logFiles.length}`);
      return { entries: [] };
    }
    const entries = await this.#getLogContents(fileIndex);
    if (entryIndex < 0 || entryIndex >= entries.length) {
      log.warn(`Next entry index (${entryIndex}) out of entries range: ${entries.length}`);
      return { entries: [] };
    }
    return { entries: entries.slice(entryIndex), fileIndex, entryIndex };
  }

  /**
   * Lookup entries that lie between two timestamps
   *
   * @param {number} after from timestamp
   * @param {number} before to timestamp
   * @param {number} limit number of entries to return at most
   * @param {number} maxSize maximum total size of entries when stringified
   * @param {LogLocation} location optional location with `fileIndex` and `entryIndex`
   *
   * @returns {Promise<LogResult>} log result
   */
  async getEntries(after, before, { limit, maxSize }, location) {
    const { logFiles } = this;
    const { entries, fileIndex, entryIndex } = location
      ? await this.#locateEntries(location)
      : await this.#findEntries(after);

    if (entries.length === 0) {
      // no entries found at all, stop here to keep the following simpler
      return { entries };
    }

    // find the utmost limit of items to return
    let remaining = entries.findIndex(({ timestamp }) => timestamp > before);
    if (remaining === -1) {
      remaining = entries.length;
    }

    // return either `limit` number of items, or items left in that file, whichever is smaller
    const count = Math.min(limit, remaining);
    if (count < remaining) {
      // `limit` was reached first, so continue after that
      return checkSize(maxSize, {
        entries: entries.slice(0, count),
        fileIndex,
        entryIndex,
        next: { fileIndex, entryIndex: entryIndex + count },
      });
    }
    if (remaining < entries.length) {
      // `before` timestamp was reached first, so stop
      return checkSize(maxSize, {
        entries: entries.slice(0, count),
        fileIndex,
        entryIndex,
      });
    }

    // we return all items in this file, and need to determine whether to continue paging
    if (fileIndex === logFiles.length - 1 || logFiles[fileIndex + 1].timestamp > before) {
      // there's no next page or it starts after `before` date, so stop
      return checkSize(maxSize, {
        entries,
        fileIndex,
        entryIndex,
      });
    }
    // next location will start at the beginning of the next file
    return checkSize(maxSize, {
      entries,
      fileIndex,
      entryIndex,
      next: { fileIndex: fileIndex + 1, entryIndex: 0 },
    });
  }

  close() {
    this.s3.destroy();
  }
}
