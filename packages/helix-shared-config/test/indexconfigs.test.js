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

const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const IndexConfig = require('../src/IndexConfig.js');

const SPEC_ROOT = path.resolve(__dirname, 'specs/queryconfigs');

const tests = [
  {
    title: 'loads a theblog example',
    config: 'query.yaml',
    result: 'query.json',
  },
  {
    title: 'loads a theblog example with QBL',
    config: 'qbl-query.yaml',
    result: 'qbl-query.json',
  },
  {
    title: 'loads an empty query config',
    config: 'empty-query.yaml',
    result: 'empty-query.json',
  },
];

describe('Index Config Loading', () => {
  tests.forEach((test) => {
    it(test.title, async () => {
      try {
        const cfg = new IndexConfig()
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

  it('Does not trip over unset config', async () => {
    const cfg = new IndexConfig();

    await cfg.init();

    const actual = cfg.toJSON();
    const expected = JSON.parse(await fs.readFile(path.resolve(SPEC_ROOT, 'empty-query.json'), 'utf-8'));

    assert.deepEqual(actual, expected);
  });

  it('Does not trip over broken config', async () => {
    const cfg = new IndexConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'broken.yaml'));

    await cfg.init();

    assert.strictEqual(cfg.getQuery('foo', 'bar'), undefined);

    const actual = cfg.toJSON();
    const expected = JSON.parse(await fs.readFile(path.resolve(SPEC_ROOT, 'broken.json'), 'utf-8'));

    assert.deepEqual(actual, expected);
  });

  it('Does not trip over non-existing config', async () => {
    const cfg = new IndexConfig()
      .withDirectory(SPEC_ROOT);
    await cfg.init();

    assert.strictEqual(cfg.getQuery('foo', 'bar'), undefined);
    const actual = cfg.toJSON();
    const expected = JSON.parse(await fs.readFile(path.resolve(SPEC_ROOT, 'empty-query.json'), 'utf-8'));

    assert.deepEqual(actual, expected);
  });

  it('theblog Index Config gets loaded from JSON', async () => {
    const cfg = new IndexConfig()
      .withJSON(fs.readJSONSync(path.resolve(SPEC_ROOT, 'query.json')));
    await cfg.init();
    assert.equal(cfg.indices.length, 1);
    assert.ok(Array.isArray(cfg.indices));
    assert.equal(cfg.indices[0].name, 'blog-posts');
    // eslint-disable-next-line no-template-curly-in-string
    assert.equal(cfg.indices[0].fetch, 'https://${repo}-${owner}.project-helix.page/${path}');
    assert.equal(cfg.indices[0].properties.length, 5);
    assert.equal(cfg.indices[0].queries.length, 2);
    assert.ok(Array.isArray(cfg.indices[0].queries));
    assert.equal(cfg.indices[0].queries[1].cache, 300); // coerced from string to int
    assert.equal(cfg.indices[0].queries[1].hitsPerPage, 25); // injected default value
    assert.ok(Array.isArray(cfg.indices[0].queries[1].parameters));
    assert.ok(Array.isArray(cfg.indices[0].queries[0].parameters));
  });

  it('theblog Index Config gets loaded', async () => {
    const cfg = new IndexConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'query.yaml'));
    await cfg.init();
    assert.equal(cfg.indices.length, 1);
    assert.ok(Array.isArray(cfg.indices));
    assert.equal(cfg.indices[0].name, 'blog-posts');
    assert.deepStrictEqual(cfg.indices[0].include, ['/blog/**']);
    // eslint-disable-next-line no-template-curly-in-string
    assert.equal(cfg.indices[0].fetch, 'https://${repo}-${owner}.project-helix.page/${path}');
    assert.equal(cfg.indices[0].properties.length, 5);
    assert.equal(cfg.indices[0].queries.length, 2);
    assert.ok(Array.isArray(cfg.indices[0].queries));
    assert.equal(cfg.indices[0].queries[1].cache, 300); // coerced from string to int
    assert.equal(cfg.indices[0].queries[1].hitsPerPage, 25); // injected default value
    assert.ok(Array.isArray(cfg.indices[0].queries[1].parameters));
    assert.ok(Array.isArray(cfg.indices[0].queries[0].parameters));
  });

  it('theblog Index Config (QBL) gets loaded', async () => {
    const cfg = new IndexConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'qbl-query.yaml'));
    await cfg.init();
    assert.equal(cfg.indices.length, 1);
    assert.ok(Array.isArray(cfg.indices));
    assert.equal(cfg.indices[0].name, 'blog-posts');
    // eslint-disable-next-line no-template-curly-in-string
    assert.equal(cfg.indices[0].fetch, 'https://${repo}-${owner}.project-helix.page/${path}');
    assert.equal(cfg.indices[0].properties.length, 5);
    assert.equal(cfg.indices[0].queries.length, 1);
    assert.ok(Array.isArray(cfg.indices[0].queries));
    assert.equal(cfg.indices[0].queries[0].cache, 300); // coerced from string to int
    assert.equal(cfg.indices[0].queries[0].hitsPerPage, 25); // injected default value
    assert.ok(Array.isArray(cfg.indices[0].queries[0].parameters));
    assert.deepEqual(cfg.indices[0].queries[0].query, {
      property: {
        _: 'author',
        // eslint-disable-next-line no-template-curly-in-string
        value: '${author}',
      },
    });
  });

  it('theblog Index Config creates query URLs', async () => {
    const cfg = new IndexConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'query.yaml'));
    await cfg.init();

    assert.equal(cfg.getQueryURL('no-index', 'no-query', 'adobe', 'helix-cli', {}), undefined);
    assert.equal(cfg.getQueryURL('blog-posts', 'no-query', 'adobe', 'helix-cli', {}), undefined);
    assert.equal(cfg.getQueryURL('blog-posts', 'all', 'adobe', 'helix-cli', {}), '/1/indexes/adobe--helix-cli--blog-posts?query=*&hitsPerPage=25');
    assert.equal(cfg.getQueryURL('blog-posts', 'by-author', 'adobe', 'helix-cli', { author: 'Stefan' }), '/1/indexes/adobe--helix-cli--blog-posts?query=*&hitsPerPage=25&filters=author%3AStefan');

    assert.equal(cfg.getQueryCache('blog-posts', 'no-query'), 600);
    assert.equal(cfg.getQueryCache('blog-posts', 'all'), 600);
    assert.equal(cfg.getQueryCache('blog-posts', 'by-author'), 300);
  });

  it('add index configuration', async () => {
    const cfg = new IndexConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'query.yaml'));
    await cfg.init();

    const index = {
      name: 'english',
      include: ['/en/publish/*/*/*/*'],
      exclude: ['**/Document.*'],
      target: '/en/query-index.json',
      properties: {
        author: {
          select: 'head > meta[name="author"]',
          value: 'attribute(el, \'content\')',
        },
      },
    };
    cfg.addIndex(index);

    // reparse the modified configuration's YAML output
    const newcfg = new IndexConfig()
      .withSource(cfg.toYAML());
    await newcfg.init();

    const config = newcfg.indices.find((i) => i.name === index.name);
    assert.notStrictEqual(config, null);
    assert.deepStrictEqual(config.include, index.include);
    assert.deepStrictEqual(config.exclude, index.exclude);
    assert.deepStrictEqual(config.target, index.target);

    const property = config.properties.find((p) => p.name === 'author');
    assert.notStrictEqual(property, null);
    assert.deepStrictEqual(property.select, index.properties.author.select);
    assert.deepStrictEqual(property.value, index.properties.author.value);
  });

  it('replace index configuration', async () => {
    const cfg = new IndexConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'query.yaml'));
    await cfg.init();

    const index = {
      name: 'blog-posts',
      include: ['/en/publish/*/*/*/*'],
      exclude: ['**/Document.*'],
      target: '/query-index.json',
      properties: {
        author: {
          select: 'head > meta[name="author"]',
          value: 'attribute(el, \'content\')',
        },
      },
    };
    cfg.replaceIndex(index);

    // reparse the modified configuration's YAML output
    const newcfg = new IndexConfig()
      .withSource(cfg.toYAML());
    await newcfg.init();

    const config = newcfg.indices.find((i) => i.name === index.name);
    assert.notStrictEqual(config, null);
    assert.deepStrictEqual(config.include, index.include);
    assert.deepStrictEqual(config.exclude, index.exclude);
    assert.deepStrictEqual(config.target, index.target);

    const property = config.properties.find((p) => p.name === 'author');
    assert.notStrictEqual(property, null);
    assert.deepStrictEqual(property.select, index.properties.author.select);
    assert.deepStrictEqual(property.value, index.properties.author.value);
  });

  it('add index configuration with existing name', async () => {
    const cfg = new IndexConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'query.yaml'));
    await cfg.init();

    assert.throws(() => cfg.addIndex({
      name: 'blog-posts',
      target: '/query-index.json',
      properties: {},
    }));
  });
});
