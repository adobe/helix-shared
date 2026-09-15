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

import { Queue } from './Queue.js';

/**
 * Options for {@link QueueService}.
 *
 * @typedef {Object} QueueServiceOptions
 * @property {Console} [log] logger; defaults to `console`.
 * @property {function(string, Object.<string, *>):
 *   import('./AbstractQueueBackend.js').QueueBackend} [backendFactory]
 *  factory used to resolve a `QueueBackend` for a given queue name. Backend packages (e.g.
 *  `@adobe/helix-shared-queue-sqs`) provide this, typically via a convenience `QueueService`
 *  subclass overriding `fromContext`. The second argument is an opaque bag forwarded
 *  verbatim from {@link QueueService#queue} — core does not interpret it.
 * @property {import('@adobe/helix-shared-storage').Storage} [storage] storage instance used by
 *  a backend-specific subclass's {@link QueueService#isSwapped}/{@link QueueService#deserialize}
 *  override to resolve a message's spillover bucket by name. Core does not interpret it -- see
 *  the note on {@link QueueService#deserialize}.
 */

/**
 * Helix function context shape used by {@link QueueService.fromContext}. The queue service
 * instance is cached on `context.attributes.queue`; configuration is read from
 * `context.env`.
 *
 * @typedef {Object} QueueServiceContext
 * @property {Object.<string, string|undefined>} env
 * @property {Console} log
 * @property {Object.<string, *>} attributes
 */

/**
 * The QueueService provides a factory for simplified queue operations against a pluggable
 * queue backend family (e.g. SQS, Azure Service Bus, ...). A single `QueueService` instance
 * is configured with one `backendFactory`, used to resolve every {@link Queue} it hands out.
 * This package ships no cloud SDK itself; it defines only the interface and the generic
 * `send`/`receive`/`delete` facade on top of it.
 */
export class QueueService {
  /**
   * Get (and lazily construct + cache) a {@link QueueService} for a Helix function
   * `context`. Caches the resulting instance on `context.attributes.queue` so repeat calls
   * within the same invocation share it. Uses `new this(...)` so that a subclass (e.g.
   * `QueueServiceSqs` from `@adobe/helix-shared-queue-sqs`) calling `super.fromContext(...)`
   * gets an instance of itself, not of the base `QueueService`.
   *
   * @param {QueueServiceContext} context
   * @param {Partial<QueueServiceOptions>} [opts]
   * @returns {QueueService}
   */
  static fromContext(context, opts = {}) {
    if (!context.attributes.queue) {
      context.attributes.queue = new this({
        log: context.log,
        ...opts,
      });
    }
    return context.attributes.queue;
  }

  /**
   * Create a queue service instance.
   *
   * @param {QueueServiceOptions} [opts]
   */
  #log;

  #backendFactory;

  #storage;

  #closed;

  constructor(opts = {}) {
    const { log = console, backendFactory, storage } = opts;
    this.#log = log;
    this.#backendFactory = backendFactory;
    this.#storage = storage;
    this.#closed = false;
  }

  /** @type {Console} */
  get log() {
    return this.#log;
  }

  /** @type {import('@adobe/helix-shared-storage').Storage} */
  get storage() {
    return this.#storage;
  }

  /**
   * Create a {@link Queue} for the given queue name, resolved via the configured
   * `backendFactory`. `opts` is an opaque bag forwarded verbatim to the `backendFactory` —
   * core does not interpret it; individual backend packages define whichever options they
   * support.
   *
   * @param {string} queueName
   * @param {Record<string, unknown>} [opts] backend-specific options, passed through as-is
   * @returns {Queue}
   * @throws if the queue service has been closed, if `queueName` is empty, or if no
   *  `backendFactory` was configured
   */
  queue(queueName, opts = {}) {
    if (this.#closed) {
      throw new Error('queue service already closed.');
    }
    if (!queueName) {
      throw new Error('queueName is required.');
    }
    if (!this.#backendFactory) {
      throw new Error(
        'No backendFactory configured. Install @adobe/helix-shared-queue-sqs (or another '
        + 'backend package) and pass its factory as `backendFactory`, e.g. '
        + 'new QueueService({ backendFactory: createDefaultBackendFactory(env) }).',
      );
    }
    return new Queue({
      backend: this.#backendFactory(queueName, opts),
      log: this.#log,
    });
  }

  /**
   * Close this queue service, rendering this instance unusable; subsequent calls to
   * {@link QueueService#queue} throw. The configured `backendFactory` owns the lifecycle of
   * any native clients it created.
   */
  close() {
    this.#closed = true;
  }

  /**
   * Transform raw, backend-native messages into the same `ReceivedMessage[]` shape
   * {@link Queue#receive} produces -- for a consumer that receives messages directly from the
   * runtime (e.g. an Azure Function Service Bus trigger, or an AWS Lambda SQS event source
   * mapping) rather than through `Queue#receive()`. Mandatory override point for a
   * backend-specific `QueueService` subclass (e.g. `QueueServiceSqs`, `QueueServiceServiceBus`)
   * -- the base class has no way to know any backend's raw message shape.
   *
   * @param {*[]} rawMessages
   * @returns {import('./Queue.js').ReceivedMessage[]}
   */
  toReceivedMessages(rawMessages) { // eslint-disable-line no-unused-vars, class-methods-use-this
    throw new Error(
      'toReceivedMessages() is not implemented by the base QueueService -- use a '
      + 'backend-specific subclass (e.g. QueueServiceSqs from @adobe/helix-shared-queue-sqs, '
      + 'or QueueServiceServiceBus from @adobe/helix-shared-queue-servicebus).',
    );
  }

  /**
   * Cheap (no I/O) check for whether `message.body` is a backend-specific spillover pointer
   * rather than the real content. Generic default: this class has no opinion on any backend's
   * pointer format, so it always returns `false`. A backend-specific subclass (e.g.
   * `QueueServiceSqs`, `QueueServiceServiceBus`) that supports spillover overrides this.
   *
   * @param {import('./Queue.js').ReceivedMessage} message
   * @returns {Promise<boolean>}
   */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  async isSwapped(message) {
    return false;
  }

  /**
   * If `isSwapped(message)` is true, fetches the real content and returns a new message with
   * `body` replaced; otherwise returns `message` unchanged. Generic default: always returns
   * `message` unchanged. A backend-specific subclass that supports spillover overrides this,
   * typically resolving the message's own embedded bucket name against {@link
   * QueueService#storage} -- see that subclass's docs for whether/how it validates the
   * embedded name against any configured expectation.
   *
   * @param {import('./Queue.js').ReceivedMessage} message
   * @returns {Promise<import('./Queue.js').ReceivedMessage>}
   */
  // eslint-disable-next-line class-methods-use-this
  async deserialize(message) {
    return message;
  }
}
