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
const { NamedMapHandler } = require('./NamedMapHandler');

const onedriveHandler = {
  test(m) {
    return /https:\/\/.*\.sharepoint\.com/.test(m.url) || m.url.startsWith('https://1drv.ms/');
  },
  decorate(m) {
    // eslint-disable-next-line no-param-reassign
    m.type = 'onedrive';
  },
};

const googleHandler = {
  test(m) {
    return !m.id && m.url.startsWith('https://drive.google.com/');
  },
  decorate(m) {
    // eslint-disable-next-line no-param-reassign
    m.type = 'google';
    // eslint-disable-next-line no-param-reassign
    m.id = m.url.split('/').pop();
  },
};

class MountConfig extends SchemaDerivedConfig {
  constructor() {
    super({
      filename: 'fstab.yaml',
      schemas: {
        '^/$': 'fstab.schema.json',
        '^/mountpoints/.*$': 'mountpoint.schema.json',
      },
      handlers: {
        '^/mountpoints$': NamedMapHandler,
      },
    });
    this._sanitized = null;
    this._decorators = [
      onedriveHandler,
      googleHandler,
    ];
  }

  get mountpoints() {
    if (!this._sanitized) {
      this._sanitized = (this._content.mountpoints || []).map((mp) => {
        const m = { ...mp };
        if (!m.path.endsWith('/')) {
          m.path += '/';
        }
        if (!m.type && m.url) {
          m.type = 'unknown'; // default type
          this._decorators.forEach((handler) => {
            if (handler.test(m)) {
              handler.decorate(m);
            }
          });
        }
        return m;
      });
    }
    return this._sanitized;
  }

  /**
   * Matches the given resource path against the mount points and returns the mount point if found.
   * The mount point will also include a `relPath` property, which denotes the relative path
   * from the mount points root.
   *
   * @param {string} resourcePath The resource path
   * @returns {Mountpoint|null} The matched mount point or {@code null}.
   */
  match(resourcePath) {
    if (!resourcePath.endsWith('/')) {
      // eslint-disable-next-line no-param-reassign
      resourcePath += '/';
    }
    const mp = this.mountpoints.find((m) => resourcePath.startsWith(m.path));
    if (!mp) {
      return null;
    }
    return {
      ...mp,
      relPath: resourcePath.substring(mp.path.length - 1, resourcePath.length - 1),
    };
  }
}

module.exports = MountConfig;
