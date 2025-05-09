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
import { SchemaDerivedConfig } from './SchemaDerivedConfig.js';
import { MountPointHandler } from './MountPointHandler.js';

import fstabSchema from './schemas/fstab.schema.cjs';
import mountpointSchema from './schemas/mountpoint.schema.cjs';

/**
 * Cleans up the URL by removing parameters that are deemed special. These
 * special parameters will be returned in the return object instead.
 * @param {object} m the mount point
 * @param {string} m.url mount point URL
 * @param  {...string} specialparams list of special parameters that should be
 * removed from the URL and returned in the object
 * @returns {object} an object with a clean URL and extracted parameters
 */
function stripQuery(m, ...specialparams) {
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
    return /^https:\/\/[a-z0-9-]+\.sharepoint\.com\//.test(m.url) || m.url?.startsWith('https://1drv.ms/') || m.url?.startsWith('onedrive:');
  },
  decorate(m) {
    return {
      ...stripQuery(m, 'fallbackPath'),
      type: 'onedrive',
    };
  },
};

const googleDecorator = {
  test(m) {
    return m.url?.startsWith('https://drive.google.com/') || m.url?.startsWith('gdrive:');
  },
  decorate(m) {
    const url = new URL(m.url);
    return {
      ...stripQuery(m, 'fallbackPath'),
      type: 'google',
      id: url.protocol === 'gdrive:'
        ? url.pathname
        : url.pathname.split('/').pop(),
    };
  },
};

const githubDecorator = {
  re: /^https:\/\/github.com\/(?<owner>[^/]+)\/(?<repo>[^/]+)(\/tree\/(?<ref>[^/]+)(?<path>.*))?$/,
  test(m) {
    return this.re.test(m.url);
  },
  decorate(m) {
    const {
      owner, repo, ref, path,
    } = m.url.match(this.re).groups;

    const ret = {
      type: 'github',
      owner,
      repo,
      ref,
      path: m.path,
      basePath: path,
      url: m.url,
    };
    return ret;
  },
};

export class MountConfig extends SchemaDerivedConfig {
  constructor() {
    super({
      filename: 'fstab.yaml',
      type: 'fstab',
      schemas: {
        '^/$': fstabSchema,
        '^/mountpoints/.*$': mountpointSchema,
      },
      handlers: {
        '^/mountpoints$': MountPointHandler([onedriveDecorator, googleDecorator, githubDecorator]),
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
    const docPath = `${resourcePath}.md`;

    const [mp] = this.mountpoints
      .filter((m) => (m.isDocument ? docPath === m.path : fullPath.startsWith(m.path)))
      .map((m) => ({
        ...m,
        relPath: m.isDocument ? '' : fullPath.substring(m.path.length - 1, resourcePath.length),
      }));

    return mp || null;
  }
}
