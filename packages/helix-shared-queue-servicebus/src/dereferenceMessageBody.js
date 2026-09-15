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
 * by {@link ServiceBusBackend#sendBatch} and, if so, extracts its storage bucket/key. Exported
 * so {@link ServiceBusBackend} can reuse this same detection logic for its own internal
 * receive-time bookkeeping without needing to also import the (fetching)
 * {@link dereferenceMessageBody}.
 *
 * @param {Object} parsed the parsed message body
 * @returns {{swapBucket: string, swapKey: string}|undefined} the pointer's bucket/key, if
 *  `parsed` is a swap pointer
 */
export function extractSwapKey(parsed) {
  const { swapBucket, swapKey } = parsed;
  return swapKey ? { swapBucket, swapKey } : undefined;
}

/**
 * Cheap (no I/O) check for whether `body` is a swap pointer produced by
 * {@link ServiceBusBackend#sendBatch} rather than the real message content.
 *
 * @param {string} body raw message body
 * @returns {boolean}
 */
export function isSwappedBody(body) {
  try {
    return !!extractSwapKey(JSON.parse(body));
  } catch (e) {
    return false;
  }
}

/**
 * @typedef {Object} DereferenceResult
 * @property {string} body the real message body — unchanged from the input unless it was a
 *  swap pointer
 * @property {function(): Promise<void>} cleanup deletes the swapped-out body from its bucket,
 *  if there was one to clean up; a no-op otherwise, so it's always safe to call
 *  unconditionally. Call this only once the message has been durably, successfully
 *  processed — deleting the swapped body eagerly would lose it if the message needs to be
 *  redelivered after a failure. Never throws; a failure to delete is logged and otherwise
 *  ignored.
 */

/**
 * Given a raw Service Bus message body, resolves it to the real content, dereferencing it
 * from blob storage if {@link ServiceBusBackend#sendBatch} spilled it there. Standalone (no
 * `Queue`/`ServiceBusBackend` instance required) so it can be used directly wherever Service
 * Bus messages are consumed outside of this package's own `receive()`/`delete()` flow — most
 * notably an Azure Function triggered by a Service Bus trigger, where the runtime delivers
 * the message body directly to the handler rather than going through `Queue#receive()` at
 * all, and where (typically processing one message at a time) there's little benefit to the
 * lazy `isSwapped()`/`deserialize()` split `QueueService` offers — this fetches immediately.
 *
 * Trusts the pointer's own `swapBucket` name to resolve the bucket via `storage.bucket(...)` —
 * it does not require it to match any particular configured bucket name. `Storage.bucket()`
 * itself enforces no allowlist, so the only thing bounding which bucket actually gets read is
 * whatever IAM/ACL scope the underlying cloud credentials already have.
 *
 * @param {string} body raw Service Bus message body (e.g. an Azure Function Service Bus
 *  trigger's message argument, coerced to a string)
 * @param {Object} [opts]
 * @param {import('@adobe/helix-shared-storage').Storage} [opts.storage] required if `body`
 *  might reference a swapped-out message
 * @param {Console} [opts.log]
 * @returns {Promise<DereferenceResult>}
 */
export async function dereferenceMessageBody(body, opts = {}) {
  const { storage, log = console } = opts;

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (e) {
    return { body, cleanup: NOOP_CLEANUP };
  }

  const swap = extractSwapKey(parsed);
  if (!swap) {
    return { body, cleanup: NOOP_CLEANUP };
  }
  if (!storage) {
    throw new QueueError('message was swapped out but no storage is configured', {
      status: 500,
      backend: 'ServiceBus',
    });
  }

  const bucket = storage.bucket(swap.swapBucket);
  const content = await bucket.get(swap.swapKey);
  if (content === null) {
    throw new QueueError(`swapped message body not found: ${swap.swapBucket}/${swap.swapKey}`, {
      status: 404,
      backend: 'ServiceBus',
    });
  }

  return {
    body: content.toString('utf-8'),
    cleanup: async () => {
      try {
        await bucket.remove(swap.swapKey);
        log.debug(`deleted swapped message body: ${swap.swapBucket}/${swap.swapKey}`);
      } catch (e) {
        log.warn(`unable to delete swapped message body at ${swap.swapBucket}/${swap.swapKey}: ${e.message}`);
      }
    },
  };
}
