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

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const Strain = require('./Strain.js');
const Strains = require('./Strains.js');
const ConfigValidator = require('./ConfigValidator.js');

const HELIX_CONFIG = 'helix-config.yaml';

async function isFile(filePath) {
  try {
    return (await fs.stat(filePath)).isFile();
  } catch (e) {
    return false;
  }
}

class HelixConfig {
  constructor() {
    this._cwd = process.cwd();
    this._cfgPath = '';
    this._source = '';
    this._cfg = {};
    this._logger = console;
    this._version = '';

    this._strains = new Strains();
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
    return this._cfgPath || path.resolve(this._cwd, HELIX_CONFIG);
  }

  get source() {
    return this._source;
  }

  /**
   * Strains of this config.
   * @returns {Strains}
   */
  get strains() {
    return this._strains;
  }

  get log() {
    return this._logger;
  }

  async hasFile() {
    return isFile(this.configPath);
  }

  async loadConfig() {
    if (!this._source) {
      if (await this.hasFile()) {
        this._source = await fs.readFile(this.configPath, 'utf8');
      }
    }
    if (this._source.indexOf('\t') >= 0) {
      throw Error('Tabs not allowed in helix-config.yaml');
    }
    this._cfg = yaml.safeLoad(this._source) || this._cfg;
  }

  async validate() {
    new ConfigValidator().assetValid(this._cfg);
  }

  async init() {
    await this.loadConfig();
    await this.validate();

    const cfg = this._cfg;
    this._version = cfg.version;

    Object.keys(cfg.strains).forEach((name) => {
      this._strains.set(name, new Strain(name, cfg.strains[name]));
    });

    return this;
  }

  toJSON() {
    return {
      version: this._version,
      strains: this._strains.toJSON(),
    };
  }
}

module.exports = HelixConfig;
