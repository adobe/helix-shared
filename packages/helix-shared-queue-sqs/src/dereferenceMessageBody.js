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

import { QueueError } from '@adobe/helix-shared-queue';

const NOOP_CLEANUP = async () => {};

/**
 * @param {Object} parsed the parsed message body
 * @param {string} [bucketName]
 * @returns {string|undefined} the swap key, if `parsed` is a `legacySwapFormat` pointer
 *  referencing `bucketName`
 * @throws {QueueError} if `parsed` is a pointer but references a different bucket
 */
function extractLegacySwapKey(parsed, bucketName) {
  const { swapS3Url } = parsed;
  if (!swapS3Url) {
    return undefined;
  }
  const { hostname, pathname } = new URL(swapS3Url);
  if (hostname !== bucketName) {
    throw new QueueError(
      `swapped message references bucket "${hostname}", but this backend is configured for "${bucketName}"`,
      { status: 500, backend: 'SQS' },
    );
  }
  return pathname.substring(1);
}

/**
 * @param {Object} parsed the parsed message body
 * @param {string} [bucketName]
 * @returns {string|undefined} the swap key, if `parsed` is a generic-format pointer
 *  referencing `bucketName`
 * @throws {QueueError} if `parsed` is a pointer but references a different bucket
 */
function extractGenericSwapKey(parsed, bucketName) {
  const { swapBucket, swapKey } = parsed;
  if (!swapKey) {
    return undefined;
  }
  if (swapBucket !== bucketName) {
    throw new QueueError(
      `swapped message references bucket "${swapBucket}", but this backend is configured for "${bucketName}"`,
      { status: 500, backend: 'SQS' },
    );
  }
  return swapKey;
}

/**
 * @typedef {Object} DereferenceResult
 * @property {string} body the real message body — unchanged from the input unless it was a
 *  swap pointer
 * @property {function(): Promise<void>} cleanup deletes the swapped-out body from `bucket`, if
 *  there was one to clean up; a no-op otherwise, so it's always safe to call unconditionally.
 *  Call this only once the message has been durably, successfully processed — deleting the
 *  swapped body eagerly would lose it if the message needs to be redelivered after a failure.
 *  Never throws; a failure to delete is logged and otherwise ignored.
 */

/**
 * Given a raw SQS message body, transparently resolves it to the real content, dereferencing
 * it from blob storage if {@link SqsBackend#sendBatch} spilled it there. Standalone (no
 * `Queue`/`SqsBackend` instance required) so it can be used directly wherever SQS messages are
 * consumed outside of this package's own `receive()`/`delete()` flow — most notably in an AWS
 * Lambda function triggered by an SQS event source mapping, where AWS delivers
 * `event.Records[].body` directly to the handler rather than going through `Queue#receive()`
 * at all (`SqsBackend` itself uses this same function internally for its `receiveBatch()`/
 * `deleteBatch()`).
 *
 * @param {string} body raw SQS message body (e.g. a Lambda SQS event's `record.body`)
 * @param {Object} [opts]
 * @param {import('@adobe/helix-shared-storage').Bucket} [opts.bucket] required if `body` might
 *  reference a swapped-out message
 * @param {boolean} [opts.legacySwapFormat] whether to recognize `BatchedQueueClient`'s pointer
 *  shape (`swapS3Url`) instead of this package's own generic one (`swapBucket`/`swapKey`) — see
 *  {@link SqsBackend}. Defaults to `false`.
 * @param {Console} [opts.log]
 * @returns {Promise<DereferenceResult>}
 */
export async function dereferenceMessageBody(body, opts = {}) {
  const { bucket, legacySwapFormat = false, log = console } = opts;

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (e) {
    return { body, cleanup: NOOP_CLEANUP };
  }

  const swapKey = legacySwapFormat
    ? extractLegacySwapKey(parsed, bucket?.bucket)
    : extractGenericSwapKey(parsed, bucket?.bucket);
  if (!swapKey) {
    return { body, cleanup: NOOP_CLEANUP };
  }
  if (!bucket) {
    throw new QueueError('message was swapped out but no spill bucket is configured', {
      status: 500,
      backend: 'SQS',
    });
  }

  const content = await bucket.get(swapKey);
  if (content === null) {
    throw new QueueError(`swapped message body not found: ${bucket.bucket}/${swapKey}`, {
      status: 404,
      backend: 'SQS',
    });
  }

  return {
    body: content.toString('utf-8'),
    cleanup: async () => {
      try {
        await bucket.remove(swapKey);
        log.debug(`deleted swapped message body: ${bucket.bucket}/${swapKey}`);
      } catch (e) {
        log.warn(`unable to delete swapped message body at ${bucket.bucket}/${swapKey}: ${e.message}`);
      }
    },
  };
}
