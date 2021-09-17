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
const { parse } = require('cookie');

/**
 * Function wrapper that extracts the cookies from the request.
 *
 * @param {UniversalFunction} func the universal function
 * @returns {UniversalFunction} an universal function with the added middleware.
 */
function cookie(func) {
  return async (request, context) => {
    const hdr = request.headers.get('cookie');
    context.cookies = hdr ? parse(hdr) : {};
    return func(request, context);
  };
}

module.exports = cookie;
