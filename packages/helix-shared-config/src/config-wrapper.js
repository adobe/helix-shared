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
const { Request, Response } = require('@adobe/helix-fetch');
const { cleanupHeaderValue } = require('@adobe/helix-shared-utils');
const fstab = require('./MountConfig');
const index = require('./IndexConfig');

const loaders = {
  fstab,
  index,
};

/**
 * Exported only for testisg
 * @param {Request} request a fetch-API Request
 * @param  {...string} names the parameter names to extract
 * @returns {object} an object with the provided parameter names as keys
 */
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
    const ret = names.reduce((prev, name) => {
      if (data[name]) {
      // eslint-disable-next-line no-param-reassign
        prev[name] = data[name];
      }
      return prev;
    }, {});
    return ret;
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

function getAuthHeaderValue({ headers }) {
  if (headers.get('authorization')) {
    return headers.get('authorization');
  }
  if (headers.get('x-github-token')) {
    return `token ${headers.get('x-github-token')}`;
  }
  return undefined;
}

function wrap(func, required, ...configs) {
  return async (request, context) => {
    const { owner, repo, ref } = await getData(request, 'owner', 'repo', 'ref');
    const {
      transactionId,
    } = context.invocation || {};

    const authorization = getAuthHeaderValue(request);

    const options = {
      headers: {
      },
    };
    if (authorization) {
      options.headers.authorization = authorization;
    }

    // init is a helper function in helix-fetch that makes it easy
    // to recreate a request by returning the inital options
    // the request needs to be re-created because `getData` consumed
    // the body
    const newreq = new Request(request.url, request.init);

    context.config = {};
    if (!owner || !repo || !ref) {
      if (required) {
        return new Response('Unable to load configuration, owner, repo, ref not provided', {
          status: 400,
          headers: {
            'x-error': 'Unable to load configuration, owner, repo, ref not provided',
          },
        });
      } else if (context.log) {
        context.log.warn('expected owner, repo, ref to load config, proceeding without configurations');
      }
    } else {
      try {
        const pairs = await Promise.all(configs
          .filter((name) => !!loaders[name])
          .map(async (name) => {
            try {
              const configuration = await new loaders[name]()
                .withTransactionID(transactionId)
                .withRepo(owner, repo, ref, options)
                .withLogger(context.log)
                .init();

              if (!configuration.source) {
                throw new Error(`${name} config is empty`);
              }
              return [name, configuration];
            } catch (e) {
              if (required) {
                throw new Error(`Unable to load ${name} config for ${owner}, ${repo}, ${ref}: ${e.message}`);
              } else if (context.log) {
                context.log.warn(`Unable to load ${name} config for ${owner}, ${repo}, ${ref}: ${e.message}`);
              }
            }
            return [];
          }));

        const config = pairs.reduce((conf, [name, configuration]) => {
          if (name && configuration) {
            // eslint-disable-next-line no-param-reassign
            conf[name] = configuration;
          }
          return conf;
        }, {});

        context.config = config;
      } catch (e) {
        return new Response(e.message, {
          status: 502,
          headers: {
            'Content-Type': 'text/plain',
            'x-error': cleanupHeaderValue(e.message),
          },
        });
      }
    }
    return func(newreq, context);
  };
}

function requiredConfig(func, ...configs) {
  return wrap(func, true, ...configs);
}

function optionalConfig(func, ...configs) {
  return wrap(func, false, ...configs);
}

module.exports = {
  requiredConfig, optionalConfig, getData,
};
