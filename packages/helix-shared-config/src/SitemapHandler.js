/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const fetchAPI = require('@adobe/helix-fetch');
const { NamedMapHandler } = require('./NamedMapHandler.js');

const wrap = (sitemap) => {
  const context = process.env.HELIX_FETCH_FORCE_HTTP1
    ? fetchAPI.context({
      alpnProtocols: [fetchAPI.ALPN_HTTP1_1],
    })
    : fetchAPI.context();
  const { fetch } = context;

  if (typeof sitemap === 'object') {
    return {
      ...sitemap,
      reset: () => {
        context.reset();
      },
      getXML: async function getXML() {
        const res = await fetch(new URL(this.destination, this.origin).href);
        if (!res.ok) {
          throw new Error(`Failed to fetch ${this.destination}`);
        }
        const xml = await res.text();
        return xml;
      },
      getContents: async function getContents() {
        const xml = await this.getXML();
        return (xml.match(/<url>(.*?)<\/url>/gs) || []).reduce((acc, url) => {
          const urlObj = new URL(url.match(/<loc>(.*?)<\/loc>/)[1], this.origin);
          const lastmod = new Date(url.match(/<lastmod>(.*?)<\/lastmod>/)[1]);
          acc.push({
            url: urlObj,
            lastmod,
          });
          return acc;
        }, []);
      },

    };
  }
  return sitemap;
};

const SitemapHandler = (keyname = 'name') => ({
  get: (target, prop) => wrap(NamedMapHandler(keyname).get(target, prop)),
});
exports.SitemapHandler = SitemapHandler;
