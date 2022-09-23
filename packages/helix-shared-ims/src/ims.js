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
const fetchAPI = require('@adobe/fetch');
const { parse, serialize } = require('cookie');

const { context: fetchContext, ALPN_HTTP1_1, Response } = fetchAPI;
/* c8 ignore next */
const { fetch } = process.env.HELIX_FETCH_FORCE_HTTP1
  /* c8 ignore next */
  ? fetchContext({
    alpnProtocols: [ALPN_HTTP1_1],
    userAgent: 'adobe-fetch', // static user agent for test recordings
  })
  /* c8 ignore next */
  : fetchAPI;

const IMS_ENDPOINTS = {
  stage: 'https://ims-na1-stg1.adobelogin.com',
  prod: 'https://ims-na1.adobelogin.com',
};

/**
 * Wrapper function to easily perform adobe IMS authentication
 *
 * **Usage:**
 *
 * ```js
 * const wrap = require('@adobe/helix-shared-wrap');
 * const bodyData = require('@adobe/helix-shared-body-data');
 * const ims = require('@adobe/helix-shared-ims');
 *
 * async main(req, context) {
 *   // …my action code…
 *   if (context.ims.profile) {
 *     // do authenticated stuff
 *   }
 * }
 *
 * module.exports.main = wrap(main)
 *   .with(ims, { clientId: 'my-client' })
 *   .with(bodyData)
 *   .with(logger);
 * ```
 *
 * @module ims
 */

/**
 * Calculates the login redirect response
 * @param {UniversalContextWithIMS} ctx universal context
 * @param {boolean} noPrompt flag indicating if the login should be silent
 * @returns {Response} redirect response
 */
function redirectToLogin(ctx, noPrompt) {
  const { log, ims: { config } } = ctx;
  const url = new URL(`${config.apiHost}/ims/authorize/v1`);
  const redirectPath = noPrompt
    ? config.routeLoginRedirect
    : config.routeLoginRedirectPrompt;
  url.searchParams.append('client_id', config.clientId);
  url.searchParams.append('response_type', 'token');
  url.searchParams.append('scope', config.scope);
  url.searchParams.append('state', '1234');
  url.searchParams.append('redirect_uri', `https://${config.host}${config.rootPath}${redirectPath}`);
  url.searchParams.append('response_mode', 'query');
  if (noPrompt) {
    url.searchParams.append('prompt', 'none');
  }

  log.debug('redirecting to login page', url.href);
  return new Response('', {
    status: 302,
    headers: {
      'cache-control': 'no-store, private, must-revalidate',
      location: url.href,
    },
  });
}

/**
 * Fetches the ims profile
 * @param {UniversalContextWithIMS} ctx the context of the universal serverless function
 * @returns {Promise<IMSProfile|null>}
 */
async function fetchProfile(ctx) {
  const { log, ims } = ctx;
  if (!ims.accessToken) {
    log.info('no access token to fetch profile');
    return null;
  }
  try {
    const url = new URL(`${ims.config.apiHost}/ims/profile/v1`);
    const res = await fetch(url.href, {
      method: 'POST',
      headers: {
        authorization: `bearer ${ims.accessToken}`,
      },
    });
    if (res.ok) {
      const r = await res.json();
      return {
        name: r.name,
        email: r.email,
        userId: r.userId,
      };
    }
    if (res.status === 401) {
      log.info('not authorized to fetch profile.');
    } else {
      log.error(`error fetching profile: ${res.status} `, await res.text());
    }
  } catch (e) {
    log.error('error fetching profile:', e.message);
  }
  return null;
}

/**
 * Sends the logout request to IMS and clears the access token cookie.
 * @param {UniversalContextWithIMS} ctx the context of the universal serverless function
 * @returns {Promise<Response>}
 */
async function logout(ctx) {
  const { log, ims } = ctx;
  try {
    const url = new URL(`${ims.config.apiHost}/ims/logout/v1`);
    url.searchParams.append('client_id', ims.config.clientId);
    if (ctx.ims.accessToken) {
      url.searchParams.append('access_token', ims.accessToken);
    }

    log.debug('logging out', url.href);
    const res = await fetch(url.href, {
      method: 'POST',
    });
    if (!res.ok) {
      log.warn(`unable to logout ${res.status}`, await res.text());
    }
  } catch (e) {
    log.warn('error during logout request:', e.message);
  }

  return new Response('', {
    status: 200,
    headers: {
      'cache-control': 'no-store, private, must-revalidate',
      'set-cookie': serialize('ims_access_token', '', {
        path: ims.config.rootPath || '/', httpOnly: true, secure: true, expires: new Date(0),
      }),
    },
  });
}

/**
 * Wraps a function with an ims authorization middle ware. If the request is authenticated, the
 * `context.ims` will contain a `profile` object, representing the authenticated user profile.
 *
 * The wrapper claims several routes:
 *
 * The `IMSConfig.routeLogin` (default '/login') is used
 * to respond with a redirect to the IMS login page in 'no-prompt' mode. i.e. the IMS page will
 * not provide username/password fields to login the user, but tries instead to silently login.
 * After authentication the IMS login page redirects back to `IMSConfig.routeLoginRedirect`.
 *
 * The `IMSConfig.routeLoginRedirect` (default '/login/ack') route handles the response from the
 * first, silent login attempt. The the login was successful, it will respond with a redirect to
 * the root `/`.
 * if not successful, it will respond with a redirect again to the IMS login page in
 * normal mode, i.e. where the IMS page provides means to login. After login, the IMS login
 * page redirects back to `IMSConfig.routeLoginRedirectPrompt`.
 *
 * The `IMSConfig.routeLoginRedirectPrompt` (default '/login/ack2') route handles the response from
 * the second login attempt.
 * The the login was successful, it will respond with a redirect to the root `/`,
 * otherwise the request remains unauthenticated.
 *
 * After a successful login, a `ims_access_token` cookie is set on the response, which is
 * then used for subsequent requests.
 *
 * The `IMSConfig.routeLogout` (default '/logout') is used to logout the user. It sends a
 * request to the IMS logout endpoint and subsequently clears the `ims_access_token` cookie.
 * The response is always be a 200.
 *
 * The IMS access token can either be provided via the `ims_access_token` cookie, or a
 * request parameter with the same name.
 *
 * @param {UniversalFunction} func the universal function
 * @param {IMSConfig} [options] Options
 * @returns {UniversalFunction} an universal function with the added middleware.
 */
function imsWrapper(func, options = {}) {
  return async (req, ctx) => {
    const { data = {} } = ctx;

    // support dynamic envs
    const opts = Object.entries(options).reduce((prev, [key, value]) => {
      if (typeof value === 'function') {
        // eslint-disable-next-line no-param-reassign
        prev[key] = value(req, ctx);
      } else {
        // eslint-disable-next-line no-param-reassign
        prev[key] = value;
      }
      return prev;
    }, {});

    if (!opts.clientId) {
      throw new Error('ims wrapper missing config property \'clientId\'.');
    }

    const imsEnv = opts.env || 'stage';
    const config = {
      env: imsEnv,
      clientId: '',
      scope: 'AdobeID,openid',
      forceAuth: false,
      apiHost: IMS_ENDPOINTS[imsEnv],
      host: req.headers.get('host'),
      rootPath: '',
      routeLogin: '/login',
      routeLoginRedirect: '/login/ack',
      routeLoginRedirectPrompt: '/login/ack2',
      routeLogout: '/logout',
      routeLoginSuccess: '/',
      ...opts,
    };

    // add cookies if not already present
    if (!ctx.cookies) {
      const hdr = req.headers.get('cookie');
      ctx.cookies = hdr ? parse(hdr) : {};
    }

    ctx.ims = {
      config,
      // get the access token either from the cookie or from the request data
      accessToken: ctx.cookies.ims_access_token || data.ims_access_token,
    };

    let newToken = '';
    // handle /login route
    if (ctx.pathInfo.suffix === config.routeLogin) {
      // for plain login, redirect to ims login page
      return redirectToLogin(ctx, true);
    }

    // handle /login/ack route
    if (ctx.pathInfo.suffix === config.routeLoginRedirect) {
      newToken = data.access_token;
      if (!newToken) {
        // if redirected from ims, but no token was provided, try login with prompt
        // IMS has a bug here as it doesn't honor the response_type with the no-prompt login
        return redirectToLogin(ctx, false);
      }
    }

    // handle /login/ack2 route
    if (ctx.pathInfo.suffix === config.routeLoginRedirectPrompt) {
      newToken = data.access_token;
      if (!newToken) {
        // if still no access token, send 401
        return new Response('', {
          status: 401,
        });
      }
    }

    // if there is a new token, set the cookie and redirect to /
    if (newToken) {
      return new Response('', {
        status: 302,
        headers: {
          'cache-control': 'no-store, private, must-revalidate',
          'set-cookie': serialize('ims_access_token', newToken, { path: config.rootPath || '/', httpOnly: true, secure: true }),
          location: `${config.rootPath}${config.routeLoginSuccess}`,
        },
      });
    }

    // handle /logout route
    if (ctx.pathInfo.suffix === config.routeLogout) {
      return logout(ctx);
    }

    // reject if not token and auth enforced
    if (!ctx.ims.accessToken && config.forceAuth) {
      return new Response('', {
        status: 401,
      });
    }

    // fetch ims profile
    ctx.ims.profile = await fetchProfile(ctx);
    if (!ctx.ims.profile && config.forceAuth) {
      return new Response('', {
        status: 401,
      });
    }

    return func(req, ctx);
  };
}

module.exports = imsWrapper;
