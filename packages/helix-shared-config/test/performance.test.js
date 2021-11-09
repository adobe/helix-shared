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
const Performance = require('../src/Performance');

describe('Performance Config', () => {
  it('returns correct thresholds', () => {
    const p = new Performance({
      asset_count: 1,
      connection: 'LTE',
      'consistently-interactive': 1,
      css_body_size_in_bytes: 1,
      css_size_in_bytes: 1,
      device: 'iPhone8',
      'dom-size': 1,
      'estimated-input-latency': 1,
      'first-contentful-paint': 1,
      'first-interactive': 1,
      'first-meaningful-paint': 1,
      firstRender: 1,
      font_body_size_in_bytes: 1,
      font_size_in_bytes: 1,
      html_body_size_in_bytes: 1,
      html_size_in_bytes: 1,
      image_body_size_in_bytes: 1,
      image_size_in_bytes: 1,
      'js-parse-compile': 1,
      js_body_size_in_bytes: 1,
      js_size_in_bytes: 1,
      'lighthouse-accessibility-score': 1,
      'lighthouse-best-practices-score': 1,
      'lighthouse-performance-score': 1,
      'lighthouse-pwa-score': 1,
      'lighthouse-seo-score': 1,
      location: '',
      oncontentload: 1,
      onload: 1,
      page_body_size_in_bytes: 1,
      page_size_in_bytes: 1,
      page_wait_timing: 1,
      speed_index: 1,
      'time-to-first-byte': 1,
      visually_complete: 1,
      visually_complete_85: 1,
    });

    assert.deepStrictEqual(
      p.thresholds,
      {
        asset_count: 1,
        'consistently-interactive': 1,
        css_body_size_in_bytes: 1,
        css_size_in_bytes: 1,
        'dom-size': 1,
        'estimated-input-latency': 1,
        'first-contentful-paint': 1,
        'first-interactive': 1,
        'first-meaningful-paint': 1,
        firstRender: 1,
        font_body_size_in_bytes: 1,
        font_size_in_bytes: 1,
        html_body_size_in_bytes: 1,
        html_size_in_bytes: 1,
        image_body_size_in_bytes: 1,
        image_size_in_bytes: 1,
        'js-parse-compile': 1,
        js_body_size_in_bytes: 1,
        js_size_in_bytes: 1,
        'lighthouse-accessibility-score': 1,
        'lighthouse-best-practices-score': 1,
        'lighthouse-performance-score': 1,
        'lighthouse-pwa-score': 1,
        'lighthouse-seo-score': 1,
        oncontentload: 1,
        onload: 1,
        page_body_size_in_bytes: 1,
        page_size_in_bytes: 1,
        page_wait_timing: 1,
        speed_index: 1,
        'time-to-first-byte': 1,
        visually_complete: 1,
        visually_complete_85: 1,
      },
    );
  });
});
