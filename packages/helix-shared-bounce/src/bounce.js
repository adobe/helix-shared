/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const {
  fetch, timeoutSignal, Response, AbortError,
} = require('@adobe/helix-fetch');
const crypto = require('crypto');

// polyfill for timers/promise
const timer = {
  // eslint-disable-next-line no-promise-executor-return
  setTimeout: async (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
};

function bounce(func, { responder, timeout = 500 }) {
  return async (request, context) => {
    const id = request.headers.get('x-hlx-bounce-id') || process.env.HELIX_DEBOUNCE;
    if (id) {
      // use the provided bounce id
      context.invocation = context.invocation || {};
      context.invocation.bounceId = id;
      // the function has already been bounced, let's just run it
      return func(request, context);
    }

    // generate a new bounce id and add it to the context
    const bounceId = crypto.randomUUID();
    context.invocation = context.invocation || {};
    context.invocation.bounceId = bounceId;

    // run the quick responder function
    const holdingResponse = (async () => {
      try {
        const wait = timer.setTimeout(timeout);
        const res = responder(request, context);
        const response = await Promise.all([res, wait]);
        return response[0];
      } catch (err) {
        return new Response('Internal Server Error', { status: 500 });
      }
    })();
    // invoke the current function again, via HTTP, with the x-hlx-bounce-id
    // header set, so that we don't get into an endless loop
    request.headers.set('x-hlx-bounce-id', bounceId);
    const signal = timeoutSignal(2 * timeout);
    const actualResponse = (async () => {
      try {
        return await fetch(request.url, {
          ...request.init,
          signal,
        });
      } catch (e) {
        if (e instanceof AbortError) {
          return new Response(e.message, {
            // we acted as a gateway, but the upstream was too slow
            status: 504,
          });
        }
        context.log.warn(`error while bouncing: ${e.message}`);
        return new Response(e.message, {
          // we acted as a gateway, but there was an error with the network connection
          status: 502,
        });
      } finally {
        signal.clear();
      }
    })();

    return Promise.race([actualResponse, holdingResponse]);
  };
}

module.exports = bounce;
