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

/**
 * Strains
 */
class Strains {
  constructor() {
    this._strains = new Map();
  }

  /**
   * Returns a json representation
   * @returns {Strains~JSON}
   */
  toJSON() {
    const strains = {};
    this._strains.forEach((strain, name) => {
      strains[name] = strain.toJSON();
    });
    return strains;
  }


  add(strain) {
    this._strains.set(strain.name, strain);
  }

  get(name) {
    return this._strains.get(name);
  }

  has(name) {
    return this._strains.has(name);
  }

  get size() {
    return this._strains.size;
  }

  forEach(fn) {
    return this._strains.forEach(fn);
  }

  filterByCode(code) {
    return [...this._strains.values()].filter(strain => code.equalsIgnoreTransport(strain.code));
  }
}

module.exports = Strains;
