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

const sitemapConfigSchema = require('./schemas/sitemapconfig.schema.json');
const sitemapSchema = require('./schemas/sitemap.schema.json');
const languageSchema = require('./schemas/sitemap-language.schema.json');

class SitemapConfig extends SchemaDerivedConfig {
  constructor() {
    super({
      filename: 'helix-sitemap.yaml',
      schemas: {
        '^/$': sitemapConfigSchema,
        '^/sitemaps/.*$': sitemapSchema,
        '^/sitemaps/.*/languages/.*$': languageSchema,
      },
      handlers: {
        '^/sitemaps$': NamedMapHandler(),
        '^/sitemaps/.*/languages$': NamedMapHandler(),
      },
    });
  }

  /**
   * Initialize the configuration
   */
  async init() {
    await super.init();

    this._version = this._cfg.version;
    return this;
  }

  /**
   * Adds a sitemap definition.
   *
   * @param {Object} sitemap sitemap configuration
   * @param {string} sitemap.name sitemap name
   * @param {string} sitemap.origin sitemap origin
   * @param {string} sitemap.source sitemap source
   * @param {string} sitemap.destination sitemap destination
   * @param {string} sitemap.lastmod lastmod format
   */
  addSitemap({
    name, origin, source, destination, lastmod,
  }) {
    const { sitemaps } = this._cfg;
    if (sitemaps[name]) {
      throw new Error(`Unable to add sitemap definition with existing name: ${name}`);
    }
    sitemaps[name] = {
      origin,
      source,
      destination,
      lastmod,
    };

    // let BaseConfig.toYAML() use the JSON output
    this._document = null;
  }

  addLanguage(sitemapName, {
    name, source, destination, hreflang, alternate,
  }) {
    const { sitemaps } = this._cfg;

    const sitemap = sitemaps[sitemapName];
    if (!sitemap) {
      throw new Error(`Unable to add language, sitemap not found: ${sitemapName}`);
    }
    const { languages } = sitemap;
    if (languages[name]) {
      throw new Error(`Unable to add language definition with existing name: ${name}`);
    }
    languages[name] = {
      source,
      destination,
      hreflang,
      alternate,
    };

    // let BaseConfig.toYAML() use the JSON output
    this._document = null;
  }
}

module.exports = SitemapConfig;
