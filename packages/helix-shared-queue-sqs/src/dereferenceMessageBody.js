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
 * Cheap (no I/O): detects whether an already-parsed message body is a swap pointer produced
 * by {@link SqsBackend#sendBatch} (the `BatchedQueueClient`-compatible
 * `{owner, repo, key, swapS3Url}` shape) and, if so, extracts its storage key. Exported so
 * {@link SqsBackend} can reuse this same detection logic for its `isSwapped()`/`receiveBatch()`
 * split without needing to also import the (fetching) {@link dereferenceMessageBody}.
 *
 * @param {Object} parsed the parsed message body
 * @param {string} [bucketName] the configured bucket's name, if any. When omitted (no bucket
 *  configured at all), the mismatch check below is skipped — that's a distinct "no bucket
 *  configured" condition for the caller to check separately once it actually needs to fetch
 *  (see {@link dereferenceMessageBody}/`SqsBackend#deserialize`), not a mismatch.
 * @returns {string|undefined} the swap key, if `parsed` is a swap pointer
 * @throws {QueueError} if `parsed` is a pointer, `bucketName` is configured, but they
 *  reference different buckets
 */
export function extractSwapKey(parsed, bucketName) {
  const { swapS3Url } = parsed;
  if (!swapS3Url) {
    return undefined;
  }
  const { hostname, pathname } = new URL(swapS3Url);
  if (bucketName !== undefined && hostname !== bucketName) {
    throw new QueueError(
      `swapped message references bucket "${hostname}", but this backend is configured for "${bucketName}"`,
      { status: 500, backend: 'SQS' },
    );
  }
  return pathname.substring(1);
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
 * Given a raw SQS message body, resolves it to the real content, dereferencing it from blob
 * storage if {@link SqsBackend#sendBatch} spilled it there. Standalone (no `Queue`/
 * `SqsBackend` instance required) so it can be used directly wherever SQS messages are
 * consumed outside of this package's own `receive()`/`delete()` flow — most notably in an AWS
 * Lambda function triggered by an SQS event source mapping, where AWS delivers
 * `event.Records[].body` directly to the handler rather than going through `Queue#receive()`
 * at all, and where (typically processing one record at a time) there's little benefit to the
 * lazy `isSwapped()`/`deserialize()` split `Queue` offers — this fetches immediately.
 *
 * @param {string} body raw SQS message body (e.g. a Lambda SQS event's `record.body`)
 * @param {Object} [opts]
 * @param {import('@adobe/helix-shared-storage').Bucket} [opts.bucket] required if `body` might
 *  reference a swapped-out message
 * @param {Console} [opts.log]
 * @returns {Promise<DereferenceResult>}
 */
export async function dereferenceMessageBody(body, opts = {}) {
  const { bucket, log = console } = opts;

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (e) {
    return { body, cleanup: NOOP_CLEANUP };
  }

  const swapKey = extractSwapKey(parsed, bucket?.bucket);
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
