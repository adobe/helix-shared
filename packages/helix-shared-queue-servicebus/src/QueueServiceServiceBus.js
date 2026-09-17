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

import { QueueService } from '@adobe/helix-shared-queue';
import { createDefaultBackendFactory } from './createDefaultBackendFactory.js';
import { toReceivedMessage } from './toReceivedMessage.js';
import { dereferenceMessageBody, isSwappedBody } from './dereferenceMessageBody.js';

/**
 * `QueueService` subclass pre-wired with the default Azure Service Bus `backendFactory`, so
 * consumers migrate with a one-line import change:
 *
 * ```diff
 * - import { QueueService } from '@adobe/helix-shared-queue';
 * + import { QueueServiceServiceBus as QueueService } from '@adobe/helix-shared-queue-servicebus';
 * ```
 *
 * No other call site changes are required.
 */
export class QueueServiceServiceBus extends QueueService {
  /**
   * @param {import('@adobe/helix-shared-queue').QueueServiceContext} context
   * @param {Partial<import('@adobe/helix-shared-queue').QueueServiceOptions
   *   & {bucketName: string, swapPrefix: string}>} [opts]
   * @returns {QueueServiceServiceBus}
   */
  static fromContext(context, opts = {}) {
    const {
      storage, bucketName, swapPrefix, ...rest
    } = opts;
    return super.fromContext(context, {
      backendFactory: createDefaultBackendFactory(context.env, {
        log: context.log, storage, bucketName, swapPrefix,
      }),
      storage,
      ...rest,
    });
  }

  /**
   * @param {Object[]} rawMessages `ServiceBusReceivedMessage`-shaped messages -- see
   *  {@link toReceivedMessage} for the expected field names
   * @returns {import('@adobe/helix-shared-queue').ReceivedMessage[]}
   */
  // eslint-disable-next-line class-methods-use-this
  toReceivedMessages(rawMessages) {
    return rawMessages.map(toReceivedMessage);
  }

  /**
   * Cheap (no I/O) check for whether `message.body` is a spillover pointer -- works for a
   * message obtained via `Queue#receive()` or via
   * {@link QueueServiceServiceBus#toReceivedMessages}.
   *
   * @param {import('@adobe/helix-shared-queue').ReceivedMessage} message
   * @returns {Promise<boolean>}
   */
  // eslint-disable-next-line class-methods-use-this
  async isSwapped(message) {
    return isSwappedBody(message.body);
  }

  /**
   * If `isSwapped(message)` is true, fetches the real content and returns a new message with
   * `body` replaced and a `cleanup` function attached; otherwise returns `message` unchanged.
   * Resolves the bucket named by the message's own pointer via {@link QueueService#storage} --
   * see {@link dereferenceMessageBody} for the trust model.
   *
   * `cleanup` deletes the swapped-out body from its bucket -- only present when a swap was
   * actually resolved, since there's nothing to clean up otherwise. Relevant when this message
   * didn't come from `Queue#receive()` (e.g. an Azure Function Service Bus trigger), so there's
   * no `Queue#delete()` call to clean it up on ack instead -- call it yourself once the message
   * has been durably, successfully processed. A message obtained via `Queue#receive()` doesn't
   * need this: `Queue#delete()` already cleans up the swapped body on ack, regardless of
   * whether `deserialize()` was ever called.
   *
   * @param {import('@adobe/helix-shared-queue').ReceivedMessage} message
   * @returns {Promise<import('@adobe/helix-shared-queue').ReceivedMessage
   *   & {cleanup?: function(): Promise<void>}>}
   */
  async deserialize(message) {
    const { body, cleanup } = await dereferenceMessageBody(message.body, {
      storage: this.storage,
      log: this.log,
    });
    return body === message.body ? message : { ...message, body, cleanup };
  }
}
