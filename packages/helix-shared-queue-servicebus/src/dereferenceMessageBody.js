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
 * Given a raw Service Bus message body, transparently resolves it to the real content,
 * dereferencing it from blob storage if {@link ServiceBusBackend#sendBatch} spilled it there.
 * Standalone (no `Queue`/`ServiceBusBackend` instance required) so it can be used directly
 * wherever Service Bus messages are consumed outside of this package's own
 * `receive()`/`delete()` flow — most notably an Azure Function triggered by a Service Bus
 * trigger, where the runtime delivers the message body directly to the handler rather than
 * going through `Queue#receive()` at all (`ServiceBusBackend` uses this same function
 * internally for its `receiveBatch()`/`deleteBatch()`).
 *
 * @param {string} body raw Service Bus message body (e.g. an Azure Function Service Bus
 *  trigger's message argument, coerced to a string)
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

  const { swapBucket, swapKey } = parsed;
  if (!swapKey) {
    return { body, cleanup: NOOP_CLEANUP };
  }
  if (swapBucket !== bucket?.bucket) {
    throw new QueueError(
      `swapped message references bucket "${swapBucket}", but this backend is configured for "${bucket?.bucket}"`,
      { status: 500, backend: 'ServiceBus' },
    );
  }
  if (!bucket) {
    throw new QueueError('message was swapped out but no spill bucket is configured', {
      status: 500,
      backend: 'ServiceBus',
    });
  }

  const content = await bucket.get(swapKey);
  if (content === null) {
    throw new QueueError(`swapped message body not found: ${bucket.bucket}/${swapKey}`, {
      status: 404,
      backend: 'ServiceBus',
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
