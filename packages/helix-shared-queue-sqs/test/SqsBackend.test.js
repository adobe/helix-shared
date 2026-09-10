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
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon from 'sinon';
// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';
import { SQSClient } from '@aws-sdk/client-sqs';
import { QueueError } from '@adobe/helix-shared-queue';
import { SqsBackend } from '../src/SqsBackend.js';

const AWS_REGION = 'fake';
const AWS_ACCESS_KEY_ID = 'fake';
const AWS_SECRET_ACCESS_KEY = 'fake';

const QUEUE_URL = 'https://sqs.fake.amazonaws.com/123456789012/my-queue';

function buildTestBackend(opts = {}) {
  const client = new SQSClient({
    region: AWS_REGION,
    credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
    maxAttempts: 1,
    // the mocked responses below don't compute real MD5 body checksums; only relevant to tests
    md5: false,
  });
  return new SqsBackend({
    client, queueName: 'my-queue', log: console, ...opts,
  });
}

/**
 * In-memory fake `Bucket`, sufficient to exercise spillover without any real storage backend.
 */
class FakeBucket {
  constructor({ bucket = 'fake-spill-bucket' } = {}) {
    this.bucket = bucket;
    this.objects = new Map();
    this.removeCalls = [];
  }

  async put(key, body) {
    this.objects.set(key, body);
    return { key };
  }

  async get(key) {
    if (!this.objects.has(key)) {
      return null;
    }
    return Buffer.from(this.objects.get(key));
  }

  async remove(key) {
    this.removeCalls.push(key);
    this.objects.delete(key);
    return { key };
  }
}

describe('SqsBackend', () => {
  before(() => {
    nock.disableNetConnect();
  });

  after(() => {
    nock.enableNetConnect();
  });

  afterEach(() => {
    assert.deepStrictEqual(nock.pendingMocks(), []);
    nock.cleanAll();
  });

  it('exposes name/queueName/client', () => {
    const backend = buildTestBackend();
    assert.strictEqual(backend.name, 'SQS');
    assert.strictEqual(backend.queueName, 'my-queue');
    assert.ok(backend.client instanceof SQSClient);
  });

  describe('_resolveQueueUrl()', () => {
    it('resolves and caches the queue URL across multiple operations', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.SendMessageBatch')
        .post('/')
        .times(2)
        .reply(200, { Successful: [{ Id: 'msg0', MessageId: 'mid-1' }], Failed: [] });

      await backend.sendBatch([{ body: 'one' }]);
      await backend.sendBatch([{ body: 'two' }]);
    });

    it('does not poison the cache on failure: a later call retries', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(500, { message: 'boom' });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.SendMessageBatch')
        .post('/')
        .reply(200, { Successful: [{ Id: 'msg0', MessageId: 'mid-1' }], Failed: [] });

      await assert.rejects(backend.sendBatch([{ body: 'one' }]), QueueError);
      const result = await backend.sendBatch([{ body: 'one' }]);
      assert.deepStrictEqual(result.messageIds, ['mid-1']);
    });
  });

  describe('sendBatch()', () => {
    it('sends a single small batch and maps groupId/dedupId onto SQS FIFO fields', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.SendMessageBatch')
        .post('/', (body) => {
          assert.strictEqual(body.QueueUrl, QUEUE_URL);
          assert.deepStrictEqual(body.Entries, [{
            Id: 'msg0',
            MessageBody: 'hello',
            MessageGroupId: 'g1',
            MessageDeduplicationId: 'd1',
          }]);
          return true;
        })
        .reply(200, { Successful: [{ Id: 'msg0', MessageId: 'mid-1' }], Failed: [] });

      const result = await backend.sendBatch([{ body: 'hello', groupId: 'g1', dedupId: 'd1' }]);
      assert.deepStrictEqual(result.messageIds, ['mid-1']);
    });

    it('splits more than 10 messages into multiple SendMessageBatchCommand calls', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });

      const calls = [];
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.SendMessageBatch')
        .post('/')
        .times(2)
        .reply(200, (uri, rawBody) => {
          const body = JSON.parse(rawBody);
          calls.push(body.Entries.length);
          return {
            Successful: body.Entries.map(({ Id }) => ({ Id, MessageId: `mid-${Id}` })),
            Failed: [],
          };
        });

      const messages = Array.from({ length: 12 }, (_, i) => ({ body: `msg-${i}` }));
      const result = await backend.sendBatch(messages);
      assert.deepStrictEqual(calls, [10, 2]);
      assert.strictEqual(result.messageIds.length, 12);
    });

    it('flushes a non-empty batch early when the next message would not fit', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });

      const calls = [];
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.SendMessageBatch')
        .post('/')
        .times(2)
        .reply(200, (uri, rawBody) => {
          const body = JSON.parse(rawBody);
          calls.push(body.Entries.length);
          return {
            Successful: body.Entries.map(({ Id }) => ({ Id, MessageId: `mid-${Id}` })),
            Failed: [],
          };
        });

      const big = 'x'.repeat(150_000);
      const messages = [{ body: big }, { body: big }];
      const result = await backend.sendBatch(messages);
      assert.deepStrictEqual(calls, [1, 1]);
      assert.strictEqual(result.messageIds.length, 2);
    });

    it('spills a single message too large to fit any batch to the configured bucket', async () => {
      const bucket = new FakeBucket();
      const backend = buildTestBackend({ bucket });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.SendMessageBatch')
        .post('/', (body) => {
          const pointer = JSON.parse(body.Entries[0].MessageBody);
          assert.strictEqual(pointer.swapBucket, 'fake-spill-bucket');
          assert.ok(bucket.objects.has(pointer.swapKey));
          return true;
        })
        .reply(200, { Successful: [{ Id: 'msg0', MessageId: 'mid-1' }], Failed: [] });

      const big = 'x'.repeat(300_000);
      const result = await backend.sendBatch([{ body: big }]);
      assert.deepStrictEqual(result.messageIds, ['mid-1']);
    });

    it('throws when a message is too large and no spill bucket is configured', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });

      const big = 'x'.repeat(300_000);
      await assert.rejects(backend.sendBatch([{ body: big }]), (e) => {
        assert.ok(e instanceof QueueError);
        assert.strictEqual(e.status, 413);
        return true;
      });
    });

    it('legacySwapFormat: spills using the BatchedQueueClient-compatible pointer shape', async () => {
      const bucket = new FakeBucket();
      const backend = buildTestBackend({ bucket, legacySwapFormat: true });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.SendMessageBatch')
        .post('/', (body) => {
          const pointer = JSON.parse(body.Entries[0].MessageBody);
          assert.strictEqual(pointer.owner, 'adobe');
          assert.strictEqual(pointer.repo, 'helix-indexer');
          assert.strictEqual(pointer.key, 'adobe/helix-indexer');
          assert.match(pointer.swapS3Url, /^s3:\/\/fake-spill-bucket\/default\/sqs-swap\/adobe\/helix-indexer-\d+-\w+\.json$/);
          return true;
        })
        .reply(200, { Successful: [{ Id: 'msg0', MessageId: 'mid-1' }], Failed: [] });

      const big = JSON.stringify({ owner: 'adobe', repo: 'helix-indexer', data: 'x'.repeat(300_000) });
      const result = await backend.sendBatch([{ body: big }]);
      assert.deepStrictEqual(result.messageIds, ['mid-1']);
    });

    it('legacySwapFormat: uses an explicit "key" field over owner/repo when present', async () => {
      const bucket = new FakeBucket();
      const backend = buildTestBackend({ bucket, legacySwapFormat: true });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.SendMessageBatch')
        .post('/', (body) => {
          const pointer = JSON.parse(body.Entries[0].MessageBody);
          assert.strictEqual(pointer.key, 'custom-key');
          return true;
        })
        .reply(200, { Successful: [{ Id: 'msg0', MessageId: 'mid-1' }], Failed: [] });

      const big = JSON.stringify({
        owner: 'adobe', repo: 'helix-indexer', key: 'custom-key', data: 'x'.repeat(300_000),
      });
      await backend.sendBatch([{ body: big }]);
    });

    it('legacySwapFormat: throws when the oversized message body is not JSON', async () => {
      const bucket = new FakeBucket();
      const backend = buildTestBackend({ bucket, legacySwapFormat: true });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });

      const big = 'x'.repeat(300_000);
      await assert.rejects(backend.sendBatch([{ body: big }]), (e) => {
        assert.ok(e instanceof QueueError);
        assert.strictEqual(e.status, 400);
        return true;
      });
    });

    it('legacySwapFormat: throws when the body has neither owner/repo nor an explicit key', async () => {
      const bucket = new FakeBucket();
      const backend = buildTestBackend({ bucket, legacySwapFormat: true });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });

      const big = JSON.stringify({ data: 'x'.repeat(300_000) });
      await assert.rejects(backend.sendBatch([{ body: big }]), (e) => {
        assert.ok(e instanceof QueueError);
        assert.strictEqual(e.status, 400);
        return true;
      });
    });

    it('logs (but does not throw for) per-entry Failed results, returning fewer ids', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.SendMessageBatch')
        .post('/')
        .reply(200, {
          Successful: [{ Id: 'msg0', MessageId: 'mid-1' }],
          Failed: [{ Id: 'msg1', Code: 'InvalidParameterValue', Message: 'bad message' }],
        });

      const result = await backend.sendBatch([{ body: 'ok' }, { body: 'bad' }]);
      assert.deepStrictEqual(result.messageIds, ['mid-1']);
    });

    it('throws a QueueError when the SendMessageBatchCommand call itself fails', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.SendMessageBatch')
        .post('/')
        .reply(500, { message: 'internal error' });

      await assert.rejects(backend.sendBatch([{ body: 'hello' }]), QueueError);
    });
  });

  describe('receiveBatch()', () => {
    it('maps a received message, including groupId/receiveCount when present', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
        .post('/')
        .reply(200, {
          Messages: [{
            MessageId: 'mid-1',
            ReceiptHandle: 'rh-1',
            Body: 'hello',
            Attributes: { MessageGroupId: 'g1', ApproximateReceiveCount: '2' },
          }],
        });

      const result = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      assert.strictEqual(result.messages.length, 1);
      const [msg] = result.messages;
      assert.strictEqual(msg.id, 'mid-1');
      assert.strictEqual(msg.body, 'hello');
      assert.strictEqual(msg.groupId, 'g1');
      assert.strictEqual(msg.receiveCount, 2);
      assert.strictEqual(msg.raw.ReceiptHandle, 'rh-1');
    });

    it('leaves groupId/receiveCount undefined when the backend reports none', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
        .post('/')
        .reply(200, { Messages: [{ MessageId: 'mid-1', ReceiptHandle: 'rh-1', Body: 'hello' }] });

      const result = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      const [msg] = result.messages;
      assert.strictEqual(msg.groupId, undefined);
      assert.strictEqual(msg.receiveCount, undefined);
    });

    it('passes a plain JSON body through unchanged when it is not a swap pointer', async () => {
      const bucket = new FakeBucket();
      const backend = buildTestBackend({ bucket });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
        .post('/')
        .reply(200, {
          Messages: [{ MessageId: 'mid-1', ReceiptHandle: 'rh-1', Body: '{"hello":"world"}' }],
        });

      const result = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      assert.strictEqual(result.messages[0].body, '{"hello":"world"}');
      assert.strictEqual(result.messages[0].raw.swapKey, undefined);
    });

    it('legacySwapFormat: passes a plain JSON body through unchanged when it is not a swap pointer', async () => {
      const bucket = new FakeBucket();
      const backend = buildTestBackend({ bucket, legacySwapFormat: true });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
        .post('/')
        .reply(200, {
          Messages: [{
            MessageId: 'mid-1',
            ReceiptHandle: 'rh-1',
            Body: JSON.stringify({ owner: 'adobe', repo: 'helix-indexer', data: 'small' }),
          }],
        });

      const result = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      assert.deepStrictEqual(JSON.parse(result.messages[0].body), {
        owner: 'adobe', repo: 'helix-indexer', data: 'small',
      });
      assert.strictEqual(result.messages[0].raw.swapKey, undefined);
    });

    it('transparently dereferences a generic-format swap pointer', async () => {
      const bucket = new FakeBucket();
      await bucket.put('default/sqs-swap/my-queue-123.json', 'the real, original body');
      const backend = buildTestBackend({ bucket });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
        .post('/')
        .reply(200, {
          Messages: [{
            MessageId: 'mid-1',
            ReceiptHandle: 'rh-1',
            Body: JSON.stringify({
              swapBucket: 'fake-spill-bucket', swapKey: 'default/sqs-swap/my-queue-123.json',
            }),
          }],
        });

      const result = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      const [msg] = result.messages;
      assert.strictEqual(msg.body, 'the real, original body');
      assert.strictEqual(msg.raw.swapKey, 'default/sqs-swap/my-queue-123.json');
    });

    it('throws when a generic-format pointer references a different bucket than configured', async () => {
      const bucket = new FakeBucket();
      const backend = buildTestBackend({ bucket });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
        .post('/')
        .reply(200, {
          Messages: [{
            MessageId: 'mid-1',
            ReceiptHandle: 'rh-1',
            Body: JSON.stringify({ swapBucket: 'some-other-bucket', swapKey: 'k.json' }),
          }],
        });

      await assert.rejects(
        backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 }),
        (e) => {
          assert.ok(e instanceof QueueError);
          assert.strictEqual(e.status, 500);
          return true;
        },
      );
    });

    it('transparently dereferences a legacySwapFormat (BatchedQueueClient-compatible) pointer', async () => {
      const bucket = new FakeBucket();
      await bucket.put('default/sqs-swap/adobe/helix-indexer-123.json', JSON.stringify({
        owner: 'adobe', repo: 'helix-indexer', data: 'the real payload',
      }));
      const backend = buildTestBackend({ bucket, legacySwapFormat: true });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
        .post('/')
        .reply(200, {
          Messages: [{
            MessageId: 'mid-1',
            ReceiptHandle: 'rh-1',
            Body: JSON.stringify({
              owner: 'adobe',
              repo: 'helix-indexer',
              key: 'adobe/helix-indexer',
              swapS3Url: 's3://fake-spill-bucket/default/sqs-swap/adobe/helix-indexer-123.json',
            }),
          }],
        });

      const result = await backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 });
      const [msg] = result.messages;
      assert.deepStrictEqual(JSON.parse(msg.body), {
        owner: 'adobe', repo: 'helix-indexer', data: 'the real payload',
      });
      assert.strictEqual(msg.raw.swapKey, 'default/sqs-swap/adobe/helix-indexer-123.json');
    });

    it('throws when a legacySwapFormat pointer references a different bucket than configured', async () => {
      const bucket = new FakeBucket();
      const backend = buildTestBackend({ bucket, legacySwapFormat: true });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
        .post('/')
        .reply(200, {
          Messages: [{
            MessageId: 'mid-1',
            ReceiptHandle: 'rh-1',
            Body: JSON.stringify({
              owner: 'adobe', repo: 'helix-indexer', key: 'adobe/helix-indexer', swapS3Url: 's3://some-other-bucket/k.json',
            }),
          }],
        });

      await assert.rejects(
        backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 }),
        (e) => {
          assert.ok(e instanceof QueueError);
          assert.strictEqual(e.status, 500);
          return true;
        },
      );
    });

    it('throws when a message was swapped out but no spill bucket is configured', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
        .post('/')
        .reply(200, {
          Messages: [{
            MessageId: 'mid-1',
            ReceiptHandle: 'rh-1',
            // omits `swapBucket` so this doesn't first trip the bucket-mismatch check —
            // exercises the "no bucket configured at all" branch specifically
            Body: JSON.stringify({ swapKey: 'k.json' }),
          }],
        });

      await assert.rejects(
        backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 }),
        (e) => {
          assert.ok(e instanceof QueueError);
          assert.strictEqual(e.status, 500);
          return true;
        },
      );
    });

    it('throws when the swapped message body cannot be found in the bucket', async () => {
      const bucket = new FakeBucket();
      const backend = buildTestBackend({ bucket });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
        .post('/')
        .reply(200, {
          Messages: [{
            MessageId: 'mid-1',
            ReceiptHandle: 'rh-1',
            Body: JSON.stringify({ swapBucket: 'fake-spill-bucket', swapKey: 'missing.json' }),
          }],
        });

      await assert.rejects(
        backend.receiveBatch({ minTime: 1, maxTime: 1, maxMessages: 1 }),
        (e) => {
          assert.ok(e instanceof QueueError);
          assert.strictEqual(e.status, 404);
          return true;
        },
      );
    });

    it('stops once maxMessages is reached, without waiting out minTime', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
        .post('/')
        .reply(200, {
          Messages: Array.from({ length: 5 }, (_, i) => ({
            MessageId: `mid-${i}`, ReceiptHandle: `rh-${i}`, Body: `body-${i}`,
          })),
        });

      const result = await backend.receiveBatch({ minTime: 100, maxTime: 100, maxMessages: 5 });
      assert.strictEqual(result.messages.length, 5);
    });

    it('keeps polling until minTime elapses when nothing arrives, one call per wait window', async () => {
      const clock = sinon.useFakeTimers({ toFake: ['Date'], now: 0 });
      try {
        const backend = buildTestBackend();
        nock('https://sqs.fake.amazonaws.com')
          .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
          .post('/')
          .reply(200, { QueueUrl: QUEUE_URL });

        let calls = 0;
        nock('https://sqs.fake.amazonaws.com')
          .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
          .post('/', (body) => {
            calls += 1;
            clock.tick(body.WaitTimeSeconds * 1000);
            return true;
          })
          .times(3)
          .reply(200, { Messages: [] });

        const result = await backend.receiveBatch({ minTime: 45, maxTime: 60, maxMessages: 1000 });
        assert.deepStrictEqual(result.messages, []);
        assert.strictEqual(calls, 3);
      } finally {
        clock.restore();
      }
    });

    it('keeps polling past minTime up to maxTime while messages keep arriving', async () => {
      const clock = sinon.useFakeTimers({ toFake: ['Date'], now: 0 });
      try {
        const backend = buildTestBackend();
        nock('https://sqs.fake.amazonaws.com')
          .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
          .post('/')
          .reply(200, { QueueUrl: QUEUE_URL });

        let calls = 0;
        nock('https://sqs.fake.amazonaws.com')
          .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
          .post('/', (body) => {
            calls += 1;
            clock.tick(body.WaitTimeSeconds * 1000);
            return true;
          })
          .times(2)
          .reply(200, () => {
            // first call (minTime window) returns a message, prompting extra polling up to
            // maxTime; the second call (maxTime window) returns nothing, ending the loop.
            if (calls === 1) {
              return { Messages: [{ MessageId: 'mid-1', ReceiptHandle: 'rh-1', Body: 'hi' }] };
            }
            return { Messages: [] };
          });

        const result = await backend.receiveBatch({ minTime: 10, maxTime: 30, maxMessages: 1000 });
        assert.strictEqual(result.messages.length, 1);
        assert.strictEqual(calls, 2);
      } finally {
        clock.restore();
      }
    });

    it('throws a QueueError when the ReceiveMessageCommand call itself fails', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.ReceiveMessage')
        .post('/')
        .reply(500, { message: 'internal error' });

      await assert.rejects(backend.receiveBatch({ minTime: 1, maxTime: 1 }), QueueError);
    });
  });

  describe('deleteBatch()', () => {
    it('deletes a single chunk, mapping Successful ids back to the original messages', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.DeleteMessageBatch')
        .post('/', (body) => {
          assert.deepStrictEqual(body.Entries, [{ Id: 'mid-1', ReceiptHandle: 'rh-1' }]);
          return true;
        })
        .reply(200, { Successful: [{ Id: 'mid-1' }], Failed: [] });

      const messages = [{ id: 'mid-1', body: 'hi', raw: { ReceiptHandle: 'rh-1' } }];
      const result = await backend.deleteBatch(messages);
      assert.strictEqual(result.deleted[0], messages[0]);
      assert.deepStrictEqual(result.failed, []);
    });

    it('cleans up a swapped message body once the message is acknowledged', async () => {
      const bucket = new FakeBucket();
      await bucket.put('default/sqs-swap/my-queue-123.json', 'the real body');
      const backend = buildTestBackend({ bucket });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.DeleteMessageBatch')
        .post('/')
        .reply(200, { Successful: [{ Id: 'mid-1' }], Failed: [] });

      const messages = [{
        id: 'mid-1',
        body: 'the real body',
        raw: { ReceiptHandle: 'rh-1', swapKey: 'default/sqs-swap/my-queue-123.json' },
      }];
      await backend.deleteBatch(messages);
      assert.deepStrictEqual(bucket.removeCalls, ['default/sqs-swap/my-queue-123.json']);
      assert.strictEqual(bucket.objects.has('default/sqs-swap/my-queue-123.json'), false);
    });

    it('does not attempt cleanup for a message that was never swapped', async () => {
      const bucket = new FakeBucket();
      const backend = buildTestBackend({ bucket });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.DeleteMessageBatch')
        .post('/')
        .reply(200, { Successful: [{ Id: 'mid-1' }], Failed: [] });

      const messages = [{ id: 'mid-1', body: 'hi', raw: { ReceiptHandle: 'rh-1' } }];
      await backend.deleteBatch(messages);
      assert.deepStrictEqual(bucket.removeCalls, []);
    });

    it('logs (but does not throw for) a failure to clean up a swapped message body', async () => {
      const bucket = new FakeBucket();
      bucket.remove = async () => {
        throw new Error('boom');
      };
      const backend = buildTestBackend({ bucket });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.DeleteMessageBatch')
        .post('/')
        .reply(200, { Successful: [{ Id: 'mid-1' }], Failed: [] });

      const messages = [{
        id: 'mid-1', body: 'hi', raw: { ReceiptHandle: 'rh-1', swapKey: 'k.json' },
      }];
      const result = await backend.deleteBatch(messages);
      assert.strictEqual(result.deleted[0], messages[0]);
    });

    it('splits more than 10 messages into multiple DeleteMessageBatchCommand calls', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });

      const calls = [];
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.DeleteMessageBatch')
        .post('/')
        .times(2)
        .reply(200, (uri, rawBody) => {
          const body = JSON.parse(rawBody);
          calls.push(body.Entries.length);
          return { Successful: body.Entries.map(({ Id }) => ({ Id })), Failed: [] };
        });

      const messages = Array.from({ length: 12 }, (_, i) => (
        { id: `mid-${i}`, body: `b${i}`, raw: { ReceiptHandle: `rh-${i}` } }
      ));
      const result = await backend.deleteBatch(messages);
      assert.deepStrictEqual(calls, [10, 2]);
      assert.strictEqual(result.deleted.length, 12);
    });

    it('collects per-message Failed entries without throwing', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.DeleteMessageBatch')
        .post('/')
        .reply(200, {
          Successful: [{ Id: 'mid-1' }],
          Failed: [{ Id: 'mid-2', Code: 'ReceiptHandleIsInvalid', Message: 'bad handle' }],
        });

      const messages = [
        { id: 'mid-1', body: 'a', raw: { ReceiptHandle: 'rh-1' } },
        { id: 'mid-2', body: 'b', raw: { ReceiptHandle: 'rh-2' } },
      ];
      const result = await backend.deleteBatch(messages);
      assert.strictEqual(result.deleted.length, 1);
      assert.strictEqual(result.deleted[0], messages[0]);
      assert.strictEqual(result.failed.length, 1);
      assert.strictEqual(result.failed[0].message, messages[1]);
      assert.ok(result.failed[0].error instanceof QueueError);
      assert.strictEqual(result.failed[0].error.code, 'ReceiptHandleIsInvalid');
    });

    it('throws a QueueError when the DeleteMessageBatchCommand call itself fails', async () => {
      const backend = buildTestBackend();
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.GetQueueUrl')
        .post('/')
        .reply(200, { QueueUrl: QUEUE_URL });
      nock('https://sqs.fake.amazonaws.com')
        .matchHeader('x-amz-target', 'AmazonSQS.DeleteMessageBatch')
        .post('/')
        .reply(500, { message: 'internal error' });

      const messages = [{ id: 'mid-1', body: 'a', raw: { ReceiptHandle: 'rh-1' } }];
      await assert.rejects(backend.deleteBatch(messages), QueueError);
    });
  });
});
