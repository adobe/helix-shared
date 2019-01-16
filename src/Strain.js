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
const yaml = require('js-yaml');
const GitUrl = require('./GitUrl.js');
const Origin = require('./Origin');
const utils = require('./utils.js');
/**
 * Static content handling
 */
class Static {
  constructor(cfg, defaults = {}) {
    this._url = new GitUrl(cfg, defaults);
    this._magic = cfg.magic || false;
    this._allow = cfg.allow || [];
    this._deny = cfg.deny || [];

    if (!this._url.path) {
      // todo: ... this is a by ugly
      // eslint-disable-next-line no-underscore-dangle
      this._url._path = '/htdocs';
    }
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
  toJSON(opts) {
    let json = {
      magic: this.magic,
      allow: this.allow,
      deny: this.deny,
    };
    if (opts && (opts.minimal || opts.keepFormat)) {
      json = utils.pruneEmptyValues(json);
    }
    if (!json) {
      return this.url.toJSON(opts);
    }
    const myOpts = Object.assign({}, opts);
    delete myOpts.keepFormat;
    return Object.assign(json, this.url.toJSON(myOpts));
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
  toJSON(opts) {
    const json = {
      device: this.device,
      location: this.location,
      connection: this.connection,
    };
    if (opts && opts.minimal) {
      return utils.pruneEmptyValues(json);
    }
    return json;
  }
}

/**
 * Strain
 */
class Strain {
  constructor(name, cfg) {
    this._name = name;
    if (cfg.origin) {
      // proxy
      this._origin = new Origin(cfg.origin);
    } else {
      this._origin = null;
      this._content = new GitUrl(cfg.content);
      this._code = new GitUrl(cfg.code);
      // todo: 1. do we still need whilelists?
      this._static = new Static(cfg.static);
      this._directoryIndex = cfg.directoryIndex;
      this._package = cfg.package || '';
    }

    // todo: schema for perf
    this._perf = new Performance(cfg.perf);
    this._condition = cfg.condition || '';

    // when `sticky` is not set
    // assume the strain to be sticky when there is a condition
    this._sticky = cfg.sticky === undefined ? this._condition !== '' : !!cfg.sticky;

    // todo: I assume this will go into the new condition language
    // todo: if not, I would only have 1 property `url` that can be single or multi valued
    this._url = cfg.url ? URI.normalize(cfg.url) : '';
    this._urls = new Set(Array.isArray(cfg.urls) ? cfg.urls.map(URI.normalize) : []);
    if (this._url) {
      this._urls.add(this._url);
    }

    this._params = Array.isArray(cfg.params) ? cfg.params : [];
  }

  clone() {
    return new Strain(this.name, this.toJSON({ keepFormat: true }));
  }

  get url() {
    return this._url;
  }

  get urls() {
    return Array.from(this._urls.values());
  }

  set urls(value) {
    if (Array.isArray(value)) {
      this._urls = Array.from(value);
    } else {
      this._urls = [value];
    }
    this._url = this._urls.length > 0 ? this._urls[0] : '';
  }

  get sticky() {
    return this._sticky;
  }

  /**
   * Name of this strain.
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  set name(value) {
    this._name = value;
  }

  /**
   * GitUrl of the content repository
   * @returns {GitUrl}
   */
  get content() {
    return this._content;
  }

  set content(url) {
    this._content = url;
  }

  /**
   * GitUrl of the code repository
   * @returns {GitUrl}
   */
  get code() {
    return this._code;
  }

  set code(code) {
    this._code = code;
  }

  /**
   * Static information of this strain
   * @returns {Static}
   */
  get static() {
    return this._static;
  }

  get package() {
    return this._package;
  }

  set package(value) {
    this._package = value;
  }

  get params() {
    return this._params;
  }

  get condition() {
    return this._condition;
  }

  set condition(value) {
    this._condition = value;
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
  toJSON(opts) {
    const json = {
      sticky: this.sticky,
      condition: this.condition,
      perf: this.perf.toJSON(opts),
      urls: this.urls,
    };
    if (this.url) {
      json.url = this.url;
    }
    if (this.params.length > 0) {
      json.params = this.params;
    }
    if (this.isProxy()) {
      return Object.assign({
        origin: this.origin.toJSON(opts),
      }, json);
    }
    const ret = Object.assign({
      code: this.code.toJSON(opts),
      content: this.content.toJSON(opts),
      static: this.static.toJSON(opts),
      directoryIndex: this.directoryIndex,
      package: this.package,
    }, json);
    if (opts && opts.minimal) {
      return utils.pruneEmptyValues(ret);
    }
    return ret;
  }

  toYAML() {
    const json = this.toJSON({
      keepFormat: true,
      minimal: true,
    });
    delete json.name;
    return yaml.safeDump({
      [this.name]: json,
    });
  }
}

module.exports = Strain;
