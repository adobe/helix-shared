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
 * @typedef LogEntry
 * @property {number} timestamp timestamp an entry was created
 *
 * @typedef LogLocation
 * @property {number} fileIndex file index into log file array
 * @property {number} entryIndex entry index into entries array of that log file
 *
 * @typedef LogResult
 * @property {LogEntry[]} entries log entry
 * @property {LogLocation} [start] start location of next page, inclusive
 * @property {LogLocation} [end] end location of all results, exclusive
 */

/**
 * Advance a log location by a number of entries.
 *
 * @param {LogLocation} start current location
 * @param {LogLocation} end final location
 * @param {number} count number of entries to advance
 * @param {number} remaining number of entries remaining in the current slice
 * @returns {LogLocation|null} next start location or null when moving past the end
 */
function advance(start, end, count, remaining) {
  const { fileIndex, entryIndex } = start;
  let next;

  if (count < remaining) {
    // move within file
    next = {
      fileIndex, entryIndex: entryIndex + count,
    };
  } else {
    // move to start of next file
    next = {
      fileIndex: fileIndex + 1, entryIndex: 0,
    };
  }
  if (next.fileIndex < end.fileIndex
      || (next.fileIndex === end.fileIndex && next.entryIndex < end.entryIndex)) {
    // some files or some entries in same file remaining
    return next;
  }
  return null;
}

/**
 * Enforce the maximum count and size limits for a slice of log entries.
 *
 * @param {LogEntry[]} entries log entries to filter
 * @param {number} maxCount maximum number of entries to keep
 * @param {number} maxSize maximum total size of entries when serialized
 * @returns {number} number of entries to keep
 */
function enforceLimits(entries, maxCount, maxSize) {
  let count = Math.min(maxCount, entries.length);
  if (maxSize && JSON.stringify(entries.slice(0, count)).length >= maxSize) {
    let totalSize = 2;
    for (const [index, entry] of entries.entries()) {
      totalSize += JSON.stringify(entry).length + 1;
      if (totalSize > maxSize) {
        // return at least one item
        count = Math.max(1, index);
        break;
      }
    }
  }
  return count;
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
   *
   * @returns {Promise<Reader>} this object
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
      throw new Error(`Unable to find journal log file '${key}': ${e.message}`);
    }
  }

  /**
   * Find the start location for a timestamp. This is the first notification
   * with a timestamp greater or equal than `from`.
   *
   * @param {number} from timestamp to search from
   * @returns {Promise<LogLocation|null>} matching location or null if no entry is found
   */
  async #findStart(from) {
    const { logFiles } = this;

    // stop if there are no log files at all
    if (logFiles.length === 0) {
      return null;
    }

    // find the last log file that started before the given date
    const fileIndex = logFiles.findLastIndex(({ timestamp }) => timestamp <= from);
    if (fileIndex === -1) {
      // none found, so return the very first log file
      return { fileIndex: 0, entryIndex: 0 };
    }

    // we found a log file that was created earlier, so locate the first entry that started
    // at or after the given date
    const entries = await this.#getLogContents(fileIndex);

    const entryIndex = entries.findIndex(({ timestamp }) => timestamp >= from);
    if (entryIndex !== -1) {
      // found: so return a location pointing to that entry
      return { fileIndex, entryIndex };
    }

    // the log file found stops before the date given, so start at next one
    if (fileIndex === logFiles.length - 1) {
      // there is no next log file
      return null;
    }

    return { fileIndex: fileIndex + 1, entryIndex: 0 };
  }

  /**
   * Find the end location for a timestamp. This is the first notification
   * with a timestamp greater than `to`.
   *
   * @param {number} to timestamp to search up to
   * @returns {Promise<LogLocation|null>} matching location or null if no entry is found
   */
  async #findEnd(to) {
    const { logFiles } = this;

    // find the last log file that started before the given date
    const fileIndex = logFiles.findLastIndex(({ timestamp }) => timestamp <= to);
    if (fileIndex === -1) {
      // none found, so `to` stops before the very first log file
      return null;
    }

    // we found a log file that was created earlier, so locate the last entry that started
    // at or before the given date
    const entries = await this.#getLogContents(fileIndex);

    const entryIndex = entries.findLastIndex(({ timestamp }) => timestamp <= to);
    if (entryIndex !== -1) {
      // found: so return a location pointing past that entry
      return { fileIndex, entryIndex: entryIndex + 1 };
    }

    // although the log file name indicated it started before `to`, none of the entries
    // contained does, so return a location pointing before the first entry
    return { fileIndex, entryIndex: 0 };
  }

  /**
   * Validate a previously saved location.
   *
   * @param {LogLocation} location location
   * @param {boolean} normalizeEnd whether to advance an end-of-file location
   * @returns {Promise<LogLocation|null>} validated location or null when invalid
   */
  async #validateLocation(location, normalizeEnd) {
    const { log, logFiles } = this;

    const { fileIndex, entryIndex } = location;
    if (!Number.isInteger(fileIndex) || !Number.isInteger(entryIndex)) {
      log.warn(`Next file and entry index are not numbers: ${fileIndex}/${entryIndex}`);
      return null;
    }
    if (fileIndex < 0 || fileIndex >= logFiles.length) {
      log.warn(`Next file index (${fileIndex}) out of log files range: ${logFiles.length}`);
      return null;
    }
    const entries = await this.#getLogContents(fileIndex);
    if (normalizeEnd && entryIndex === entries.length) {
      if (fileIndex + 1 < logFiles.length) {
        return { fileIndex: fileIndex + 1, entryIndex: 0 };
      }
      return null;
    }
    if (entryIndex < 0 || entryIndex > entries.length) {
      log.warn(`Next entry index (${entryIndex}) out of entries range: ${entries.length}`);
      return null;
    }
    return location;
  }

  /**
   * Fill a slice of log entries between two locations.
   *
   * @param {LogLocation} start starting location in the log, inclusive
   * @param {LogLocation} end ending location in the log, exclusive
   * @param {number} maxCount maximum number of entries to return
   * @param {number} maxSize maximum total size of entries when stringified
   * @returns {Promise<LogResult>} matching entries and pagination locations
   */
  async #fillEntries(start, end, maxCount, maxSize) {
    let entries = await this.#getLogContents(start.fileIndex);
    entries = entries.slice(start.entryIndex);

    if (start.fileIndex === end.fileIndex) {
      entries = entries.slice(0, end.entryIndex - start.entryIndex);
    }
    const count = enforceLimits(entries, maxCount, maxSize);
    const next = advance(start, end, count, entries.length);
    const result = {
      entries: entries.slice(0, count),
    };
    if (next) {
      result.start = next;
      result.end = end;
    }
    return result;
  }

  /**
   * Lookup entries that lie between two timestamps
   *
   * @param {number} from from timestamp or location
   * @param {number} to to timestamp or location
   * @param {{ limit: number, maxSize: number }} options pagination options
   *
   * @returns {Promise<LogResult>} log result
   */
  async getEntries(from, to, { limit, maxSize }) {
    if (!Number.isInteger(from) || !Number.isInteger(to) || from <= 0 || from > to) {
      return { entries: [] };
    }
    const start = await this.#findStart(from);
    if (start === null) {
      return { entries: [] };
    }
    const end = await this.#findEnd(to);
    if (end === null) {
      return { entries: [] };
    }
    return this.#fillEntries(start, end, limit, maxSize);
  }

  /**
   * Retrieve the next page of entries between two locations.
   *
   * @param {LogLocation} start starting location in the log, inclusive
   * @param {LogLocation} end ending location in the log, exclusive
   * @param {{ limit: number, maxSize: number }} options pagination options
   *
   * @returns {Promise<LogResult>} next page of entries and pagination locations
   */
  async getNextPage(start, end, { limit, maxSize }) {
    const vstart = await this.#validateLocation(start, true);
    if (!vstart) {
      return { entries: [] };
    }
    const vend = await this.#validateLocation(end);
    if (!vend) {
      return { entries: [] };
    }
    if (vstart.fileIndex > vend.fileIndex
      || (vstart.fileIndex === vend.fileIndex && vstart.entryIndex >= vend.entryIndex)) {
      return { entries: [] };
    }
    return this.#fillEntries(vstart, vend, limit, maxSize);
  }

  /**
   * Get the end location of the log, which is the location after the
   * last entry in this log. The next time an entry is added to the log,
   * it can be fetched by passing that value to `start` in `getNextPage`.
   *
   * @returns {Promise<LogLocation>} last log location
   */
  async getEndLocation() {
    const { logFiles } = this;

    if (logFiles.length === 0) {
      // point to beginning
      return {
        fileIndex: 0, entryIndex: 0,
      };
    }
    const fileIndex = logFiles.length - 1;
    const entries = await this.#getLogContents(fileIndex);
    return {
      fileIndex, entryIndex: entries.length,
    };
  }

  /**
   * Close the underlying S3 client.
   */
  close() {
    this.s3.destroy();
  }
}
