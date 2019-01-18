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

const YAML_PAIR = require('yaml/pair');

const GitUrl = require('./GitUrl.js');
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

  toYAMLNode() {
    const props = utils.pruneEmptyValues({
      magic: this.magic,
      allow: this.allow,
      deny: this.deny,
    });
    if (!props) {
      return this.url.toYAMLNode();
    }
    const node = this.url.toYAMLNode(true);
    Object.keys(props).forEach((key) => {
      node.items.push(new YAML_PAIR(key, props[key]));
    });
    return node;
  }
}

module.exports = Static;
