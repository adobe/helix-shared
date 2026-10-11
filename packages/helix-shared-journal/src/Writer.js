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

import crypto from 'crypto';
import { promisify } from 'util';
import zlib from 'zlib';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Response } from '@adobe/fetch';
import { INDEX_FILE } from './utils.js';
import DateFormat from './DateFormat.js';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Metadata property for last event in log file. We update that property
 * whenever we store events to a log file.
 */
const META_LAST_EVENT = 'last-event-time';

/**
 * Threshold size to allow in one log file.
 */
const MAX_OBJECT_SIZE = 512 * 1024;

/**
 * Generate log file from date and some random value.
 *
 * @returns log file, consisting of name and date created
 */
function generateID() {
  return `${DateFormat.format(new Date())}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

/**
 * Journal writer implemented in S3
 */
export default class Writer {
  /**
   * @param {string} org
   * @param {string|undefined} site
   * @param {Logger} log
   * @param {Required<import('./Journal.js').Options>} opts
   */
  constructor(org, site, log, opts) {
    this.prefix = site ? `${org}/${site}` : `${org}/.all`;
    this.log = log;
    this.bucketName = opts.bucketName;
  }

  /**
   * Initialize this log.
   */
  async init() {
    this.s3 = new S3Client({});
    return this;
  }

  /**
   * Fetch index file
   *
   * @returns {Promise<String[]>} log entry file names array
   */
  async #fetchIndex() {
    const { prefix, s3 } = this;

    // fetch name of last log object
    try {
      const res = await s3.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: `${prefix}/${INDEX_FILE}`,
      }));
      const logContents = await new Response(res.Body, {}).text();
      return logContents.split('\n');
    } catch (e) {
      /* c8 ignore next 3 */
      if (e.$metadata.httpStatusCode !== 404) {
        throw e;
      }
    }
    return [];
  }

  /**
   * Fetch log file. Returns null if the log file is not found or too large to accomodate
   * another record.
   *
   * @param {string} key
   */
  async #fetchLogFile(key) {
    const { s3 } = this;

    try {
      const res = await s3.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: `${key}.gz`,
      }));
      if (res.ContentLength < MAX_OBJECT_SIZE) {
        const buf = await new Response(res.Body, {}).buffer();
        return { key, contents: JSON.parse(await gunzip(buf)) };
      }
    } catch (e) {
      /* c8 ignore next 3 */
      if (e.$metadata.httpStatusCode !== 404) {
        throw e;
      }
    }
    return null;
  }

  /**
   * Retrieves the last log object or creates one if necessary.
   *
   * @returns an object containing a key and contents
   */
  async #getOrCreateLogObject() {
    const { prefix, s3 } = this;

    // fetch list of log files
    const logFiles = await this.#fetchIndex();

    // fetch contents of last log object
    if (logFiles.length) {
      const key = `${prefix}/${logFiles[logFiles.length - 1]}`;
      const logFile = await this.#fetchLogFile(key);
      if (logFile) {
        return logFile;
      }
    }

    // generate new last log object, store modified list in index
    logFiles.push(generateID());
    await s3.send(new PutObjectCommand({
      Body: logFiles.join('\n'),
      Bucket: this.bucketName,
      ContentType: 'text/plain',
      Key: `${prefix}/${INDEX_FILE}`,
    }));
    return { key: `${prefix}/${logFiles[logFiles.length - 1]}`, contents: [] };
  }

  /**
   * Store a modified log file back to S3
   *
   * @param {string} key key for object to store, with project prefix
   * @param {string} contents contents to store
   * @param {object} metadata metadata to store to log file
   */
  async #storeLogFile(key, contents, metadata) {
    const { s3 } = this;
    await s3.send(new PutObjectCommand({
      Body: await gzip(JSON.stringify(contents)),
      Bucket: this.bucketName,
      ContentEncoding: 'gzip',
      ContentType: 'application/json',
      Key: `${key}.gz`,
      Metadata: metadata,
    }));
  }

  /**
   * Appends entries to the journal.
   *
   * @param {Array} updates added rows
   * @returns {Promise<String>} name of log file where updates have been written to
   */
  async append(updates) {
    if (updates.length) {
      const { key, contents } = await this.#getOrCreateLogObject();
      const lastEventTime = updates[updates.length - 1].timestamp;
      contents.push(...updates);
      await this.#storeLogFile(key, contents, {
        [META_LAST_EVENT]: DateFormat.format(new Date(lastEventTime)),
      });
      return key;
    }
    return null;
  }

  close() {
    this.s3.destroy();
  }
}
