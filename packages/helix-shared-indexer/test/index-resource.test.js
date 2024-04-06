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

/* eslint-env mocha */

import assert from 'assert';
import { Headers } from '@adobe/fetch';
import { IndexConfig } from '@adobe/helix-shared-config';

import { indexResource } from '../src/index-resource.js';

const INDEX = `
version: 1

indices:
  default:
    properties:
      author:
        select: main > div:nth-of-type(3) > p:nth-of-type(1)
        value: |
          match(el, 'by (.*)')
      title:
        select: h1:first-of-type
        value: |
          textContent(el)
      date:
        select: main > div:nth-of-type(3)
        value: |
          dateValue(el, '[POSTED ON] MM-DD-YYYY')
      topics:
        select: main > div:last-of-type > p:nth-of-type(1)
        values: |
          match(el, '(Topics: )? ([^,]+)')
      sourceHash:
        select: head > meta[name="x-source-hash"]
        value: |
          attribute(el, 'content')
      first-segment:
        select: none
        value: |
          match(path, '^/([^/]+)/')
      replace-path:
        select: none
        value: |
          replace(path, 'ab', 'z')
      replaceAll-path:
        select: none
        value: |
          replaceAll(path, 'ab', 'z')
      paragraph:
        select: main > div:nth-of-type(5)
        value: |
          innerHTML(el)
      teaser:
        select: main > div:nth-child(n+4) p
        value: |
          words(textContent(el), 0, 20)
      last-modified:
        select: none
        value: |
          parseTimestamp(headers['last-modified'], 'ddd, DD MMM YYYY hh:mm:ss GMT')
      last-modified-raw:
        select: none
        value: |
          headers['last-modified']
      non-array-words:
        select: none
        value: |
          words(headers['last-modified'])
      match-simple:
        select: meta[name="x-source-hash"]
        value: |
          match(attribute(el, 'content'), '(...) .*')
      missing-header:
        select: none
        value: |
          parseTimestamp(headers['date'], 'ddd, DD MMM YYYY hh:mm:ss GMT')
      condition-unsupported:
        select: meta[name="x-source-hash"]
        value: |
          attribute(el, 'content') ? attribute(el, 'content') : 'missing'
      call-unknown-function:
        select: meta[name="x-source-hash"]
        value: |
          unknown(el, 'content')
      member-unknown-var:
        select: none
        value: |
          myobj['prop']
      member-without-get:
        select: main h1
        value: |
          el.innerText
      bad-selector:
        select: div:foobar([class="embed"])
        value: |
          textContent(el)
      first-alternate:
        select: main > div:last-of-type > p:nth-of-type(2)
        value: |
          match(innerHTML(el), '(.*?)<br><br>.*|(.*)')
      second-alternate:
        select: main > div:last-of-type > p:nth-of-type(3)
        value: |
          match(innerHTML(el), '(.*?)<br><br>.*|(.*)')
      all-matches:
        select: a
        values: |
          match(attribute(el, 'href'), 'https://[^/]+/assets/.*')
  `;

const BODY = `
<!DOCTYPE html><html>
<head>
  <title>Title</title>
  <meta name="x-source-hash" content="JJYxCM1NDG4ahJm9f">
</head>
<body>
<header>
  <div>
    <p>Header</p>
  </div>
  <div>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>
</header>
<main>
  <div class="default">
    <h1>I feel good</h1>
  </div>
  <div class="image">
    <img src="Image">
  </div>
  <div class="default">
    <p>by Max</p>
    <p>POSTED ON 04-27-2021</p>
  </div>
  <div class="default">
    <p>Lorem ipsum dolor sit amet, </p>
  </div>
  <div class="default">
    <p>consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</p>
  </div>
  <div class="default">
    <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
  </div>
  <div class="default">
    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
  </div>
  <div class="default">
    <p>Topics: A, B, C,</p>
    <p>before<br><br>after</p>
    <p>before<br>after</p>
  </div>
  <a href="https://my.domain.com/assets/asset-link">an asset</a>
  <a href="https://my.domain.com">some link</a>
  <a href="https://my.domain.com/assets/asset-link2">another asset</a>
</main>
<footer></footer>
</body>
</html>`;

describe('Index Resource Tests', () => {
  it('indexing a resource', async () => {
    const config = await new IndexConfig().withSource(INDEX).init();
    const headers = new Headers({ 'last-modified': 'Mon, 22 Feb 2021 15:28:00 GMT' });
    const record = indexResource('/abc/de/ab/fg/abcd', { body: BODY, headers }, config.indices[0], console);
    assert.deepEqual(record, {
      'all-matches': [
        'https://my.domain.com/assets/asset-link',
        'https://my.domain.com/assets/asset-link2',
      ],
      author: 'Max',
      'bad-selector': '',
      'call-unknown-function': '',
      'condition-unsupported': '',
      date: 44313,
      'first-alternate': 'before',
      'second-alternate': 'before<br>after',
      'last-modified': 1614007680,
      'last-modified-raw': 'Mon, 22 Feb 2021 15:28:00 GMT',
      'match-simple': '',
      'member-unknown-var': '',
      'member-without-get': '',
      'missing-header': '',
      'non-array-words': 'Mon, 22 Feb 2021 15:28:00 GMT',
      paragraph: '\n    <p>consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</p>\n  ',
      'first-segment': 'abc',
      'replace-path': '/zc/de/ab/fg/abcd',
      'replaceAll-path': '/zc/de/z/fg/zcd',
      sourceHash: 'JJYxCM1NDG4ahJm9f',
      teaser: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut',
      title: 'I feel good',
      topics: [
        'A',
        'B',
        'C',
      ],
    });
  });
});
