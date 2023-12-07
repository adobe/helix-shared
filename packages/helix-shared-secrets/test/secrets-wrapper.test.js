/*
 * Copyright 2023 Adobe. All rights reserved.
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
import assert from 'assert';
import { Request, Response } from '@adobe/fetch';

import wrap from '@adobe/helix-shared-wrap';
// eslint-disable-next-line import/no-named-default
import { default as secrets, reset } from '../src/secrets-wrapper.js';
import { Nock } from './utils.js';

process.env.HELIX_FETCH_FORCE_HTTP1 = 'true';

const DEFAULT_CONTEXT = (env = {}) => ({
  runtime: {
    name: 'aws-lambda',
  },
  func: {
    name: 'helix-admin',
    package: 'helix3',
  },
  env,
});

describe('Secrets Wrapper Unit Tests', () => {
  let processEnvCopy;
  let nock;

  beforeEach(() => {
    processEnvCopy = { ...process.env };
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'fake';
    process.env.AWS_SECRET_ACCESS_KEY = 'fake';
    nock = new Nock();
  });

  afterEach(() => {
    reset();
    process.env = processEnvCopy;
    nock.done();
  });

  it('Responds with 500 for unsupported runtime', async () => {
    const main = wrap(() => {}).with(secrets);
    const resp = await main(new Request('http://localhost'), {
      runtime: {
        name: 'foo',
      },
    });
    assert.strictEqual(resp.status, 500);
    assert.strictEqual(resp.headers.get('x-error'), 'error fetching secrets.');
  });

  it('Responds with {} for invalid context (no runtime)', async () => {
    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { });
      return new Response(200);
    }).with(secrets);
    const resp = await main(new Request('http://localhost'), {
      env: {},
    });
    assert.strictEqual(resp.status, 200);
  });

  it('Responds with {} for invalid context (simulate runtime)', async () => {
    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { });
      return new Response(200);
    }).with(secrets);
    const resp = await main(new Request('http://localhost'), {
      runtime: {
        name: 'simulate',
      },
      env: {},
    });
    assert.strictEqual(resp.status, 200);
  });

  it('Responds with {} for invalid context (no func)', async () => {
    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { });
      return new Response(200);
    }).with(secrets);
    const resp = await main(new Request('http://localhost'), {
      env: {},
      runtime: {
        name: 'aws-lambda',
      },
    });
    assert.strictEqual(resp.status, 200);
  });

  it('fetches secrets with default name', async () => {
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply((uri, body) => {
        assert.strictEqual(body, '{"SecretId":"/helix-deploy/helix3/helix-admin"}');
        return [200, {
          SecretString: JSON.stringify({
            OVERRIDE: '42',
            SOME_SECRET: 'pssst',
          }),
        }, {
          'content-type': 'application/json',
        }];
      });

    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, {
        OVERRIDE: '42',
        SOME_SECRET: 'pssst',
      });
      return new Response(200);
    }).with(secrets);
    const resp = await main(new Request('http://localhost'), DEFAULT_CONTEXT({ OVERRIDE: '0' }));
    assert.strictEqual(resp.status, 200);
  });

  it('fetches secrets with custom name', async () => {
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply((uri, body) => {
        assert.strictEqual(body, '{"SecretId":"/my-secrets"}');
        return [200, {
          SecretString: JSON.stringify({ SOME_SECRET: 'pssst' }),
        }, {
          'content-type': 'application/json',
        }];
      });

    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets, { name: '/my-secrets' });
    const resp = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp.status, 200);
  });

  it('fetches secrets with custom name function', async () => {
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply((uri, body) => {
        assert.strictEqual(body, '{"SecretId":"/dynamic-path"}');
        return [200, {
          SecretString: JSON.stringify({ SOME_SECRET: 'pssst' }),
        }, {
          'content-type': 'application/json',
        }];
      });

    const nameFunction = () => '/dynamic-path';

    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets, { name: nameFunction });
    const resp = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp.status, 200);
  });

  it('fetches secrets with default path if custom function returns empty', async () => {
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply((uri, body) => {
        assert.strictEqual(body, '{"SecretId":"/helix-deploy/helix3/helix-admin"}');
        return [200, {
          SecretString: JSON.stringify({ SOME_SECRET: 'pssst' }),
        }, {
          'content-type': 'application/json',
        }];
      });

    const nameFunction = () => '';

    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets, { name: nameFunction });
    const resp = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp.status, 200);
  });

  it('fetches secrets with default path if custom function throws error', async () => {
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply((uri, body) => {
        assert.strictEqual(body, '{"SecretId":"/helix-deploy/helix3/helix-admin"}');
        return [200, {
          SecretString: JSON.stringify({ SOME_SECRET: 'pssst' }),
        }, {
          'content-type': 'application/json',
        }];
      });

    const nameFunction = () => {
      throw new Error('boom');
    };

    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets, { name: nameFunction });
    const resp = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp.status, 200);
  });

  it('caches secrets', async () => {
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply((uri, body) => {
        assert.strictEqual(body, '{"SecretId":"/helix-deploy/helix3/helix-admin"}');
        return [200, {
          SecretString: JSON.stringify({ SOME_SECRET: 'pssst' }),
        }, {
          'content-type': 'application/json',
        }];
      });

    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets);
    const resp0 = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp0.status, 200);
    const resp1 = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp1.status, 200);
  });

  it('should recheck cache cache after configured time', async () => {
    const now = Date.now();
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply((uri, body) => {
        assert.strictEqual(body, '{"SecretId":"/helix-deploy/helix3/helix-admin"}');
        return [200,
          { SecretString: JSON.stringify({ SOME_SECRET: 'pssst' }) },
          { 'content-type': 'application/json' },
        ];
      });

    const main0 = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets);
    const resp0 = await main0(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp0.status, 200);

    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply((uri, body) => {
        assert.strictEqual(body, '{"SecretId":"/helix-deploy/helix3/helix-admin"}');
        return [200,
          { LastChangedDate: now / 1000 }, { 'content-type': 'application/json' },
        ];
      });

    const main1 = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets, { checkDelay: 1 });
    const resp1 = await main1(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp1.status, 200);
  });

  it('should reload cache if settings changed', async () => {
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply((uri, body) => {
        assert.strictEqual(body, '{"SecretId":"/helix-deploy/helix3/helix-admin"}');
        return [200,
          { SecretString: JSON.stringify({ SOME_SECRET: 'pssst' }) },
          { 'content-type': 'application/json' },
        ];
      });

    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets, { checkDelay: 1 });
    const resp0 = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp0.status, 200);

    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply(() => [200,
        { LastChangedDate: (Date.now() / 1000) + 60 },
        { 'content-type': 'application/json' },
      ])
      .post('/')
      .reply(() => [200,
        { SecretString: JSON.stringify({ SOME_SECRET: 'pssst' }) },
        { 'content-type': 'application/json' },
      ]);

    const resp1 = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp1.status, 200);
  });

  it('handles error in check cache', async () => {
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply((uri, body) => {
        assert.strictEqual(body, '{"SecretId":"/helix-deploy/helix3/helix-admin"}');
        return [200,
          { SecretString: JSON.stringify({ SOME_SECRET: 'pssst' }) },
          { 'content-type': 'application/json' },
        ];
      });

    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets, { checkDelay: 1 });

    const resp0 = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp0.status, 200);

    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply(429, '', {
        'x-amzn-errortype': 'ThrottlingException',
      });

    const resp1 = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp1.status, 200);
  });

  it('handles errors from secret manager', async () => {
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply(500)
      .persist();
    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets, { checkDelay: 1 });

    const resp = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp.status, 502);
    assert.strictEqual(resp.headers.get('x-error'), 'error fetching secrets.');
  });

  it('handles 400 from secret manager', async () => {
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply(400, '', {
        'x-amzn-errortype': 'ResourceNotFoundException',
      });
    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets, { checkDelay: 1 });

    const resp = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp.status, 502);
    assert.strictEqual(resp.headers.get('x-error'), 'error fetching secrets.');
  });

  it('handles 400 JSON response from secret manager', async () => {
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply(400, JSON.stringify({
        __type: 'ResourceNotFoundException', Message: 'Secrets Manager can\'t find the specified secret.',
      }), {
        'content-type': 'application/x-amz-json-1.1',
      });
    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets, { checkDelay: 1 });

    const resp = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp.status, 502);
    assert.strictEqual(resp.headers.get('x-error'), 'error fetching secrets.');
  });

  it('handles 429 from secret manager', async () => {
    nock('https://secretsmanager.us-east-1.amazonaws.com/')
      .post('/')
      .reply(429, '', {
        'x-amzn-errortype': 'ThrottlingException',
      })
      .persist();
    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets, { checkDelay: 1 });

    const resp = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp.status, 429);
    assert.strictEqual(resp.headers.get('x-error'), 'error fetching secrets.');
  });

  it('handles missing AWS settings', async () => {
    delete process.env.AWS_SECRET_ACCESS_KEY;

    const main = wrap((req, ctx) => {
      assert.deepStrictEqual(ctx.env, { SOME_SECRET: 'pssst' });
      return new Response(200);
    }).with(secrets, { checkDelay: 1 });

    const resp = await main(new Request('http://localhost'), DEFAULT_CONTEXT());
    assert.strictEqual(resp.status, 502);
    assert.strictEqual(resp.headers.get('x-error'), 'error fetching secrets.');
  });
});
