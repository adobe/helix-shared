/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const fs = require('fs-extra');
const path = require('path');
const YAML = require('yaml');
const GitUrl = require('./GitUrl.js');
const cache = require('./fetchconfig/cache');
const fetch = require('./fetchconfig/fetch');

async function isFile(filePath) {
  try {
    return (await fs.stat(filePath)).isFile();
  } catch (e) {
    return false;
  }
}

class BaseConfig {
  /**
   *
   * @param {string} name name of the config file, e.g. `helix-config.yaml`
   */
  constructor(name) {
    this._cwd = process.cwd();
    this._cfgPath = '';
    this._source = '';
    this._cfg = null;
    this._document = null;
    this._logger = console;
    this._version = '';
    this._value = null;
    this._name = name;
    this._repo = null;
    this._transactionID = null;
  }

  withTransactionID(id) {
    this._transactionID = id;
    return this;
  }

  /**
   * Reset the cache with a new cache size
   * @param {object} options cache options
   * @param {number} options.maxSize
   */
  withCache(options) {
    cache.options(options);
    return this;
  }

  /**
   * Empty method to allow subclasses to intercept setting the
   * GitHub token, if authentication option are provided in the
   * repo options.
   */
  withGithubToken() {
    return this;
  }

  /**
   * Set the base repository to fetch a config from
   * @param {string} owner username or org
   * @param {string} repo repository
   * @param {string} ref ref name
   * @param {object} options options
   * @param {object} options.headers headers to be used for HTTP request
   * @param {string} options.headers.authorization authorization token to include
   */
  withRepo(owner, repo, ref, options = {}) {
    return this.withRepoURL(new GitUrl({
      owner,
      repo,
      ref,
    }), options);
  }

  /**
   * Set the base repository to fetch the config from.
   * @param {GitUrl} url The git url of the repository
   * @param {object} options options
   * @param {object} options.headers headers to be used for HTTP request
   * @param {string} options.headers.authorization authorization token to include
   */
  withRepoURL(url, options) {
    this._repo = {
      url,
      options,
    };
    if (options && options.headers && /^token /.test(options.headers.authorization)) {
      this.withGithubToken(options.headers.authorization.replace(/token /, ''));
    }
    return this;
  }

  withJSON(obj) {
    this._cfg = obj;
    return this;
  }

  withSource(value) {
    this._source = value;
    return this;
  }

  withConfigPath(cfgPath) {
    this._cfgPath = cfgPath;
    return this;
  }

  withLogger(logger) {
    this._logger = logger;
    return this;
  }

  withDirectory(cwd) {
    this._cwd = cwd;
    return this;
  }

  get directory() {
    return this._cwd;
  }

  get version() {
    return this._version;
  }

  get configPath() {
    return this._cfgPath || path.resolve(this._cwd, this._name);
  }

  get source() {
    return this._source;
  }

  get log() {
    return this._logger;
  }

  async hasFile() {
    return isFile(this.configPath);
  }

  async loadConfig() {
    if (this._cfg) {
      return;
    }

    if (!this._source) {
      if (this._repo) {
        // fetch the config file from the repo
        this._source = await fetch({
          ...this._repo,
          name: this._name,
          log: this._logger,
          options: {
            headers: {
              ...(this._repo && this._repo.options && this._repo.options.headers
                ? this._repo.options.headers
                : {}),
              'x-request-id': this._transactionID,
            },
          },
        });
      } else if (await this.hasFile()) {
        this._source = await fs.readFile(this.configPath, 'utf8');
      }
    }
    if (this._source.indexOf('\t') >= 0) {
      throw Error('Tabs not allowed in YAML');
    }
    this._document = YAML.parseDocument(this._source, {
      merge: true,
      schema: 'core',
    });
    this._cfg = this._document.toJSON() || {};
  }

  /**
   * Saves this config to {@link #configPath}
   * @returns {Promise<void>}
   */
  async saveConfig() {
    const src = this.toYAML();
    if (await fs.pathExists(this.configPath)) {
      await fs.copy(this.configPath, `${this.configPath}.old`);
    }
    return fs.writeFile(this.configPath, src, 'utf-8');
  }

  toYAML() {
    if (this._document) {
      return this._document.toString();
    }
    return YAML.stringify(this.toJSON());
  }
}

module.exports = BaseConfig;
