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
const SchemaDerivedConfig = require('./SchemaDerivedConfig.js');

const NamedPairHandler = (keyname, valuename) => ({
  get: (target, prop, receiver) => {
    console.log('named pairs: get', prop, target);
    if (prop === 'length') {
      return Object.keys(target).length;
    }
    const index = Number.parseInt(prop, 10);
    if (!Number.isNaN(index) && index >= 0) {
      const [key, value] = Object.entries(target)[index];
      const obj = {};
      obj[keyname] = key;
      obj[valuename] = value;
      return obj;
    }
    return target[prop];
  },
});

class MountConfig extends SchemaDerivedConfig {
  constructor() {
    super({
      filename: 'fstab.yaml',
      schemas: {
        '^/$': 'fstab.schema.json',
        '^/mountpoints/.*$': 'mountpoint.schema.json',
      },
      handlers: {
        '^/mountpoints$': NamedPairHandler('path', 'url'),
      },
    });
  }
}

module.exports = MountConfig;
