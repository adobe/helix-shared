/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const onedriveDecorator = {
  test(m) {
    return /https:\/\/.*\.sharepoint\.com/.test(m.url) || m.url.startsWith('https://1drv.ms/');
  },
  decorate(m) {
    return {
      ...m,
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
      ...m,
      type: 'google',
      id: m.url.split('/').pop(),
    };
  },
};

const decorators = [onedriveDecorator, googleDecorator];

const MountPointHandler = () => ({
  get: (target, prop) => {
    const index = Number.parseInt(prop, 10);
    if (!Number.isNaN(index) && index >= 0) {
      const [path, url] = Object.entries(target)[index];
      const obj = {
        url,
        path,
      };

      const decorator = decorators.find((d) => d.test(obj));

      if (decorator) {
        return decorator.decorate(obj);
      }

      return obj;
    }
    return prop === 'length' ? Object.keys(target).length : target[prop];
  },
});
exports.MountPointHandler = MountPointHandler;
