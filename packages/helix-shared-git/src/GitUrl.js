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

import { URL } from 'url';

import prune from '@adobe/helix-shared-prune';

const RAW_TYPE = 'raw';
const API_TYPE = 'api';
const DEFAULT_BRANCH = 'master';
const MATCH_IP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
const MATCH_GIT_URL = /^\/([^/]+)\/([^/]+)(\/.*)?$/;
/**
 * Represents a GIT url.
 */
export class GitUrl {
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
      this._type = 'object';
      this._port = url.port || defaults.port;
      this._protocol = url.protocol || defaults.protocol;
      this._hostname = url.hostname || defaults.hostname;
      const portStr = this._port ? `:${url.port || defaults.port}` : '';
      this._host = this._hostname ? `${this._hostname}${portStr}` : '';
      this._url = new URL(`${this._protocol || 'https'}://${this._hostname || 'github.com'}${portStr}`);
      this._owner = url.owner || defaults.owner;
      this._repo = url.repo || defaults.repo;
      this._ref = url.ref || defaults.ref;
      this._path = url.path || defaults.path;

      if (!this._owner) {
        throw Error('Invalid Git URL: Could not extract owner. Not a github repository url?');
      }
      if (!this._repo) {
        throw Error('Invalid Git URL: Could not extract repository. Not a github repository url?');
      }
    } else {
      if (!url) {
        throw Error('Invalid Git URL: URL is undefined (no URL given).');
      }
      this._type = 'string';
      // special case for `scp` form
      if (url.startsWith('git@')) {
        const cIdx = url.indexOf(':');
        if (cIdx < 0) {
          throw Error(`Invalid URL: Not a valid scp-style git url (missing the path to the actual repo): ${url}`);
        }
        const auth = url.substring(0, cIdx);
        const rIdx = url.indexOf('#');

        let urlWithoutRef = url.substring(cIdx + 1, rIdx > -1 ? rIdx : url.length);
        if (!urlWithoutRef.endsWith('/') && !urlWithoutRef.endsWith('.git')) {
          urlWithoutRef += '.git';
        }

        let path = urlWithoutRef;
        if (rIdx > -1) {
          // re-add the ref
          path += url.substring(rIdx);
        }

        this._url = new URL(`ssh://${auth}/${path}`);
      } else {
        this._url = new URL(url);
      }

      const parts = MATCH_GIT_URL.exec(this._url.pathname);
      if (parts === null) {
        throw Error(`Invalid URL: Not a valid git url: ${url}`);
      }
      // noinspection JSConsecutiveCommasInArrayLiteral
      [, this._owner, this._repo, this._path] = parts;
      this._ref = this._url.hash.substring(1);
      // add defaults if missing
      if (!this._path && 'path' in defaults) {
        this._path = defaults.path;
      }
      if (!this._ref && 'ref' in defaults) {
        this._ref = defaults.ref;
      }
    }

    // sanitize path
    if (this._path === '/') {
      this._path = '';
    }
    // sanitize .git
    if (this._repo.endsWith('.git')) {
      this._repo = this._repo.substring(0, this._repo.length - 4);
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
    if (type === 'raw' && this.host === 'github.com') {
      return `${protocol}://raw.githubusercontent.com`;
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
    return this._protocol || this._url.protocol.replace(':', '');
  }

  /**
   * Hostname of the repository provider. eg `github.com`
   * @type String
   */
  get hostname() {
    return this._hostname || this._url.hostname;
  }

  /**
   * Host of the repository provider. eg `localhost:44245`
   * @type String
   */
  get host() {
    return this._host || this._url.host;
  }

  /**
   * Port of the repository provider.
   * @type String
   */
  get port() {
    return this._port || this._url.port;
  }

  /**
   * Repository owner.
   * @type String
   */
  get owner() {
    return this._owner;
  }

  /**
   * Repository name (without .git extension).
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
   * Checks if this git url is _local_. A git-url is considered local if hostname is `localhost` and
   * the owner is `local` and the repo name is `default`. This is specific to helix.
   * @returns {boolean}
   */
  get isLocal() {
    return (this.hostname === 'localhost' || this.hostname === '127.0.0.1') && this.owner === 'local' && this.repo === 'default';
  }

  /**
   * Tests if this GitUrl is equal to `other` but ignores transport properties, such as protocol,
   * user and password.
   * @param other {GitUrl} the url to compare to
   * @returns {boolean}
   */
  equalsIgnoreTransport(other) {
    if (this === other) {
      return true;
    }
    if (!other) {
      return false;
    }
    return this.host === other.host && this.owner === other.owner && this.repo === other.repo
      && this.path === other.path && this.ref === other.ref;
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
   * @returns {GitUrl~JSON|String} A plain object suitable for serialization.
   */
  toJSON(opts) {
    if (opts && opts.keepFormat && this._type === 'string') {
      return this.toString();
    }
    if (opts && opts.minimal) {
      return prune({
        protocol: this._protocol,
        host: this._host,
        port: this._port,
        hostname: this._hostname,
        owner: this.owner,
        repo: this.repo,
        ref: this.ref,
        path: this.path,
      });
    }

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

  /**
   * @param {YAML.Document} doc
   * @param forceObject
   * @returns {*}
   */
  toYAMLNode(doc, forceObject) {
    if (this._type === 'string' && !forceObject) {
      return doc.createNode(this.toString());
    }
    return doc.createNode(this.toJSON({ minimal: true }));
  }
}
