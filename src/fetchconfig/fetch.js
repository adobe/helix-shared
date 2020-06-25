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
const { fetch } = require('@adobe/helix-fetch').context({
  httpsProtocols:
  /* istanbul ignore next */
    process.env.HELIX_FETCH_FORCE_HTTP1 ? ['http1'] : ['http2', 'http1'],
});
const utils = require('../utils');
const cache = require('./cache');

/**
 * Fetches an FSTab file from a GitHub repository
 * @param {object} opts options
 * @param {GitUrl} opts.url the git url of the repo
 * @param {string} opts.name Name of the Config File to fetch
 * @param {object} opts.log Helix-Log instance
 * @param {object} opts.options HTTP request options
 */
async function fetchConfigUncached(opts) {
  const {
    url, log, options, name,
  } = opts;
  const response = await fetch(`${url.raw}/${name}`, options);
  const text = await response.text();
  if (response.ok) {
    return text;
  } else if (response.status === 404) {
    log.info(`No ${name} found in repo ${url.owner}/${url.repo}, ${text}`);
    return '';
  }
  log[utils.logLevelForStatusCode(response.status)](`Invalid response (${response.status}) when fetching ${name} for ${url.owner}/${url.repo}`);
  const err = new Error(`Unable to fetch ${name}: ${text}`);
  err.status = utils.propagateStatusCode(response.status);
  throw err;
}

// keep it cachy.
const fetchConfigCached = cache(fetchConfigUncached, {
  hash: (fn, {
    url, options, name,
  }) => ([
    fn.name,
    url,
    name,
    options && options.headers && options.headers.Authorization
      ? options.headers.Authorization : undefined,
  ].join()),
});

module.exports = fetchConfigCached;
