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
const { MountConfig } = require('../src/index.js');

const SPEC_ROOT = path.resolve(__dirname, 'specs/mountconfigs');

const tests = [
  {
    title: 'loads a theblog example',
    config: 'fstab.yaml',
    result: 'fstab.json',
  },
];

describe('Mount Point Config Loading', () => {
  tests.forEach((test) => {
    it(test.title, async () => {
      try {
        const cfg = await new MountConfig()
          .withConfigPath(path.resolve(SPEC_ROOT, test.config))
          .init();
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

  it('theblog Mount Points get loaded', async () => {
    const cfg = await new MountConfig()
      .withConfigPath(path.resolve(SPEC_ROOT, 'fstab.json'))
      .init();
    assert.equal(cfg.mountpoints.length, 1);
    assert.equal(cfg.mountpoints[0].path, '/');
    assert.equal(cfg.mountpoints[0].url, 'https://adobe.sharepoint.com/sites/TheBlog/Shared%20Documents/theblog?csf=1&e=8Znxth');
  });
});
