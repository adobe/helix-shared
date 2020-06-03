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
const { MountPointHandler } = require('./MountPointHandler');

const fstabSchema = require('./schemas/fstab.schema.json');
const mountpointSchema = require('./schemas/mountpoint.schema.json');

/**
 * Cleans up the URL by removing parameters that are deemed special. These
 * special parameters will be returned in the return object instead.
 * @param {object} m the mount point
 * @param {string} m.url mount point URL
 * @param  {...string} specialparams list of special parameters that should be
 * removed from the URL and returned in the object
 * @returns {object} an object with a clean URL and extracted parameters
 */
function cleanURL(m, ...specialparams) {
  const url = new URL(m.url);
  const extracted = specialparams.reduce((obj, param) => {
    if (url && url.searchParams && url.searchParams.has(param)) {
      // eslint-disable-next-line no-param-reassign
      obj[param] = url.searchParams.get(param);
      url.searchParams.delete(param);
    }
    return obj;
  }, {});

  return {
    ...m,
    ...extracted,
    url: url.href,
  };
}

const onedriveDecorator = {
  test(m) {
    return /https:\/\/.*\.sharepoint\.com/.test(m.url) || m.url.startsWith('https://1drv.ms/');
  },
  decorate(m) {
    return {
      ...cleanURL(m, 'fallback'),
      type: 'onedrive',
    };
  },
};

const googleDecorator = {
  test(m) {
    return !m.id && m.url.startsWith('https://drive.google.com/');
  },
  decorate(m) {
    return {
      ...cleanURL(m, 'fallback'),
      type: 'google',
      id: m.url.split('/').pop(),
    };
  },
};

class MountConfig extends SchemaDerivedConfig {
  constructor() {
    super({
      filename: 'fstab.yaml',
      schemas: {
        '^/$': fstabSchema,
        '^/mountpoints/.*$': mountpointSchema,
      },
      handlers: {
        '^/mountpoints$': MountPointHandler([onedriveDecorator, googleDecorator]),
      },
    });
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
    const fullPath = resourcePath.endsWith('/') ? resourcePath : `${resourcePath}/`;


    const [mp] = this.mountpoints
      .filter((m) => fullPath.startsWith(m.path)) // beginning must match
      .map((m) => ({
        ...m,
        relPath: fullPath.substring(m.path.length - 1, fullPath.length - 1),
      }));

    return mp || null;
  }
}

module.exports = MountConfig;
