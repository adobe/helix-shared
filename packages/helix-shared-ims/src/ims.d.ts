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

import {UniversalContext} from '@adobe/helix-universal';

/**
 * IMS Profile
 */
export declare interface IMSProfile {
  /**
   * User name
   */
  name:string;

  /**
   * User email
   */
  email:string;

  /**
   * IMS user id
   */
  userId:string;
}

/**
 * IMS Config
 */
export declare interface IMSConfig {
  /**
   * IMS Client ID
   * @example 'my-client'
   */
  clientId:string;

  /**
   * IMS Scope(s)
   * @default 'AdobeID,openid'
   */
  scope?:string;

  /**
   * Force authentication. If {@code true} responds with a 401 for any unauthenticated
   * requests. Otherwise, functions can use the `IMSContext.profile` to check if authentication was
   * successful.
   * @default false
   */
  forceAuth?:boolean,

  /**
   * IMS environment. either 'stage' or 'prod'.
   * @example 'prod'
   * @default 'stage'
   */
  env?:string;

  /**
   * IMS api host. default depends on `env`
   */
  apiHost?:string;

  /**
   * Host used to create the redirect urls.
   * @example 'admin.hlx3.page'
   * @default _req.headers.host_
   */
  host?:string;

  /**
   * Path prefix to create the redirect urls.
   * @example '/helix-services/ims-demo/1.0.0'
   * @default ''
   */
  rootPath?:string;

  /**
   * Route that initiates the login
   * @default '/login'
   */
  routeLogin?:string;

  /**
   * Route that handles the redirect from the prompt-less login
   * @default '/login/ack'
   */
  routeLoginRedirect?:string;

  /**
   * Route that handles the redirect from the login with prompt
   * @default '/login/ack2'
   */
  routeLoginRedirectPrompt?:string;

  /**
   * Redirect route after login was successful.
   * @default '/'
   */
  routeLoginSuccess?:string;

  /**
   * Route that initiates the logout
   * @default '/logout'
   */
  routeLogout?:string;
}

/**
 * IMS Context
 */
export declare interface IMSContext {
  /**
   * The ims config
   */
  config:IMSConfig;

  /**
   * The ims access_token if authenticated.
   */
  accessToken?:string;

  /**
   * the ims profile or null if not authenticated
   */
  profile?:IMSProfile;
}

/**
 * Augmented universal context
 */
export declare interface UniversalContextWithIMS extends UniversalContext {
  /**
   * the ims context
   */
  ims:IMSContext;
}

