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

/* eslint-disable no-console */

/* eslint-env mocha */
process.env.HELIX_FETCH_FORCE_HTTP1 = 'true';

const assert = require('assert');
const { Response, Request } = require('@adobe/helix-fetch');
const wrap = require('@adobe/helix-shared-wrap');
const bounce = require('../src/bounce');

const log = {
  info: console.log,
  warn: console.log,
  error: console.error,
  debug: console.log,
};

describe('Bounce Wrapper Unit Tests', () => {
  it('Bounces the slow function', async () => {
    const slowfunction = async (_, context) => new Promise((resolve) => {
      setTimeout((resolve, 5000, new Response(`ok, job ${context.invocation.bounceId} completed.`)));
    });

    const fastfunction = async (_, context) => new Response(`I am ready soon, check status at ${context.invocation.bounceId}`);

    const actualfunct = wrap(slowfunction).with(bounce, { responder: fastfunction });
    const response = await actualfunct(new Request('http://localhost', {
      body: JSON.stringify({ foo: 'bar' }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }), {
      log,
      invocation: {
      },
    });
    assert.equal(response.status, 200, 'universal function should be executed');
  });
});
