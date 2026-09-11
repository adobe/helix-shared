/*
 * Copyright 2026 Adobe. All rights reserved.
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
import { createHash } from 'crypto';
// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';
import { createDefaultBackendFactory } from '../src/createDefaultBackendFactory.js';
import { SqsBackend } from '../src/SqsBackend.js';

const QUEUE_URL = 'https://sqs.fake.amazonaws.com/123456789012/my-queue';

/**
 * Unlike the `md5: false` test-only `SQSClient` used in `SqsBackend.test.js`, the client built
 * by `createDefaultBackendFactory()` validates the response's `MD5OfMessageBody` against the
 * actual sent body — so a mocked `SendMessageBatch` reply must compute the real checksum.
 */
function replyWithMd5(uri, rawBody) {
  const { Entries } = JSON.parse(rawBody);
  return {
    Successful: Entries.map(({ Id, MessageBody }) => ({
      Id,
      MessageId: 'mid-1',
      MD5OfMessageBody: createHash('md5').update(MessageBody, 'utf8').digest('hex'),
    })),
    Failed: [],
  };
}

/**
 * In-memory fake `Bucket`, sufficient to prove a `put()` call actually landed on the
 * expected bucket instance with the expected key prefix.
 */
class FakeBucket {
  constructor({ bucket }) {
    this.bucket = bucket;
    this.putCalls = [];
  }

  async put(key, body) {
    this.putCalls.push({ key, body });
    return { key };
  }
}

describe('createDefaultBackendFactory()', () => {
  before(() => {
    nock.disableNetConnect();
    process.env.AWS_ACCESS_KEY_ID = 'fake';
    process.env.AWS_SECRET_ACCESS_KEY = 'fake';
  });

  after(() => {
    nock.enableNetConnect();
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('returns a factory producing an SqsBackend for a given queue name', () => {
    const factory = createDefaultBackendFactory({ AWS_REGION: 'us-east-1' }, { log: console });
    const backend = factory('my-queue');
    assert.ok(backend instanceof SqsBackend);
    assert.strictEqual(backend.queueName, 'my-queue');
  });

  it('forwards a factory-level default bucket/swapPrefix to every queue', async () => {
    const bucket = new FakeBucket({ bucket: 'fake-bucket' });
    const factory = createDefaultBackendFactory(
      { AWS_REGION: 'fake' },
      { log: console, bucket, swapPrefix: 'custom' },
    );
    const backend = factory('my-queue');

    nock('https://sqs.fake.amazonaws.com')
      .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
      .post('/')
      .reply(200, { QueueUrl: QUEUE_URL });
    nock('https://sqs.fake.amazonaws.com')
      .matchHeader('x-amz-target', 'AmazonSQS.SendMessageBatch')
      .post('/')
      .reply(200, replyWithMd5);

    await backend.sendBatch([{ body: JSON.stringify({ owner: 'adobe', repo: 'helix-indexer', payload: 'x'.repeat(300 * 1024) }) }]);

    assert.strictEqual(bucket.putCalls.length, 1);
    assert.match(bucket.putCalls[0].key, /^custom\//);
  });

  it('lets a per-queue opts bag override the factory-level bucket/swapPrefix', async () => {
    const defaultBucket = new FakeBucket({ bucket: 'default-bucket' });
    const perQueueBucket = new FakeBucket({ bucket: 'per-queue-bucket' });
    const factory = createDefaultBackendFactory(
      { AWS_REGION: 'fake' },
      { log: console, bucket: defaultBucket },
    );
    const backend = factory('my-queue', { bucket: perQueueBucket, swapPrefix: 'per-queue' });

    nock('https://sqs.fake.amazonaws.com')
      .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
      .post('/')
      .reply(200, { QueueUrl: QUEUE_URL });
    nock('https://sqs.fake.amazonaws.com')
      .matchHeader('x-amz-target', 'AmazonSQS.SendMessageBatch')
      .post('/')
      .reply(200, replyWithMd5);

    await backend.sendBatch([{ body: JSON.stringify({ owner: 'adobe', repo: 'helix-indexer', payload: 'x'.repeat(300 * 1024) }) }]);

    assert.strictEqual(defaultBucket.putCalls.length, 0);
    assert.strictEqual(perQueueBucket.putCalls.length, 1);
    assert.match(perQueueBucket.putCalls[0].key, /^per-queue\//);
  });

  it('parses HELIX_QUEUE_MAX_ATTEMPTS and defaults to undefined when absent/invalid', () => {
    const withAttempts = createDefaultBackendFactory({ HELIX_QUEUE_MAX_ATTEMPTS: '5' }, { log: console });
    assert.ok(withAttempts('q') instanceof SqsBackend);

    const withoutAttempts = createDefaultBackendFactory({}, { log: console });
    assert.ok(withoutAttempts('q') instanceof SqsBackend);
  });

  it('parses HELIX_HTTP_SQS_KEEP_ALIVE as a boolean', () => {
    const factory = createDefaultBackendFactory({ HELIX_HTTP_SQS_KEEP_ALIVE: 'true' }, { log: console });
    assert.ok(factory('q') instanceof SqsBackend);
  });
});
