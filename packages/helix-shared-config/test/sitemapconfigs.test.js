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

const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const SitemapConfig = require('../src/SitemapConfig');

const SPEC_ROOT = path.resolve(__dirname, 'specs/sitemapconfigs');

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
});
