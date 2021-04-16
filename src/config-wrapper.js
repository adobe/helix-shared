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
const { Request } = require('@adobe/helix-fetch');
const redirect = require('./RedirectConfig');

const loaders = {
  redirect,
};

async function getData(request, ...names) {
  if (/^application\/x-www-form-urlencoded/.test(request.headers.get('content-type'))) {
    const data = new URLSearchParams(await request.text());
    return names.reduce((prev, name) => {
      if (data.get(name)) {
        // eslint-disable-next-line no-param-reassign
        prev[name] = Number.isNaN(Number(data.get(name)))
          ? data.get(name)
          : Number.parseInt(data.get(name), 10);
      }
      return prev;
    }, {});
  } else if (/json/.test(request.headers.get('content-type'))) {
    const data = await request.json();
    return names.reduce((prev, name) => {
      if (data[name]) {
      // eslint-disable-next-line no-param-reassign
        prev[name] = data[name];
      }
      return prev;
    }, {});
  }
  // just return the request parameters
  const data = new URLSearchParams(new URL(request.url).search);
  return names.reduce((prev, name) => {
    if (data.get(name)) {
      // eslint-disable-next-line no-param-reassign
      prev[name] = Number.isNaN(Number(data.get(name)))
        ? data.get(name)
        : Number.parseInt(data.get(name), 10);
    }
    return prev;
  }, {});
}

function getToken({ headers }) {
  if (headers.get('authorization')) {
    return headers.get('authorization');
  }
  if (headers.get('x-github-token')) {
    return `token ${headers.get('x-github-token')}`;
  }
  return undefined;
}

function wrap(func, ...configs) {
  return async (request, context) => {
    const { owner, repo, ref } = getData(request, 'owner', 'repo', 'ref');
    const {
      transactionId,
    } = context.invocation;

    const options = {
      headers: {
        authorization: getToken(request),
      },
    };

    // init is a helper function in helix-fetch that makes it easy
    // to recreate a request by returning the inital options
    const newreq = new Request(request.url, request.init());

    if (!!owner && !!repo && !!ref) {
      const config = await configs
        .filter((name) => !!loaders[name])
        .reduce(async (confp, name) => {
          const conf = await confp;
          conf[name] = await new loaders[name]()
            .withTransactionId(transactionId)
            .withRepo(owner, repo, ref, options);
          return conf;
        }, {});

      context.config = config;
    } else if (context.log) {
      context.log.warn('expected owner, repo, ref to load config, proceeding without configurations');
    }
    return func(newreq, context);
  };
}

module.exports.config = wrap;
