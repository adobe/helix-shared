/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env mocha */

const assert = require('assert');
const { propagateStatusCode, logLevelForStatusCode } = require('../src/index.js').utils;

describe('Test Log Level Determination', () => {
  it('2xx responses', () => {
    assert.equal(logLevelForStatusCode(200), 'verbose');
    assert.equal(logLevelForStatusCode(201), 'verbose');
    assert.equal(logLevelForStatusCode(202), 'verbose');
    assert.equal(logLevelForStatusCode(203), 'verbose');
    assert.equal(logLevelForStatusCode(204), 'verbose');
    assert.equal(logLevelForStatusCode(205), 'verbose');
    assert.equal(logLevelForStatusCode(206), 'verbose');
    assert.equal(logLevelForStatusCode(207), 'verbose');
    assert.equal(logLevelForStatusCode(208), 'verbose');
    assert.equal(logLevelForStatusCode(226), 'verbose');
  });

  it('3xx responses', () => {
    assert.equal(logLevelForStatusCode(300), 'verbose');
    assert.equal(logLevelForStatusCode(301), 'verbose');
    assert.equal(logLevelForStatusCode(302), 'verbose');
    assert.equal(logLevelForStatusCode(303), 'verbose');
    assert.equal(logLevelForStatusCode(304), 'verbose');
    assert.equal(logLevelForStatusCode(305), 'verbose');
    assert.equal(logLevelForStatusCode(306), 'verbose');
    assert.equal(logLevelForStatusCode(307), 'verbose');
    assert.equal(logLevelForStatusCode(308), 'verbose');
  });

  it('4xx responses', () => {
    assert.equal(logLevelForStatusCode(400), 'warn');
    assert.equal(logLevelForStatusCode(401), 'warn');
    assert.equal(logLevelForStatusCode(402), 'warn');
    assert.equal(logLevelForStatusCode(403), 'warn');
    assert.equal(logLevelForStatusCode(404), 'warn');
    assert.equal(logLevelForStatusCode(405), 'warn');
    assert.equal(logLevelForStatusCode(406), 'warn');
    assert.equal(logLevelForStatusCode(407), 'warn');
    assert.equal(logLevelForStatusCode(408), 'warn');
    assert.equal(logLevelForStatusCode(409), 'warn');

    assert.equal(logLevelForStatusCode(410), 'warn');
    assert.equal(logLevelForStatusCode(411), 'warn');
    assert.equal(logLevelForStatusCode(412), 'warn');
    assert.equal(logLevelForStatusCode(413), 'warn');
    assert.equal(logLevelForStatusCode(414), 'warn');
    assert.equal(logLevelForStatusCode(415), 'warn');
    assert.equal(logLevelForStatusCode(416), 'warn');
    assert.equal(logLevelForStatusCode(417), 'warn');
    assert.equal(logLevelForStatusCode(418), 'warn');


    assert.equal(logLevelForStatusCode(421), 'warn');
    assert.equal(logLevelForStatusCode(422), 'warn');
    assert.equal(logLevelForStatusCode(423), 'warn');
    assert.equal(logLevelForStatusCode(424), 'warn');
    assert.equal(logLevelForStatusCode(425), 'warn');
    assert.equal(logLevelForStatusCode(426), 'warn');
    assert.equal(logLevelForStatusCode(427), 'warn');
    assert.equal(logLevelForStatusCode(428), 'warn');
    assert.equal(logLevelForStatusCode(429), 'error');

    assert.equal(logLevelForStatusCode(431), 'warn');

    assert.equal(logLevelForStatusCode(451), 'warn');
  });

  it('5xx responses', () => {
    assert.equal(logLevelForStatusCode(500), 'error');
    assert.equal(logLevelForStatusCode(501), 'error');
    assert.equal(logLevelForStatusCode(502), 'error');
    assert.equal(logLevelForStatusCode(503), 'error');
    assert.equal(logLevelForStatusCode(504), 'error');
    assert.equal(logLevelForStatusCode(505), 'error');
    assert.equal(logLevelForStatusCode(506), 'error');
    assert.equal(logLevelForStatusCode(507), 'error');
    assert.equal(logLevelForStatusCode(508), 'error');
    assert.equal(logLevelForStatusCode(509), 'error');
    assert.equal(logLevelForStatusCode(510), 'error');
  });

  it('odd responses', () => {
    assert.equal(logLevelForStatusCode(0), 'verbose');
    assert.equal(logLevelForStatusCode(600), 'error');
  });
});

describe('Test Status Code Propagation', () => {
  it('2xx responses', () => {
    assert.equal(propagateStatusCode(200), 200);
    assert.equal(propagateStatusCode(201), 201);
    assert.equal(propagateStatusCode(202), 202);
    assert.equal(propagateStatusCode(203), 203);
    assert.equal(propagateStatusCode(204), 204);
    assert.equal(propagateStatusCode(205), 205);
    assert.equal(propagateStatusCode(206), 206);
    assert.equal(propagateStatusCode(207), 207);
    assert.equal(propagateStatusCode(208), 208);
    assert.equal(propagateStatusCode(226), 226);
  });

  it('3xx responses', () => {
    assert.equal(propagateStatusCode(300), 300);
    assert.equal(propagateStatusCode(301), 301);
    assert.equal(propagateStatusCode(302), 302);
    assert.equal(propagateStatusCode(303), 303);
    assert.equal(propagateStatusCode(304), 304);
    assert.equal(propagateStatusCode(305), 305);
    assert.equal(propagateStatusCode(306), 306);
    assert.equal(propagateStatusCode(307), 307);
    assert.equal(propagateStatusCode(308), 308);
  });

  it('4xx responses', () => {
    assert.equal(propagateStatusCode(400), 400);
    assert.equal(propagateStatusCode(401), 401);
    assert.equal(propagateStatusCode(402), 402);
    assert.equal(propagateStatusCode(403), 403);
    assert.equal(propagateStatusCode(404), 404);
    assert.equal(propagateStatusCode(405), 405);
    assert.equal(propagateStatusCode(406), 406);
    assert.equal(propagateStatusCode(407), 407);
    assert.equal(propagateStatusCode(408), 408);
    assert.equal(propagateStatusCode(409), 409);

    assert.equal(propagateStatusCode(410), 410);
    assert.equal(propagateStatusCode(411), 411);
    assert.equal(propagateStatusCode(412), 412);
    assert.equal(propagateStatusCode(413), 413);
    assert.equal(propagateStatusCode(414), 414);
    assert.equal(propagateStatusCode(415), 415);
    assert.equal(propagateStatusCode(416), 416);
    assert.equal(propagateStatusCode(417), 417);
    assert.equal(propagateStatusCode(418), 418);


    assert.equal(propagateStatusCode(421), 421);
    assert.equal(propagateStatusCode(422), 422);
    assert.equal(propagateStatusCode(423), 423);
    assert.equal(propagateStatusCode(424), 424);
    assert.equal(propagateStatusCode(425), 425);
    assert.equal(propagateStatusCode(426), 426);
    assert.equal(propagateStatusCode(427), 427);
    assert.equal(propagateStatusCode(428), 428);
    assert.equal(propagateStatusCode(429), 503);

    assert.equal(propagateStatusCode(431), 431);

    assert.equal(propagateStatusCode(451), 451);
  });

  it('5xx responses', () => {
    assert.equal(propagateStatusCode(500), 502);
    assert.equal(propagateStatusCode(501), 501);
    assert.equal(propagateStatusCode(502), 502);
    assert.equal(propagateStatusCode(503), 503);
    assert.equal(propagateStatusCode(504), 504);
    assert.equal(propagateStatusCode(505), 505);
    assert.equal(propagateStatusCode(506), 506);
    assert.equal(propagateStatusCode(507), 507);
    assert.equal(propagateStatusCode(508), 508);
    assert.equal(propagateStatusCode(509), 509);
    assert.equal(propagateStatusCode(510), 510);
  });

  it('odd responses', () => {
    assert.equal(propagateStatusCode(0), 0);
    assert.equal(propagateStatusCode(600), 600);
  });
});
