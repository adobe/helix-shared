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

/* eslint-env mocha */
/* eslint-disable max-len */

import assert from 'assert';
import fs from 'fs-extra';
import path from 'path';
import { SitemapConfig } from '../src/SitemapConfig.js';
import { setupPolly } from './utils.js';

const SPEC_ROOT = path.resolve(__testdir, 'specs/sitemapconfigs');

const tests = [
  {
    title: 'loads a simple example',
    config: 'simple.yaml',
    result: 'simple.json',
  },
  {
    title: 'loads an example with multiple languages',
    config: 'multilang.yaml',
    result: 'multilang.json',
  },
  {
    title: 'loads a broken example',
    config: 'broken.yaml',
    error: `Error: Invalid configuration:
Sitemap Language must have required property 'destination'
Sitemap Language must have required property 'hreflang'

data/sitemaps/broken/languages/en must have required property 'destination', data/sitemaps/broken/languages/en must have required property 'hreflang'`,
  },
];

describe('Sitemap Config Loading', () => {
  tests.forEach((test) => {
    it(test.title, async () => {
      try {
        const cfg = new SitemapConfig()
          .withConfigPath(path.resolve(SPEC_ROOT, test.config));
        await cfg.init();
        if (test.result) {
          const expected = JSON.parse(await fs.readFile(path.resolve(SPEC_ROOT, test.result), 'utf-8'));
          const actual = cfg.toJSON();
          assert.deepEqual(actual, expected);
        } else {
          assert.fail(`${test.title} should be invalid.`);
        }
      } catch (e) {
        if (test.error) {
          assert.equal(e.toString(), test.error);
        } else {
          throw e;
        }
      }
    });
  });

  setupPolly({
    recordIfMissing: false,
  });

  it('get sitemaps in config', async function testSitemaps() {
    const { server } = this.polly;

    server
      .get('https://www.example.com/sitemap-en.xml')
      .intercept((req, res) => {
        res.status(200).send(fs.readFileSync(path.resolve(SPEC_ROOT, 'blog-sitemap.xml'), 'utf-8'));
      });

    const cfg = new SitemapConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'simple.yaml'));
    await cfg.init();
    const { sitemaps } = cfg;
    assert.equal(sitemaps.length, 1);
    assert.equal(sitemaps[0].name, 'simple');
    const contents = await sitemaps[0].getContents();
    assert.ok(contents);
    assert.deepEqual(contents[0], {
      url: new URL('https://blog.adobe.com/en/publish/2005/10/16/online-media-4-easy-steps-to-page-value'),
      lastmod: new Date('2021-11-04'),
    });
    cfg.reset();
  });

  it('get sitemaps in config (404)', async function testSitemaps() {
    const { server } = this.polly;

    server
      .get('https://www.example.com/sitemap-en.xml')
      .intercept((req, res) => {
        res.status(404).send('Not Found');
      });

    const cfg = new SitemapConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'simple.yaml'));
    await cfg.init();
    const { sitemaps } = cfg;
    await assert.rejects(async () => sitemaps[0].getContents());
    cfg.reset();
  });

  it('get sitemaps in config (no content)', async function testSitemaps() {
    const { server } = this.polly;

    server
      .get('https://www.example.com/sitemap-en.xml')
      .intercept((req, res) => {
        res.status(200).send('<urlset />');
      });

    const cfg = new SitemapConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'simple.yaml'));
    await cfg.init();
    const { sitemaps } = cfg;
    assert.equal((await sitemaps[0].getContents()).length, 0);
    cfg.reset();
  });

  it('add sitemap configuration', async () => {
    const cfg = new SitemapConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'simple.yaml'));
    await cfg.init();

    const sitemap = {
      name: 'other',
      origin: 'https://www.example.com',
      source: '/query-index2.json',
      destination: '/sitemap-other.xml',
    };
    cfg.addSitemap(sitemap);

    // reparse the modified configuration's YAML output
    const newcfg = new SitemapConfig()
      .withSource(cfg.toYAML());
    await newcfg.init();

    const config = newcfg.sitemaps.find((s) => s.name === sitemap.name);
    assert.notStrictEqual(config, null);
    assert.deepStrictEqual(config.origin, sitemap.origin);
    assert.deepStrictEqual(config.source, sitemap.source);
    assert.deepStrictEqual(config.destination, sitemap.destination);
  });

  it('add sitemap configuration with existing name', async () => {
    const cfg = new SitemapConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'simple.yaml'));
    await cfg.init();

    assert.throws(() => cfg.addSitemap({
      name: 'simple',
      source: '/query-index2.json',
      destination: '/sitemap2.xml',
    }));
  });

  it('add sitemap language', async () => {
    const cfg = new SitemapConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'multilang.yaml'));
    await cfg.init();

    const language = {
      name: 'de',
      source: '/de/query-index.json',
      destination: '/sitemap-de.xml',
      hreflang: 'de',
      alternate: '/de/{path}',
    };
    cfg.addLanguage('multilang', language);

    // reparse the modified configuration's YAML output
    const newcfg = new SitemapConfig()
      .withSource(cfg.toYAML());
    await newcfg.init();

    const config = newcfg.sitemaps[0].languages.find((l) => l.name === language.name);
    assert.notStrictEqual(config, null);
    assert.deepStrictEqual(config.source, language.source);
    assert.deepStrictEqual(config.destination, language.destination);
    assert.deepStrictEqual(config.hreflang, language.hreflang);
    assert.deepStrictEqual(config.alternate, language.alternate);
  });

  it('add sitemap language to new sitemap', async () => {
    const cfg = new SitemapConfig()
      .withSource(`
  version: 1
`);
    await cfg.init();

    cfg.addSitemap({ name: 'multilang' });
    const language = {
      name: 'de',
      source: '/de/query-index.json',
      destination: '/sitemap-de.xml',
      hreflang: 'de',
      alternate: '/de/{path}',
    };
    cfg.addLanguage('multilang', language);

    // reparse the modified configuration's YAML output
    const newcfg = new SitemapConfig()
      .withSource(cfg.toYAML());
    await newcfg.init();

    const config = newcfg.sitemaps[0].languages.find((l) => l.name === language.name);
    assert.notStrictEqual(config, null);
    assert.deepStrictEqual(config.source, language.source);
    assert.deepStrictEqual(config.destination, language.destination);
    assert.deepStrictEqual(config.hreflang, language.hreflang);
    assert.deepStrictEqual(config.alternate, language.alternate);
  });

  it('add sitemap language to inexistant sitemap', async () => {
    const cfg = new SitemapConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'multilang.yaml'));
    await cfg.init();

    assert.throws(() => cfg.addLanguage('other', {
      name: 'de',
      source: '/de/query-index.json',
      destination: '/sitemap-de.xml',
    }));
  });

  it('add sitemap language with existing name', async () => {
    const cfg = new SitemapConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'multilang.yaml'));
    await cfg.init();

    assert.throws(() => cfg.addLanguage('multilang', {
      name: 'fr',
      source: '/fr/query-index.json',
      destination: '/sitemap-fr.xml',
    }));
  });
});
