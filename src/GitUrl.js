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

const { URL } = require('url');

const RAW_TYPE = 'raw';
const API_TYPE = 'api';
const DEFAULT_BRANCH = 'master';
const MATCH_IP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
const MATCH_GIT_URL = /^\/([^/]+)\/([^/]+)\.git(\/.*)?$/;
/**
 * Represents a GIT url.
 */
class GitUrl {
  /**
   * Creates a new GitUrl either from a String URL or from a serialized object. The string must be
   * of the format "<scheme>://<hostname>[:<port>]/<owner>/<repo>.git[/<path>][#ref>]".
   *
   * see https://www.git-scm.com/docs/git-clone#_git_urls_a_id_urls_a
   *
   * @param {String|GitUrl~JSON} url URL or object defining the new git url.
   * @param {GitUrl~JSON} defaults Defaults for missing properties in the `url` param.
   */
  constructor(url, defaults = {}) {
    if (url === Object(url)) {
      this._url = new URL(`${url.protocol || defaults.protocol || 'https'}://${url.hostname || defaults.hostname || 'github.com'}`);
      this._url.port = url.port || defaults.port || 443;
      this._owner = url.owner || defaults.owner;
      this._repo = url.repo || defaults.repo;
      this._ref = url.ref || defaults.ref;
      this._path = url.path || defaults.path;

      if (!this._owner) {
        throw Error('Invalid URL: no owner');
      }
      if (!this._repo) {
        throw Error('Invalid URL: no repo');
      }
    } else {
      if (!url) {
        throw Error('Invalid URL: undefined');
      }
      // special case for `scp` form
      if (url.startsWith('git@')) {
        const cIdx = url.indexOf(':');
        if (cIdx < 0) {
          throw Error(`Invalid URL: no valid scp url: ${url}`);
        }
        const auth = url.substring(0, cIdx);
        let path = url.substring(cIdx + 1);
        if (!path.endsWith('/') && !path.endsWith('.git')) {
          path += '.git';
        }
        this._url = new URL(`ssh://${auth}/${path}`);
      } else {
        this._url = new URL(url);
      }

      const parts = MATCH_GIT_URL.exec(this._url.pathname);
      if (parts === null) {
        throw Error(`Invalid URL: no valid git-url: ${url}`);
      }
      // noinspection JSConsecutiveCommasInArrayLiteral
      [, this._owner, this._repo, this._path] = parts;
      this._ref = this._url.hash.substring(1);
    }

    // sanitize path
    if (this._path === '/') {
      this._path = '';
    }
  }

  /**
   * Constructs a root url for the given type.
   * @param {String} type Either `raw` or `api`.
   * @returns {string} The URL
   * @private
   */
  _getRootURL(type) {
    const protocol = this.protocol === 'ssh' ? 'https' : this.protocol;
    if (MATCH_IP.test(this.hostname)) {
      return `${protocol}://${this.host}/${type}`;
    }
    return `${protocol}://${type}.${this.host}`;
  }

  /**
   * The raw github url in the form 'https://raw.github.com/owner/repo/ref`. In case the
   * {@link #host} is an IP, the returned url is of the form 'https://xxx.xxx.xxx.xxx/raw/owner/repo/ref`.
   * @type String
   */
  get raw() {
    let url = this._getRootURL(RAW_TYPE);
    url += `/${this.owner}/${this.repo}/${this.ref || DEFAULT_BRANCH}`;
    return url;
  }

  /**
   * Root of the raw github url in the form 'https://raw.github.com`. In case the
   * {@link #host} is an IP, the returned url is of the form 'https://xxx.xxx.xxx.xxx/raw`.
   * @type String
   */
  get rawRoot() {
    return this._getRootURL(RAW_TYPE);
  }

  /**
   * Root of the github api in the form 'https://api.github.com`. In case the
   * {@link #host} is an IP, the returned url is of the form 'https://xxx.xxx.xxx.xxx/api`.
   * @type String
   */
  get apiRoot() {
    return this._getRootURL(API_TYPE);
  }

  /**
   * Protocol of the URL. eg `https`.
   * @type String
   */
  get protocol() {
    return this._url.protocol.replace(':', '');
  }

  /**
   * Hostname of the repository provider. eg `github.com`
   * @type String
   */
  get hostname() {
    return this._url.hostname;
  }

  /**
   * Host of the repository provider. eg `localhost:44245`
   * @type String
   */
  get host() {
    return this._url.host;
  }

  /**
   * Port of the repository provider.
   * @type String
   */
  get port() {
    return this._url.port;
  }

  /**
   * Repository owner.
   * @type String
   */
  get owner() {
    return this._owner;
  }

  /**
   * Repository name.
   * @type String
   */
  get repo() {
    return this._repo;
  }

  /**
   * Repository ref, such as `master`.
   * @type String
   */
  get ref() {
    return this._ref || '';
  }

  /**
   * Resource path. eg `/README.md`
   * @type String
   */
  get path() {
    return this._path || '';
  }

  /**
   * String representation of the git url.
   * @returns {String} url.
   */
  toString() {
    const hash = this.ref ? `#${this.ref}` : '';
    let auth = '';
    if (this._url.username) {
      auth = this._url.username;
    }
    if (this._url.password) {
      auth += `:${this._url.password}`;
    }
    if (auth) {
      auth += '@';
    }
    return `${this.protocol}://${auth}${this.host}/${this.owner}/${this.repo}.git${this.path}${hash}`;
  }

  /**
   * JSON Serialization of GitUrl
   * @typedef {Object} GitUrl~JSON
   * @property {String} protocol Transport protocol
   * @property {String} hostname Repository provider host name
   * @property {String} port Repository provider port
   * @property {String} host Repository provider hostname and port.
   * @property {String} owner Repository owner
   * @property {String} repo Repository name
   * @property {String} ref Repository reference, such as `master`
   * @property {String} path Relative path to the resource
   */

  /**
   * Returns a plain object representation.
   * @returns {GitUrl~JSON} A plain object suitable for serialization.
   */
  toJSON() {
    return {
      protocol: this.protocol,
      host: this.host,
      port: this.port,
      hostname: this.hostname,
      owner: this.owner,
      repo: this.repo,
      ref: this.ref,
      path: this.path,
    };
  }
}

module.exports = GitUrl;
