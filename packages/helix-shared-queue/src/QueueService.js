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

  #closed;

  constructor(opts = {}) {
    const { log = console, backendFactory } = opts;
    this.#log = log;
    this.#backendFactory = backendFactory;
    this.#closed = false;
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
}
