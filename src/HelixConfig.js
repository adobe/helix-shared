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

const {
  concat, uniq, foldl, pipe,
} = require('ferrum');
const Strain = require('./Strain.js');
const Strains = require('./Strains.js');
const ConfigValidator = require('./ConfigValidator.js');
const BaseConfig = require('./BaseConfig.js');


const HELIX_CONFIG = 'helix-config.yaml';

class HelixConfig extends BaseConfig {
  constructor() {
    super(HELIX_CONFIG);
    this._strains = new Strains();
  }

  /**
   * @name ResolveFn
   * @function
   * @param {Strain} left the current candidate strain (can be undefined)
   * @param {Strain} right the alternative candidate strain (can be undefined)
   */

  /**
   * Updates the current configuration with the strains of another configuration
   * object and a user-defined resolver function.
   * @param {HelixConfig} other another Helix Config to merge
   * @param {ResolveFn} resolvefn a resolver function that returns either a strain or undefined
   * @returns {HelixConfig} the merged Helix Config, i.e. `this`.
   */
  merge(other, resolvefn) {
    const accept = (acceptedstrains, strainname) => {
      const strain = resolvefn(
        this.strains.get(strainname),
        other.strains.get(strainname),
      ); // resolve conflict with the resolverfn
      if (strain) {
        acceptedstrains.add(strain); // add the strain (if existing) to the new list of strains
      }
      return acceptedstrains;
    };

    this._strains = pipe( // in the following order:
      concat(other.strains.keys(), this.strains.keys()), // create a full list of strain names
      uniq, // remove duplicates
      foldl(new Strains(), accept), // use the accept function above to fill the new strain list
    );
    return this;
  }

  /**
   * Strains of this config.
   * @returns {Strains}
   */
  get strains() {
    return this._strains;
  }

  async validate() {
    // convert strains-map to array if needed (see https://github.com/adobe/helix-shared/issues/71)
    if (typeof this._cfg.strains === 'object' && !Array.isArray(this._cfg.strains)) {
      this._cfg.strains = Object.keys(this._cfg.strains).map((name) => {
        const strain = this._cfg.strains[name];
        strain.name = name;
        return strain;
      });
      // invalidate yaml document
      this._document = null;
    }
    new ConfigValidator().assetValid(this._cfg);
  }

  async init() {
    await this.loadConfig();
    await this.validate();

    this._version = this._cfg.version;
    if (this._document) {
      // create strains from document
      const strains = this._document.contents.items.filter((item) => item.key.value === 'strains');
      // strains.length is always > 0, since JSON schema mandates a strains object
      this._strains.fromYAML(strains[0].value);
    } else {
      this._cfg.strains.forEach((strain) => {
        this._strains.add(new Strain(strain));
      });
    }
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
