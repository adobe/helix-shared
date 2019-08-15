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

const YAML = require('yaml');
const utils = require('./utils.js');

/**
 * Performance Definition
 */
class Performance {
  constructor(cfg = {}) {
    this._device = cfg.device || '';
    this._location = cfg.location || '';
    this._connection = cfg.connection || '';
    this._thresholds = Object.keys(cfg).reduce((p, k) => {
      // copy all properties that are numbers
      if (cfg[k] && typeof cfg[k] === 'number') {
        // eslint-disable-next-line no-param-reassign
        p[k] = cfg[k];
      }
      return p;
    }, {});
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

  get thresholds() {
    return this._thresholds;
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
      ...this.thresholds,
    };
    if (opts && opts.minimal) {
      return utils.pruneEmptyValues(json);
    }
    return json;
  }

  toYAMLNode() {
    const json = this.toJSON({ minimal: true });
    return json ? YAML.createNode(json) : null;
  }
}
module.exports = Performance;
