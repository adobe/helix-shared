/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */


/**
 * Queue entry.
 */
export declare type QueueEntry<T = any> = T;

/**
 * Queue type
 */
export declare type Queue<T = any> = AsyncGenerator<QueueEntry<T>> | Iterable<QueueEntry<T>> | Array<QueueEntry<T>>;

/**
 * Inverse queue entry type
 */
export declare type QueueEntryType<TQueue extends Queue> = TQueue extends Array<infer T>
  ? T : TQueue extends Iterable<infer T>
  ? T : TQueue extends AsyncGenerator<infer T>
  ? T : never;

/**
 * A (asynchronous) handler function that is invoked for every queue entry.
 * Values added to the `results` array will be returned by `processQueue` function.
 * The handler can modify the `queue` if needed.
 * If the return value is not undefined, it is added to the `results` array.
 *
 * @param entry The queue entry.
 * @param queue the queue.
 * @param results the process queue results
 * @return result or undefined.
 */
export declare type ProcessQueueHandler<
  TQueue extends Queue,
  TEntry extends QueueEntry = QueueEntryType<TQueue>,
  TReturn = any
> = (entry: TEntry, queue: TQueue, results: TReturn[]) => PromiseLike<TReturn>;

/**
 * Processes the given queue concurrently. If the `queue` is an array it will remove the
 * entries during processing. It returns the `results` array which is either populated by the
 * queue handler function directly or with the return values of the handler functions.
 *
 * @param queue A list of entries to be processed
 * @param fn A handler function
 * @param {number} [maxConcurrent = 8] Concurrency level
 * @returns the results
 */
export default function processQueue<
  TQueue extends Queue,
  THandler extends ProcessQueueHandler<TQueue>,
  TReturn = ReturnType<THandler> extends PromiseLike<infer U> ? U : ReturnType<THandler>
>(
  queue: TQueue,
  fn: THandler,
  maxConcurrent?: number
): Promise<TReturn[]>;


