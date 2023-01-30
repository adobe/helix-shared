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
// eslint-disable-next-line import/no-extraneous-dependencies
import { GitUrl } from '@adobe/helix-shared-git';

import { computeSurrogateKey } from '../src/utils.js';

describe('Surrogate Test', () => {
  it('computes a string', async () => {
    assert.strictEqual(await computeSurrogateKey('input'), 'LryzWp9TSqzkYkz6');
  });

  it('computes a empty string', async () => {
    assert.strictEqual(await computeSurrogateKey(''), '-furr1hlvWuvr9Xu');
  });

  it('computes a git url', async () => {
    const url = new GitUrl({
      protocol: 'http',
      hostname: 'git.example.com',
      owner: 'company',
      path: '/docs/main',
      port: '1234',
      ref: 'products/v2',
      repo: 'repository',
    });
    assert.strictEqual(await computeSurrogateKey(url), 'KRBwmXdLOShWtk9P');
  });
});
