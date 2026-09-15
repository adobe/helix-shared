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
 * `QueueService` subclass pre-wired with the default SQS `backendFactory`, so existing
 * consumers of `BatchedQueueClient` (`@adobe/helix-admin-support`) migrate with a one-line
 * import change:
 *
 * ```diff
 * - import { QueueService } from '@adobe/helix-shared-queue';
 * + import { QueueServiceSqs as QueueService } from '@adobe/helix-shared-queue-sqs';
 * ```
 *
 * No other call site changes are required.
 */
export class QueueServiceSqs extends QueueService {
  /**
   * @param {import('@adobe/helix-shared-queue').QueueServiceContext} context
   * @param {Partial<import('@adobe/helix-shared-queue').QueueServiceOptions
   *   & {bucketName: string, swapPrefix: string}>} [opts]
   * @returns {QueueServiceSqs}
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
   * @param {Object[]} rawMessages `ReceiveMessageCommand`-shaped messages -- see
   *  {@link toReceivedMessage} for the expected field names
   * @returns {import('@adobe/helix-shared-queue').ReceivedMessage[]}
   */
  // eslint-disable-next-line class-methods-use-this
  toReceivedMessages(rawMessages) {
    return rawMessages.map(toReceivedMessage);
  }

  /**
   * Cheap (no I/O) check for whether `message.body` is a spillover pointer -- works for a
   * message obtained via `Queue#receive()` or via {@link QueueServiceSqs#toReceivedMessages}.
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
   * `body` replaced; otherwise returns `message` unchanged. Resolves the bucket named by the
   * message's own pointer via {@link QueueService#storage} -- see
   * {@link dereferenceMessageBody} for the trust model.
   *
   * @param {import('@adobe/helix-shared-queue').ReceivedMessage} message
   * @returns {Promise<import('@adobe/helix-shared-queue').ReceivedMessage>}
   */
  async deserialize(message) {
    const { body } = await dereferenceMessageBody(message.body, {
      storage: this.storage,
      log: this.log,
    });
    return body === message.body ? message : { ...message, body };
  }
}
