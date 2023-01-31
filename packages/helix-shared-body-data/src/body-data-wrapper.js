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
import { Request, Response } from '@adobe/fetch';

const BODY_METHODS = ['POST', 'PUT', 'PATCH'];

/**
 * Extracts the _data_ from the given request. The data can be provided either as request
 * parameters, url-encoded form data body, or a json body.
 *
 * Note that for post body requests, the body is consumed from the request and is no longer
 * available.
 *
 * @param {Request} request The universal request
 * @param {BodyDataOptions} [opts] Options
 * @returns {Promise<object>} the parsed data object.
 */
async function getData(request, opts) {
  const contentType = request.headers.get('content-type');
  if (/\/json/.test(contentType) && BODY_METHODS.includes(request.method)) {
    return request.json();
  }

  let data;
  if (/^application\/x-www-form-urlencoded/.test(contentType) && BODY_METHODS.includes(request.method)) {
    data = new URLSearchParams(await request.text());
  } else {
    data = new URL(request.url).searchParams;
  }

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
      .map((v) => (coerceNumber && /^[0-9.]+([eE][+-]?[0-9]*)?$/.test(v) && !Number.isNaN(parseFloat(v)) ? parseFloat(v) : v));
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
  }, {});
}

/**
 * Wraps a function with a body data middleware that extracts the request data.
 *
 * @param {UniversalFunction} func the universal function
 * @param {BodyDataOptions} [opts] Options
 * @returns {UniversalFunction} an universal function with the added middleware.
 */
export default function bodyData(func, opts = {}) {
  return async (request, context) => {
    try {
      context.data = await getData(request, opts);
    } catch (e) {
      const { log = console } = context;
      log.info(`error parsing post body: ${e.message}`);
      return new Response('', {
        status: 400,
        headers: {
          'x-error': 'error parsing request body',
        },
      });
    }
    const newreq = new Request(request.url, request.init);
    return func(newreq, context);
  };
}
