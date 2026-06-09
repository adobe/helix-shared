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
import indexSchema from './schemas/index.schema.cjs';
import indexConfigSchema from './schemas/indexconfig.schema.cjs';
import propertySchema from './schemas/property.schema.cjs';
import querySchema from './schemas/query.schema.cjs';
import sitemapLanguageSchema from './schemas/sitemap-language.schema.cjs';
import sitemapSchema from './schemas/sitemap.schema.cjs';
import sitemapConfigSchema from './schemas/sitemapconfig.schema.cjs';

export { IndexConfig } from './IndexConfig.js';
export { MountConfig } from './MountConfig.js';
export { optionalConfig, requiredConfig } from './config-wrapper.js';

export { ValidationError } from './ValidationError.js';
export { IgnoreConfig } from './IgnoreConfig.js';
export { SitemapConfig } from './SitemapConfig.js';
export { ModifiersConfig } from './ModifiersConfig.js';

export const SCHEMAS = [
  indexSchema,
  indexConfigSchema,
  propertySchema,
  querySchema,
  sitemapLanguageSchema,
  sitemapSchema,
  sitemapConfigSchema,
];
