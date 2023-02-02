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
/* eslint-disable no-param-reassign */
import { Response } from '@adobe/fetch';
import SecretsManager from './aws-secretsmanager.js';

const CACHE_EXPIRATION = 60 * 60 * 1000; // 1 hour
const CHECK_DELAY = 60 * 1000; // 1 minute

const cache = {
  loaded: 0,
  checked: 0,
  data: null,
};

/**
 * reset the cache - for testing only
 */
export function reset() {
  cache.loaded = 0;
  cache.checked = 0;
  cache.data = null;
}

/**
 * Loads the secrets from the respective secrets manager.
 *
 * @param {UniversalContext} ctx the context
 * @param {SecretsOptions} [opts] Options
 * @returns {Promise<object>} the secrets or {@code null}.
 */
async function loadSecrets(ctx, opts) {
  const runtime = ctx.runtime?.name ?? 'simulate';
  if (runtime === 'simulate') {
    // eslint-disable-next-line no-console
    console.warn('local secrets not loaded (simulate).');
    return {};
  }
  if (runtime !== 'aws-lambda') {
    const error = Error(`unsupported runtime: ${runtime}`);
    error.statusCode = 500;
    throw error;
  }
  if (!ctx.func?.package || !ctx.func?.name) {
    // eslint-disable-next-line no-console
    console.warn('local secrets not loaded. no ctx.func');
    return {};
  }

  const {
    expiration = CACHE_EXPIRATION,
    checkDelay = CHECK_DELAY,
    name = `/helix-deploy/${ctx.func.package}/${ctx.func.name}`,
  } = opts;

  const sm = new SecretsManager(process.env);
  const now = Date.now();
  let lastChanged = 0;

  if (!cache.checked) {
    cache.checked = now;
  } else if (now > cache.checked + checkDelay) {
    lastChanged = await sm.getLastChangedDate(name);
    cache.checked = Date.now();
  }
  if (!cache.data || now > cache.loaded + expiration || lastChanged > cache.loaded) {
    const params = await sm.loadSecrets(name);
    const nower = Date.now();
    // eslint-disable-next-line no-console
    console.info(`loaded ${Object.entries(params).length} package parameter in ${nower - now}ms`);
    cache.data = params;
    cache.loaded = nower;
  }
  return cache.data;
}

/**
 * Wraps a function with a secrets data middleware that loads the secrets
 *
 * @param {UniversalFunction} func the universal function
 * @param {SecretsOptions} [opts] Options
 * @returns {UniversalFunction} an universal function with the added middleware.
 */
export default function secrets(func, opts = {}) {
  return async (request, context) => {
    try {
      const s = await loadSecrets(context, opts);
      for (const [key, value] of Object.entries(s)) {
        context.env[key] = value;
        process.env[key] = value;
      }
    } catch (e) {
      const { log = console } = context;
      log.error(`error fetching secrets: ${e.message}`);
      return new Response('', {
        status: e.statusCode || 502,
        headers: {
          'x-error': 'error fetching secrets.',
        },
      });
    }
    return func(request, context);
  };
}
