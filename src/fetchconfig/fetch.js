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
const URL = require('url');
const { fetch } = require('@adobe/helix-fetch').context({
  httpsProtocols:
  /* istanbul ignore next */
  process.env.HELIX_FETCH_FORCE_HTTP1 ? ['http1'] : ['http2', 'http1'],
});
const utils = require('../utils');
const cache = require('./cache');

function computeGithubURI(root, owner, repo, ref, path) {
  const rootURI = URL.parse(root);
  const rootPath = rootURI.path;
  // remove double slashes
  const fullPath = `${rootPath}/${owner}/${repo}/${ref}/${path}`.replace(
    /\/+/g,
    '/',
  );

  rootURI.pathname = fullPath;

  return URL.format(rootURI);
}

/**
 * Fetches an FSTab file from a GitHub repository
 * @param {object} opts options
 * @param {string} opts.root base URL for GitHub
 * @param {string} opts.owner GitHub owner or org
 * @param {string} opts.repo GitHub repository
 * @param {string} opts.ref GitHub ref
 * @param {string} opts.name Name of the Config File to fetch
 * @param {object} opts.log Helix-Log instance
 * @param {object} opts.options HTTP request options
 */
async function fetchConfigUncached(opts) {
  const {
    root, owner, repo, ref, log, options, name,
  } = opts;
  const response = await fetch(computeGithubURI(root, owner, repo, ref, name), options);
  const text = await response.text();
  if (response.ok) {
    return text;
  } else if (response.status === 404) {
    log.info(`No fstab.yaml found in repo ${owner}/${repo}, ${text}`);
    return '';
  }
  log[utils.logLevelForStatusCode(response.status)](`Invalid response (${response.status}) when fetching ${name} for ${owner}/${repo}`);
  const err = new Error('Unable to fetch fstab', text);
  err.status = utils.propagateStatusCode(response.status);
  throw err;
}

// keep it cachy.
const fetchConfigCached = cache(fetchConfigUncached, {
  hash: (fn, {
    owner, repo, ref, _, options,
  }) => ([
    fn.name,
    owner,
    repo,
    ref,
    options && options.headers && options.headers.Authorization
      ? options.headers.Authorization : undefined,
  ].join()),
});

module.exports = fetchConfigCached;
