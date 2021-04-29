/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const crypto = require('crypto');

/**
 * A glorified lookup table that translates backend errors into the appropriate
 * HTTP status codes and log levels for your service.
 * @param {int} status the HTTP status code you've been getting from the backend
 * @returns {Object} a pair of status code to return and log level to use in your code
 */
function lookupBackendResponses(status) {
  if (status < 400) {
    return { status, level: 'verbose' };
  } else if (status === 404) {
    return { status, level: 'info' };
  } else if (status === 429) {
    // Too Many Requests in the backend
    return { status: 503, level: 'error' };
    // report as: Service Unavailable
  } else if (status < 500) {
    return { status, level: 'warn' };
  } else if (status === 500) {
    // Internal Server error in the backend
    return { status: 502, level: 'error' };
    // Report as: Bad Gateway
  }
  return { status, level: 'error' };
}

/**
 * Computes the caching Surrogate-Key for the given url. The computation uses a hmac_sha256
 * with a fixed key: {@code "helix"}. the result is base64 encoded and truncated to 16 characters.
 * This algorithm is chosen, because similar functionality exists in Fastly's VCL api:
 *
 * ```
 * declare local var.key STRING;
 * set var.key = digest.hmac_sha256_base64("helix", "input");
 * set var.key = regsub(var.key, "(.{16}).*", "\1");
 * ```
 *
 * @param {*} url - The input url.
 * @returns {string} The computed key.
 */
function computeSurrogateKey(url) {
  const hmac = crypto.createHmac('sha256', 'helix'); // lgtm [js/hardcoded-credentials]
  hmac.update(String(url));
  return hmac.digest('base64').substring(0, 16);
}

/**
 * What is the appropriate status code to use in your service when your backend
 * responds with `status`? This function provides a standardized lookup function
 * to map backend responses to gateway responses, assuming you are implementing
 * the gateway.
 * @param {int} status the backend HTTP status code
 * @returns {int} the appropriate HTTP status code for your app
 */
function propagateStatusCode(status) {
  return lookupBackendResponses(status).status;
}

/**
 * What is the appropriate log level for logging HTTP responses you are getting
 * from a backend when the backend responds with `status`? This function provides
 * a standardized lookup function of backend status codes to log levels.
 *
 * You can use it like this:
 *
 * ```javascript
 * logger[logLevelForStatusCode(response.status)](response.message);
 * ```
 * @param {int} status the HTTP status code from your backend
 * @returns {string} the correct log level
 */
function logLevelForStatusCode(status) {
  return lookupBackendResponses(status).level;
}

/**
 * Cleans up a header value by stripping invalid characters and truncating to 1024 chars
 * @param {string} value a header value
 * @returns a valid header value
 */
function cleanupHeaderValue(value) {
  return value.replace(/[^\t\u0020-\u007E\u0080-\u00FF]/g, '').substr(0, 1024);
}

module.exports = {
  computeSurrogateKey,
  propagateStatusCode,
  logLevelForStatusCode,
  cleanupHeaderValue,
};
