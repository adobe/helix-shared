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
const URI = require('uri-js');
const hash = require('object-hash');
const utils = require('./utils.js');

class Origin {
  constructor(cfg) {
    if (typeof cfg === 'object') {
      this._hostname = cfg.hostname || cfg.address;
      this._errorThreshold = cfg.error_threshold || 0;
      this._firstByteTimeout = cfg.first_byte_timeout || 0;
      this._weight = cfg.weight || 100;
      this._address = cfg.address;
      this._connectTimeout = cfg.connect_timeout || 1000;
      this._name = cfg.name || `Proxy${this._hostname.replace(/[^\w]/g, '')}${hash(this._hostname).substr(0, 4)}`;
      this._betweenBytesTimeout = cfg.between_bytes_timeout || 10000;
      this._shield = cfg.shield || 'iad-va-us';
      this._SSLCertHostname = cfg.ssl_cert_hostname || this._hostname;
      this._maxConn = cfg.max_conn || 200;
      this._useSSL = !(cfg.use_ssl === false);
      this._path = cfg.path || '/';
      this._overrideHost = cfg.override_host;
      if (cfg.port && Number.parseInt(cfg.port, 10) > 0) {
        this._port = cfg.port;
      } else {
        this._port = this._useSSL ? 443 : 80;
      }
    } else if (cfg && URI.parse(cfg).scheme) {
      const backenduri = URI.parse(cfg);
      this._hostname = backenduri.host;
      this._errorThreshold = 0;
      this._firstByteTimeout = 15000;
      this._weight = 100;
      this._address = backenduri.host;
      this._connectTimeout = 1000;
      this._name = `Proxy${backenduri.host.replace(/[^\w]/g, '')}${hash(backenduri).substr(0, 4)}`;
      this._port = backenduri.port || (backenduri.scheme === 'https' ? 443 : 80);
      this._betweenBytesTimeout = 10000;
      this._shield = 'iad-va-us';
      this._SSLCertHostname = backenduri.host;
      this._maxConn = 200;
      this._useSSL = backenduri.scheme === 'https';
      this._path = backenduri.path;
    } else if (cfg) {
      throw new Error('Origin must be an absolute URL or an Object');
    } else {
      throw new Error('Invalid or empty configuration');
    }
  }

  get hostname() {
    return this._hostname;
  }

  get errorThreshold() {
    return this._errorThreshold;
  }

  get firstByteTimeout() {
    return this._firstByteTimeout;
  }

  get weight() {
    return this._weight;
  }

  get address() {
    return this._address;
  }

  get connectTimeout() {
    return Number.parseInt(this._connectTimeout, 10);
  }

  get name() {
    return this._name;
  }

  get port() {
    return Number.parseInt(this._port, 10);
  }

  get betweenBytesTimeout() {
    return this._betweenBytesTimeout;
  }

  get shield() {
    return this._shield;
  }

  get SSLCertHostname() {
    return this._SSLCertHostname;
  }

  get maxConn() {
    return this._maxConn;
  }

  get useSSL() {
    return this._useSSL;
  }

  get path() {
    return this._path;
  }

  get overrideHost() {
    return this._overrideHost;
  }

  /**
   * Returns a limited JSON representation that is compatible with the Fastly API
   */
  toFastlyJSON() {
    const json = {
      hostname: this.hostname,
      error_threshold: this.errorThreshold,
      first_byte_timeout: this.firstByteTimeout,
      weight: this.weight,
      address: this.address,
      connect_timeout: this.connectTimeout,
      name: this.name,
      port: this.port,
      between_bytes_timeout: this.betweenBytesTimeout,
      shield: this.shield,
      ssl_cert_hostname: this.SSLCertHostname,
      max_conn: this.maxConn,
      use_ssl: this.useSSL,
    };
    if (this.overrideHost) {
      json.override_host = this.overrideHost;
    }
    return json;
  }

  /**
   * Returns a full, round-trippable JSON representation
   */
  toJSON(opts) {
    const json = this.toFastlyJSON();
    json.path = this.path;
    if (opts && opts.minimal) {
      return utils.pruneEmptyValues(json);
    }
    return json;
  }
}

module.exports = Origin;
