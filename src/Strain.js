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

const GitUrl = require('./GitUrl.js');
const Origin = require('./Origin');

/**
 * Static content handling
 */
class Static {
  constructor(cfg, defaults) {
    this._url = new GitUrl(cfg, defaults);
    this._magic = cfg.magic || false;
    this._allow = cfg.allow || [];
    this._deny = cfg.deny || [];
  }

  get url() {
    return this._url;
  }

  get magic() {
    return this._magic;
  }

  get allow() {
    return this._allow;
  }

  get deny() {
    return this._deny;
  }

  get path() {
    return this._url.path;
  }

  get owner() {
    return this._url.owner;
  }

  get repo() {
    return this._url.repo;
  }

  get ref() {
    return this._url.ref;
  }

  /**
   * JSON Serialization of Static
   * @typedef Static~JSON
   * @augments GitUrl~JSON
   * @property {boolean} magic
   * @property {String[]} allow
   * @property {String[]} deny
   */

  /**
   * Returns a json representation
   * @returns {Static~JSON}
   */
  toJSON() {
    return Object.assign({}, this.url.toJSON(), {
      magic: this.magic,
      allow: this.allow,
      deny: this.deny,
    });
  }
}

/**
 * Performance Definition
 */
class Performance {
  constructor(cfg = {}) {
    this._device = cfg.device || '';
    this._location = cfg.location || '';
    this._connection = cfg.connection || '';
  }


  get device() {
    return this._device;
  }

  get location() {
    return this._location;
  }

  get connection() {
    return this._connection;
  }

  /**
   * JSON Serialization of Performance
   * @typedef Performance~JSON
   * @property {String} device
   * @property {String} location
   * @property {String} connection
   */

  /**
   * Returns a json representation
   * @returns {Performance~JSON}
   */
  toJSON() {
    return {
      device: this.device,
      location: this.location,
      connection: this.connection,
    };
  }
}

/**
 * Strain
 */
class Strain {
  constructor(name, cfg, defaults) {
    this._name = name;
    this._content = new GitUrl(cfg.content || {}, defaults.content);
    this._code = cfg.code || '';
    const staticDefaults = Object.assign({}, defaults.code.toJSON(), {
      path: defaults.staticRoot,
    });
    this._static = new Static(cfg.static || {}, staticDefaults);
    this._condition = cfg.condition || '';
    this._directoryIndex = cfg.directoryIndex || defaults.directoryIndex;
    this._perf = new Performance(cfg.perf);
    if (cfg.origin) {
      this._origin = new Origin(cfg.origin);
    } else {
      this._origin = null;
    }
    this._url = cfg.url || "";
    
    if (Array.isArray(cfg.urls)) {
      this._urls = new Set(cfg.urls);
    } else {
      this._urls = new Set();
    }
    if (this._url) {
      this._urls.add(this._url);
    }
    
    if (cfg.sticky===false) {
      this._sticky = false;
    } else if (cfg.sticky===true) {
      this._sticky = true;
    } else {
      // strains with a condition are sticky by default
      this._sticky = !!this._condition;
    }
  }

  get name() {
    return this._name;
  }

  get content() {
    return this._content;
  }

  set content(url) {
    this._content = url;
  }

  get code() {
    return this._code;
  }

  set code(code) {
    this._code = code;
  }

  get static() {
    return this._static;
  }

  get condition() {
    return this._condition;
  }

  get directoryIndex() {
    return this._directoryIndex;
  }

  get perf() {
    return this._perf;
  }

  get origin() {
    return this._origin;
  }

  isProxy() {
    return this._origin !== null;
  }

  get url() {
    return this._url;
  }

  get urls() {
    return [...this._urls];
  }

  get sticky() {
    return this._sticky;
  }

  /**
   * JSON Serialization of a Strain
   * @typedef Strain~JSON
   * @property {String} name
   * @property {String} code
   * @property {GitUrl~JSON} content
   * @property {Static~JSON} static
   * @property {String} condition
   * @property {String} directoryIndex
   * @property {Performance~JSON} perf
   * @property {Origin~JSON} origin
   */

  /**
   * Returns a json representation
   * @returns {Strain~JSON}
   */
  toJSON() {
    let json = {
      name: this.name,
      condition: this.condition,
      perf: this.perf.toJSON(),
      sticky: this.sticky,
      urls: this.urls,
      url: this.url
    };
    if (this.isProxy()) {
      return Object.assign({
        origin: this.origin.toJSON(),
      }, json);
    }
    return Object.assign({
      code: this.code,
      content: this.content.toJSON(),
      directoryIndex: this.directoryIndex,
      static: this.static.toJSON(),
    }, json);
  }
}

module.exports = Strain;
