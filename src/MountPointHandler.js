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

const MountPointHandler = (decorators) => ({

  get: (target, prop) => {
    const index = Number.parseInt(prop, 10);
    if (!Number.isNaN(index) && index >= 0) {
      const [path, config] = Object.entries(target)[index];

      const obj = typeof config === 'string' ? {
        url: config,
        path: path.endsWith('/') ? path : `${path}/`,
      } : {
        ...config,
        path: path.endsWith('/') ? path : `${path}/`,
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
