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
const { fetch } = require('@adobe/helix-fetch');
const crypto = require('crypto');

function bounce(func, { responder, timeout = 1000 } = { }) {
  return async (request, context) => {
    const id = request.headers.get('x-hlx-bounce-id');
    if (id) {
      // use the provided bounce id
      context.invocation.bounceId = id;
      // the function has already been bounced, let's just run it
      return func(request, context);
    }

    // generate a new bounce id and add it to the context
    const bounceId = crypto.randomUUID();
    context.invocation.bounceId = id;
    // run the quick responder function
    const holdingResponse = new Promise((resolve) => {
      setTimeout(resolve, timeout, responder(request, context));
    });

    // invoke the current function again, via HTTP, with the x-hlx-bounce-id
    // header set, so that we don't get into an endless loop
    request.headers.set('x-hlx-bounce-id', bounceId);
    const actualResponse = fetch(request);

    return Promise.race([actualResponse, holdingResponse]);
  };
}

module.exports = bounce;
