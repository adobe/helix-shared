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

/**
 * Computes the time delta in seconds from HR timestamps
 * @param {int[]} t0 first HR timestamp
 * @param {int[]} t1 second HR timestamp
 * @returns {number} delta in seconds
 */
function delta(t0, t1) {
  const ds = t0[0] - t1[0]; // seconds
  const dn = t0[1] - t1[1]; // nanoseconds
  return ds * 1000 + dn / 1000000;
}

/**
 * Creates a timing object that records the timestamps using process.hrtime() and can set the
 * 'Server-Timing' response header accordingly.
 */
export function create() {
  const startTime = process.hrtime();
  const times = [];

  /**
   * Update the timestamps.
   */
  function update(name) {
    times.push({
      name,
      time: process.hrtime(),
    });
  }

  /**
   * Create the timing report as timinig header
   * @param {UniversalContext} context
   */
  function report(context) {
    const { log } = context;
    update('end');
    const total = delta(process.hrtime(), startTime);
    log.debug(`total processing time: ${total}ms`);

    // calculate the deltas between 2 the timestamps of 2 steps and generate the metric string.
    const metrics = [];
    for (let i = 0; i < times.length - 1; i += 1) {
      const d = delta(times[i + 1].time, times[i].time);
      metrics.push(`p${String(i).padStart(2, '0')};dur=${d};desc=${times[i].name}`);
    }
    const timing = [
      ...metrics,
      `total;dur=${total}`,
    ].join(' ,');
    log.debug(`timing: ${timing}`);
    return timing;
  }

  return {
    update,
    report,
  };
}

/**
 * Creates an universal timing wrapper and adds a `timer` object on the context.
 */
export default function serverTiming(fn) {
  return async (request, context) => {
    context.timer = create();
    const resp = await fn(request, context);
    // don't overwrite existing timer header
    if (!resp.headers.has('server-timing')) {
      resp.headers.set('server-timing', context.timer.report(context));
    }
    return resp;
  };
}
