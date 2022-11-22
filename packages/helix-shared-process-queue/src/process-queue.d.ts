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
export declare type QueueEntry = any;

/**
 * Queue type
 */
export declare type Queue = AsyncGenerator<QueueEntry>|Iterable<QueueEntry>|Array<QueueEntry>;

/**
 * A (asynchronous) handler function that is invoked for every queue entry.
 * Values added to the `results` array will be returned by `processQueue` function.
 * The handler can modify the `queue` if needed.
 *
 * @param {QueueEntry} entry The queue entry.
 * @param {Queue} queue the queue.
 * @param {[]} results the process queue results
 * @return {*} the value to be added to the results, unless undefined.
 */
export declare interface ProcessQueueHandler {
  (entry: QueueEntry, queue:Queue, results:Array<any>): Promise<any>;
}

/**
 * Processes the given queue concurrently.
 *
 * @param {Queue} queue A list of entries to be processed
 * @param {ProcessQueueHandler} fn A handler function
 * @param {number} [maxConcurrent = 8] Concurrency level
 * @returns {Promise<[]>} the results
 */
export default function processQueue(queue:Queue, fn:ProcessQueueHandler, maxConcurrent?:number): Promise<Array<any>>;
