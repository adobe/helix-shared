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
const { GitUrl } = require('@adobe/helix-shared-git');
const utils = require('@adobe/helix-shared-utils');
const prune = require('@adobe/helix-shared-prune');
const wrap = require('@adobe/helix-shared-wrap');
const Async = require('@adobe/helix-shared-async');
const string = require('@adobe/helix-shared-string');
const dom = require('@adobe/helix-shared-dom');
const processQueue = require('@adobe/helix-shared-process-queue');
const bodyData = require('@adobe/helix-shared-body-data');
const {
  HelixConfig,
  IndexConfig,
  MountConfig,
  RedirectConfig,
  Strain,
  MarkupConfig,
  Condition,
  optionalConfig,
  requiredConfig,
} = require('@adobe/helix-shared-config');

module.exports = {
  GitUrl,
  HelixConfig,
  IndexConfig,
  MountConfig,
  RedirectConfig,
  Strain,
  string,
  dom,
  utils: {
    ...utils,
    pruneEmptyValues: prune,
  },
  MarkupConfig,
  async: Async,
  Condition,
  wrap,
  optionalConfig,
  requiredConfig,
  processQueue,
  bodyData,
  prune,
};
