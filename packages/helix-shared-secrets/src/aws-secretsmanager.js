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
import aws4 from 'aws4';
import { context, h1 } from '@adobe/fetch';

/* c8 ignore next 7 */
const fetchContext = process.env.HELIX_FETCH_FORCE_HTTP1
  ? h1({
    userAgent: 'adobe-fetch', // static user-agent for recorded tests
  })
  : context({
    userAgent: 'adobe-fetch', // static user-agent for recorded tests
  });

/**
 * Secrets Manager class.
 */
export default class SecretsManager {
  constructor(opts) {
    const {
      AWS_REGION: region,
      AWS_ACCESS_KEY_ID: accessKeyId,
      AWS_SECRET_ACCESS_KEY: secretAccessKey,
      AWS_SESSION_TOKEN: sessionToken,
    } = opts;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('Missing AWS configuration (aws_access_key_id or aws_secret_access_key)');
    }

    this.awsConfig = {
      region,
      accessKeyId,
      secretAccessKey,
      sessionToken,
    };
  }

  /**
   * Pass a request to the AWS secrets manager
   * @param {string} target target method to invoke
   * @param {any} input input that will be passed as JSON
   * @returns {any} response object
   */
  async _request(target, input) {
    try {
      const { awsConfig } = this;
      const { region } = awsConfig;

      const { fetch } = fetchContext;
      const opts = {
        host: `secretsmanager.${region}.amazonaws.com`,
        service: 'secretsmanager',
        region,
        method: 'POST',
        path: '/',
        body: JSON.stringify(input),
        headers: {
          'X-Amz-Target': `secretsmanager.${target}`,
          'Content-Type': 'application/x-amz-json-1.1',
        },
      };
      const req = aws4.sign(opts, {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
        sessionToken: awsConfig.sessionToken,
      });
      const resp = await fetch(`https://${req.host}${req.path}`, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      if (!resp.ok) {
        // AWS might actually return a JSON response in its error
        if (resp.headers.get('content-type')?.match(/^application\/x-amz-json-/)) {
          const { __type: code, Message } = await resp.json();
          const e = new Error(Message);
          e.code = code;
          throw e;
        }
        // the current tests expect the error type in this header
        const code = resp.headers.get('x-amzn-errortype');
        if (code) {
          const e = new Error();
          e.code = code;
          throw e;
        }
        throw Error(`Failed to invoke ${target} (${resp.status}): ${await resp.text()}`);
      }
      return resp.json();
    } finally {
      await fetchContext.reset();
    }
  }

  async describeSecret(secretId) {
    return this._request('DescribeSecret', { SecretId: secretId });
  }

  async getSecretValue(secretId) {
    return this._request('GetSecretValue', { SecretId: secretId });
  }

  async getLastChangedDate(secretId) {
    try {
      const { LastChangedDate } = await this.describeSecret(secretId);
      return LastChangedDate * 1000;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`unable to fetch secret description '${secretId}'`, e);
      return 0;
    }
  }

  async loadSecrets(secretId) {
    try {
      const { SecretString } = await this.getSecretValue(secretId);
      return JSON.parse(SecretString);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`unable to load secrets from '${secretId}' (${e.code})`, e);
      const error = new Error('unable to load secrets');
      if (e.code === 'ThrottlingException') {
        error.statusCode = 429;
      }
      throw error;
    }
  }
}
