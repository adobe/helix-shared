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
const Strain = require('./Strain.js');

/**
 * Strains
 */
class Strains extends Map {
  add(strain) {
    this.set(strain.name, strain);
    if (this._yamlNode) {
      const node = strain.toYAMLNode();
      node.spaceBefore = true;
      this._yamlNode.items.push(node);
    }
  }

  /**
   * Returns a json representation
   * @returns {Strains~JSON}
   */
  toJSON() {
    const strains = [];
    this.forEach((strain) => {
      strains.push(strain.toJSON());
    });
    return strains;
  }

  filterByCode(code) {
    return this.getByFilter((strain) => code.equalsIgnoreTransport(strain.code));
  }

  getByFilter(filterfn) {
    return [...this.values()].filter(filterfn);
  }

  getRuntimeStrains() {
    return this.getByFilter((strain) => !strain.isProxy());
  }

  getProxyStrains() {
    return this.getByFilter((strain) => strain.isProxy());
  }

  /**
   * Creates the strains from a yaml node
   * @param {YAMLSeq} node
   */
  fromYAML(node) {
    this._yamlNode = node;
    node.items.forEach((value) => {
      const strain = Strain.fromYAMLNode(value);
      this.set(strain.name, strain);
    });
  }
}

module.exports = Strains;
