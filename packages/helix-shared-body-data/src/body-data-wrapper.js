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
/* eslint-disable no-param-reassign */
import { Response } from '@adobe/fetch';

const BODY_METHODS = ['POST', 'PUT', 'PATCH'];

const NUMBER_PATTERN = /^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

export const MAX_ARRAY_INDEX = 99;

/**
 * Parses url-encoded parameters (the query or a form body) into an object without prototype.
 *
 * @param {URLSearchParams} data the parameters
 * @param {import('./body-data-wrapper').BodyDataOptions} opts Options
 * @returns {object} the parsed parameters
 */
function parseParams(data, opts) {
  const { coerceNumber, coerceInt, coerceBoolean } = opts;
  return Array.from(data.entries()).reduce((alldata, [key, value]) => {
    const bracketpattern = /\[([0-9]*)\]$/;
    // check for key names like [1] or [0]
    const isArray = bracketpattern.test(key);
    const arrayIndex = Number.parseInt(isArray && key.match(bracketpattern)[1], 10);
    const cleanKey = key.replace(bracketpattern, '');

    const values = (isArray ? [value] : data.getAll(key))
      .map((v) => (coerceBoolean && (v === 'true' || v === 'false') ? v === 'true' : v))
      .map((v) => (coerceInt && /^-?[0-9]+$/.test(v) ? Number.parseInt(v, 10) : v))
      .map((v) => (coerceNumber && NUMBER_PATTERN.test(v) ? Number(v) : v));
    if (arrayIndex > MAX_ARRAY_INDEX) {
      throw new Error(`array index out of range: ${key}`);
    }
    if (values.length === 1 && isArray && Number.isNaN(arrayIndex)) {
      // this means foo[] = 'bar'
      if (!Array.isArray(alldata[cleanKey])) {
        alldata[cleanKey] = [];
      }
      alldata[cleanKey].push(values[0]);
    } else if (values.length === 1 && isArray) {
      // this means foo[2] = 'bar'
      if (!Array.isArray(alldata[cleanKey])) {
        alldata[cleanKey] = [];
      }
      // eslint prefers destructuring. go figure...
      [alldata[cleanKey][arrayIndex]] = values;
    } else if (values.length === 1) {
      [alldata[key]] = values;
    } else if (values.length > 1) {
      alldata[key] = values;
    }
    return alldata;
  }, Object.create(null));
}

/**
 * Returns which kind of body the wrapper reads for this request, or `undefined` if it leaves
 * the body alone. Only the media type counts, not the parameters after `;`.
 *
 * @param {Request} request The universal request
 * @returns {string|undefined} `json`, `form`, `yaml`, `text` or `undefined`
 */
function getBodyType(request) {
  if (!BODY_METHODS.includes(request.method)) {
    return undefined;
  }
  const mediaType = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const [type, subtype, ...rest] = mediaType.split('/');
  if (!type || !subtype || rest.length) {
    return undefined;
  }
  if (subtype === 'json' || subtype.endsWith('+json')) {
    return 'json';
  }
  if (subtype === 'yaml' || subtype === 'x-yaml') {
    return 'yaml';
  }
  if (type === 'application' && subtype === 'x-www-form-urlencoded') {
    return 'form';
  }
  if (type === 'text') {
    return 'text';
  }
  return undefined;
}

function checkSize(size, maxBodySize) {
  if (maxBodySize !== undefined && size > maxBodySize) {
    const error = new Error(`request body too large: ${size} bytes, limit is ${maxBodySize}`);
    error.status = 413;
    throw error;
  }
}

/**
 * Reads and parses the request body from a clone, so the function can still read the request.
 * A clone of a stream body made of several chunks stalls once the unread side holds about
 * 32 KB. The helix-universal adapters pass the body as a string or a Buffer, which is one
 * chunk, so that doesn't happen with them.
 *
 * @param {Request} request The universal request
 * @param {string} type the body type
 * @param {import('./body-data-wrapper').BodyDataOptions} opts Options
 * @returns {Promise<any>} the parsed body
 */
async function readBody(request, type, opts) {
  const { maxBodySize } = opts;
  const raw = await request.clone().buffer();
  checkSize(raw.length, maxBodySize);

  if (type === 'json') {
    const json = JSON.parse(raw.toString());
    if (typeof json !== 'object' || json === null) {
      throw new Error('JSON body must be an object');
    }
    return json;
  }
  if (type === 'form') {
    return parseParams(new URLSearchParams(raw.toString()), opts);
  }
  return raw.toString();
}

/**
 * Wraps a function with a body data middleware that sets `context.data` to
 * `{ query, body, type }`.
 *
 * @param {UniversalFunction} func the universal function
 * @param {BodyDataOptions} [opts] Options
 * @returns {UniversalFunction} an universal function with the added middleware.
 */
export default function bodyData(func, opts = {}) {
  const { maxBodySize } = opts;
  if (maxBodySize !== undefined && !(Number.isInteger(maxBodySize) && maxBodySize >= 0)) {
    throw new TypeError(`maxBodySize must be a non-negative integer, got ${maxBodySize}`);
  }

  return async (request, context) => {
    try {
      const query = parseParams(new URL(request.url).searchParams, opts);
      const type = getBodyType(request);
      if (type) {
        const body = await readBody(request, type, opts);
        context.data = { query, body, type };
      } else {
        context.data = { query };
      }
    } catch (e) {
      const { log = console } = context;
      const status = e.status || 400;
      log.info(`error parsing post body: ${e.message}`);
      return new Response('', {
        status,
        headers: {
          'x-error': status === 413 ? 'request body too large' : 'error parsing request body',
        },
      });
    }
    return func(request, context);
  };
}
