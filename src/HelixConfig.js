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
const GitUrl = require('./GitUrl.js');
const Strain = require('./Strain.js');

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
    this._cfgRelPath = '';
    this._cfg = {};
    this._logger = console;

    this._defaults = {
      content: new GitUrl('http://localhost/local/default.git'),
      code: new GitUrl('http://localhost/local/default.git'),
      staticRoot: '/dist',
      directoryIndex: 'index.html',
    };

    this._strains = new Map();
    this._strains.toJSON = () => {
      const strains = {};
      this._strains.forEach((strain, name) => {
        strains[name] = strain.toJSON();
      });
      return strains;
    };
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

  get strains() {
    return this._strains;
  }

  get log() {
    return this._logger;
  }

  async loadConfig() {
    const cfgPath = this._cfgPath || path.resolve(this._cwd, HELIX_CONFIG);
    if (await isFile(cfgPath)) {
      this._cfg = yaml.safeLoad(await fs.readFile(cfgPath, 'utf8')) || {};
      this._cfgPath = cfgPath;
      this._cfgRelPath = path.relative(this._cwd, cfgPath);
    }
  }

  async init() {
    await this.loadConfig();
    const cfg = this._cfg;

    if (cfg.content) {
      this._defaults.content = new GitUrl(cfg.content);
    } else if (cfg.contentRepo) {
      this.log.warn(`${this._cfgRelPath}: 'contentRepo' is deprecated. Use 'content' instead.`);
      this._defaults.content = new GitUrl(cfg.contentRepo);
    }
    if (cfg.code) {
      this._defaults.code = new GitUrl(cfg.code);
    }
    if (cfg.staticRoot) {
      this._defaults.staticRoot = cfg.staticRoot;
    }
    if (cfg.directoryIndex) {
      this._defaults.directoryIndex = cfg.directoryIndex;
    }

    if (cfg.strains) {
      Object.keys(cfg.strains).forEach((name) => {
        this._strains.set(name, new Strain(name, cfg.strains[name], this._defaults));
      });
    }
    // ensure that there is a default strain
    if (!this._strains.has('default')) {
      this._strains.set('default', new Strain('default', {}, this._defaults));
    }
    return this;
  }

  toJSON() {
    return {
      strains: this._strains.toJSON(),
    };
  }
}

module.exports = HelixConfig;
