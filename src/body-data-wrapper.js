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
const { Request } = require('@adobe/helix-fetch');

async function getData(request, { coerceNumber, coerceInt, coerceBoolean }) {
  if (/json/.test(request.headers.get('content-type'))) {
    const retval = await request.json();
    return retval;
  }
  let data = new URLSearchParams(new URL(request.url).search);
  if (/^application\/x-www-form-urlencoded/.test(request.headers.get('content-type'))) {
    data = new URLSearchParams(await request.text());
  }
  return Array.from(data.entries()).reduce((alldata, [key, value]) => {
    const bracketpattern = /\[([0-9]*)\]$/;
    // check for key names like [1] or [0]
    const isArray = bracketpattern.test(key);
    const arrayIndex = Number.parseInt(isArray && key.match(bracketpattern)[1], 10);
    const cleanKey = key.replace(bracketpattern, '');

    const values = (isArray ? [value] : data.getAll(key))
      .map((v) => (coerceBoolean && (v === 'true' || v === 'false') ? v === 'true' : v))
      .map((v) => (coerceInt && /^-?[0-9]+$/.test(v) ? Number.parseInt(v, 10) : v))
      .map((v) => (coerceNumber && !Number.isNaN(parseFloat(v)) ? parseFloat(v) : v));
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

function wrap(func, { coerceNumber, coerceInt, coerceBoolean } = {}) {
  return async (request, context) => {
    context.data = await getData(request, { coerceNumber, coerceInt, coerceBoolean });
    const newreq = new Request(request.url, request.init);
    return func(newreq, context);
  };
}

module.exports.bodyData = wrap;
