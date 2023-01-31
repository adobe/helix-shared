/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import NodeHttpAdapter from '@pollyjs/adapter-node-http';
// eslint-disable-next-line import/no-extraneous-dependencies
import FSPersister from '@pollyjs/persister-fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import { setupMocha } from '@pollyjs/core';

export function setupPolly(opts) {
  setupMocha({
    logging: false,
    recordFailedRequests: true,
    recordIfMissing: false,
    matchRequestsBy: {
      headers: {
        exclude: ['authorization', 'accept-encoding', 'user-agent', 'accept', 'connection', 'x-request-id'],
      },
    },
    adapters: [NodeHttpAdapter],
    persister: FSPersister,
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve(__testdir, 'fixtures'),
      },
    },
    ...opts,
  });
}
