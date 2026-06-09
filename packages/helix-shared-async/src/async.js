/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
export const sleep = (ms) => new Promise((res) => {
  setTimeout(res, ms);
});

/**
 * Await the next tick;
 *
 * NOTE: Internally this uses setImmediate, not process.nextTick.
 * This is because process.nextTick and setImmediate are horribly named
 * and their [names should be swapped](https://github.com/nodejs/node/blob/v6.x/doc/topics/event-loop-timers-and-nexttick.md).
 *
 *
 *
 * ```js
 * const mAsyncFn = () => {
 *   const page1 = await request('https://example.com/1');
 *   await nextTick();
 *   const page2 = await request('https://example.com/2');
 *   ...
 * };
 * ```
 *
 * @returns {promise} A promise that will resolve during the next tick.
 */
export const nextTick = () => new Promise((res) => {
  setImmediate(res);
});
