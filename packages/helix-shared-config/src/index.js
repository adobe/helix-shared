/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const IndexConfig = require('./IndexConfig');
const MountConfig = require('./MountConfig');
const { optionalConfig, requiredConfig } = require('./config-wrapper');
const ValidationError = require('./ValidationError.js');
const IgnoreConfig = require('./IgnoreConfig.js');
const SitemapConfig = require('./SitemapConfig.js');
const { ModifiersConfig } = require('./ModifiersConfig.js');

module.exports = {
  IndexConfig,
  MountConfig,
  IgnoreConfig,
  SitemapConfig,
  optionalConfig,
  requiredConfig,
  ValidationError,
  ModifiersConfig,
};
