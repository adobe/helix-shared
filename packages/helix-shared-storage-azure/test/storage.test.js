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
import { promisify } from 'util';
import zlib from 'zlib';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { Storage } from '@adobe/helix-shared-storage';
import { Nock } from './utils.js';
import { StorageAzure } from '../src/StorageAzure.js';
import { AzureBackend } from '../src/AzureBackend.js';

const gzip = promisify(zlib.gzip);

const HLX_AZURE_STORAGE_ACCOUNT_NAME = 'fake';
const HLX_AZURE_STORAGE_ACCOUNT_KEY = Buffer.from('fake-key').toString('base64');

const BASE_URL = `https://${HLX_AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`;

/**
 * Builds an `AzureBackend` wired directly against fake, static test credentials, bound to
 * container `helix-code-bus`.
 */
function buildTestBackend() {
  const client = new BlobServiceClient(
    BASE_URL,
    new StorageSharedKeyCredential(HLX_AZURE_STORAGE_ACCOUNT_NAME, HLX_AZURE_STORAGE_ACCOUNT_KEY),
    { retryOptions: { maxTries: 1 } },
  );
  return new AzureBackend({
    client: client.getContainerClient('helix-code-bus'),
    name: 'Azure',
    bucketName: 'helix-code-bus',
    log: console,
  });
}

function listResponseXml({ blobs = [], prefixes = [], nextMarker = '' } = {}) {
  const blobsXml = blobs.map(({
    name, contentLength = 0, contentType = 'application/octet-stream',
  }) => `
    <Blob>
      <Name>${name}</Name>
      <Properties>
        <Last-Modified>Mon, 01 Jan 2024 00:00:00 GMT</Last-Modified>
        <Etag>"0x8D1234567890ABC"</Etag>
        <Content-Length>${contentLength}</Content-Length>
        <Content-Type>${contentType}</Content-Type>
        <BlobType>BlockBlob</BlobType>
      </Properties>
    </Blob>`).join('');
  const prefixesXml = prefixes.map((name) => `
    <BlobPrefix>
      <Name>${name}</Name>
    </BlobPrefix>`).join('');
  return `<?xml version="1.0" encoding="utf-8"?>
<EnumerationResults ServiceEndpoint="${BASE_URL}/" ContainerName="helix-code-bus">
  <Prefix></Prefix>
  <Marker></Marker>
  <MaxResults>5000</MaxResults>
  <Delimiter>/</Delimiter>
  <Blobs>${prefixesXml}${blobsXml}</Blobs>
  <NextMarker>${nextMarker}</NextMarker>
</EnumerationResults>`;
}

describe('AzureBackend storage test', () => {
  let nock;
  let backend;

  beforeEach(() => {
    nock = new Nock().env({
      HLX_AZURE_STORAGE_ACCOUNT_NAME,
      HLX_AZURE_STORAGE_ACCOUNT_KEY,
    });
    backend = buildTestBackend();
  });

  afterEach(() => {
    nock.done();
  });

  it('creates a storage from context, wired to a code-bus', () => {
    const ctx = {
      env: { HLX_AZURE_STORAGE_ACCOUNT_NAME, HLX_AZURE_STORAGE_ACCOUNT_KEY },
      log: console,
      attributes: {},
    };
    const stor = StorageAzure.fromContext(ctx);
    assert.ok(stor instanceof StorageAzure);
    assert.ok(stor instanceof Storage);
    assert.strictEqual(stor.codeBus().bucket, 'helix-code-bus');
    assert.ok(stor.codeBus().client);
  });

  it('can get an object through the bucket facade', async () => {
    const stor = new Storage({ backendFactory: () => backend });
    nock(BASE_URL)
      .get('/helix-code-bus/foo')
      .reply(200, 'hello, world.', { 'content-length': '13', etag: '"abc"' });
    const ret = await stor.codeBus().get('/foo');
    assert.strictEqual(ret.toString(), 'hello, world.');
  });

  it('get compressed object and populates the meta object', async () => {
    const body = await gzip('hello, world.');
    nock(BASE_URL)
      .get('/helix-code-bus/foo')
      .reply(200, body, {
        'content-type': 'text/plain',
        'content-encoding': 'gzip',
        'cache-control': 'no-store',
        etag: '"499455814df5a2001612b12b575bfaaa"',
        'last-modified': 'Mon, 03 Nov 2025 07:08:10 GMT',
        'x-ms-meta-x_source_location': 'github',
        'content-length': String(body.length),
      });
    const meta = {};
    const ret = await backend.get('foo', meta);
    assert.strictEqual(ret.toString(), 'hello, world.');
    assert.strictEqual(meta.contentType, 'text/plain');
    assert.strictEqual(meta.contentEncoding, 'gzip');
    assert.strictEqual(meta.cacheControl, 'no-store');
    assert.strictEqual(meta['x-source-location'], 'github');
    assert.strictEqual(meta.etag, '"499455814df5a2001612b12b575bfaaa"');
  });

  it('get falls back to the content_encoding metadata property when the native header is empty', async () => {
    const body = await gzip('hello, world.');
    nock(BASE_URL)
      .get('/helix-code-bus/foo')
      .reply(200, body, {
        'content-type': 'text/plain',
        etag: '"abc"',
        'x-ms-meta-content_encoding': 'gzip',
        'content-length': String(body.length),
      });
    const meta = {};
    const ret = await backend.get('foo', meta);
    assert.strictEqual(ret.toString(), 'hello, world.');
    assert.strictEqual(meta.contentEncoding, 'gzip');
  });

  it('head falls back to the content_encoding metadata property when the native header is empty', async () => {
    nock(BASE_URL)
      .head('/helix-code-bus/foo')
      .reply(200, '', {
        'content-type': 'text/plain',
        etag: '"abc"',
        'x-ms-meta-content_encoding': 'gzip',
      });
    const meta = await backend.head('foo');
    assert.strictEqual(meta.contentEncoding, 'gzip');
  });

  it('get returns null for not found', async () => {
    nock(BASE_URL)
      .get('/helix-code-bus/foo')
      .reply(404, '<?xml version="1.0" encoding="utf-8"?><Error><Code>BlobNotFound</Code></Error>', {
        'content-type': 'application/xml',
      });
    const ret = await backend.get('foo');
    assert.strictEqual(ret, null);
  });

  it('get throws error', async () => {
    nock(BASE_URL)
      .get('/helix-code-bus/foo')
      .reply(500, '<?xml version="1.0" encoding="utf-8"?><Error><Code>InternalError</Code></Error>', {
        'content-type': 'application/xml',
      });
    await assert.rejects(backend.get('foo'));
  });

  it('can get metadata of an object', async () => {
    nock(BASE_URL)
      .head('/helix-code-bus/foo')
      .reply(200, '', {
        'content-type': 'text/html',
        'content-length': '123',
        etag: '"abc"',
        'last-modified': 'Mon, 03 Nov 2025 07:08:10 GMT',
        'x-ms-meta-foo': 'bar',
      });
    const meta = await backend.head('foo');
    assert.strictEqual(meta.contentType, 'text/html');
    assert.strictEqual(meta.contentLength, 123);
    assert.strictEqual(meta.etag, '"abc"');
    assert.deepStrictEqual(meta.metadata, { foo: 'bar' });
  });

  it('head returns null for not found', async () => {
    nock(BASE_URL)
      .head('/helix-code-bus/foo')
      .reply(404);
    const meta = await backend.head('foo');
    assert.strictEqual(meta, null);
  });

  it('head throws error', async () => {
    nock(BASE_URL)
      .head('/helix-code-bus/foo')
      .reply(500);
    await assert.rejects(backend.head('foo'));
  });

  it('can put an object (string body)', async () => {
    nock(BASE_URL)
      .put('/helix-code-bus/foo')
      .reply(201, '', { etag: '"abc"' });
    const raw = await backend.put('foo', 'hello, world.', { contentType: 'text/plain' });
    assert.strictEqual(raw.etag, '"abc"');
    assert.strictEqual(raw.contentType, 'text/plain');
  });

  it('can put an object (buffer body)', async () => {
    nock(BASE_URL)
      .put('/helix-code-bus/foo')
      .reply(201, '', { etag: '"abc"' });
    const raw = await backend.put('foo', Buffer.from('hello, world.'));
    assert.strictEqual(raw.etag, '"abc"');
  });

  it('put substitutes `-` with `_` in metadata keys (Azure does not allow `-`)', async () => {
    nock(BASE_URL)
      .put('/helix-code-bus/foo')
      .matchHeader('x-ms-meta-x_last_modified_by', 'ksexton@adobe.com')
      .reply(201, '', { etag: '"abc"' });
    await backend.put('foo', 'hello, world.', { metadata: { 'x-last-modified-by': 'ksexton@adobe.com' } });
  });

  it('putMeta substitutes `-` with `_` in metadata keys (Azure does not allow `-`)', async () => {
    nock(BASE_URL)
      .put('/helix-code-bus/foo')
      .query({ comp: 'metadata' })
      .matchHeader('x-ms-meta-x_last_modified_by', 'ksexton@adobe.com')
      .reply(200, '', { etag: '"abc"' });
    nock(BASE_URL)
      .put('/helix-code-bus/foo')
      .query({ comp: 'properties' })
      .reply(200, '', { etag: '"abc"' });
    await backend.putMeta('foo', { 'x-last-modified-by': 'ksexton@adobe.com' });
  });

  it('head restores `-` from `_` in metadata keys read back from Azure', async () => {
    nock(BASE_URL)
      .head('/helix-code-bus/foo')
      .reply(200, '', {
        etag: '"abc"',
        'x-ms-meta-x_last_modified_by': 'ksexton@adobe.com',
        'x-ms-meta-x_source_last_modified': 'Wed, 05 Aug 2026 21:54:45 GMT',
      });
    const meta = await backend.head('foo');
    assert.strictEqual(meta.metadata['x-last-modified-by'], 'ksexton@adobe.com');
    assert.strictEqual(meta.metadata['x-source-last-modified'], 'Wed, 05 Aug 2026 21:54:45 GMT');
  });

  it('can replace metadata', async () => {
    nock(BASE_URL)
      .put('/helix-code-bus/foo')
      .query({ comp: 'metadata' })
      .reply(200, '', { etag: '"abc"' });
    nock(BASE_URL)
      .put('/helix-code-bus/foo')
      .query({ comp: 'properties' })
      .reply(200, '', { etag: '"abc"' });
    const raw = await backend.putMeta('foo', { contentType: 'text/plain', myKey: 'myValue' });
    assert.ok(raw.raw.metadata);
    assert.ok(raw.raw.headers);
  });

  it('can copy an object (COPY directive, source preserved)', async () => {
    nock(BASE_URL)
      .put('/helix-code-bus/dst')
      .reply(202, '', {
        etag: '"abc"',
        'x-ms-copy-id': 'copy-1',
        'x-ms-copy-status': 'success',
      });
    const raw = await backend.copy('src', 'dst');
    assert.strictEqual(raw.etag, '"abc"');
  });

  it('can copy an object (REPLACE directive, follow-up setHTTPHeaders)', async () => {
    nock(BASE_URL)
      .put('/helix-code-bus/dst')
      .reply(202, '', {
        etag: '"abc"',
        'x-ms-copy-id': 'copy-1',
        'x-ms-copy-status': 'success',
      });
    nock(BASE_URL)
      .put('/helix-code-bus/dst')
      .query({ comp: 'properties' })
      .reply(200, '', { etag: '"def"' });
    const raw = await backend.copy('src', 'dst', {
      metadataDirective: 'REPLACE',
      contentType: 'text/plain',
      metadata: { foo: 'bar' },
    });
    assert.strictEqual(raw.etag, '"def"');
  });

  it('can copy an object (REPLACE directive, no explicit metadata)', async () => {
    nock(BASE_URL)
      .put('/helix-code-bus/dst')
      .reply(202, '', {
        etag: '"abc"',
        'x-ms-copy-id': 'copy-1',
        'x-ms-copy-status': 'success',
      });
    nock(BASE_URL)
      .put('/helix-code-bus/dst')
      .query({ comp: 'properties' })
      .reply(200, '', { etag: '"def"' });
    const raw = await backend.copy('src', 'dst', { metadataDirective: 'REPLACE' });
    assert.strictEqual(raw.etag, '"def"');
  });

  it('copy throws 404 when source is missing', async () => {
    nock(BASE_URL)
      .put('/helix-code-bus/dst')
      .reply(404, '<?xml version="1.0" encoding="utf-8"?><Error><Code>BlobNotFound</Code></Error>', {
        'content-type': 'application/xml',
      });
    await assert.rejects(
      backend.copy('src', 'dst'),
      (e) => e.status === 404,
    );
  });

  it('maps ifMatch/ifNoneMatch onto destination conditions', async () => {
    nock(BASE_URL)
      .put('/helix-code-bus/dst')
      .matchHeader('if-match', '"dest-etag"')
      .matchHeader('if-none-match', '*')
      .reply(202, '', {
        etag: '"abc"',
        'x-ms-copy-id': 'copy-1',
        'x-ms-copy-status': 'success',
      });
    const raw = await backend.copy('src', 'dst', { ifMatch: '"dest-etag"', ifNoneMatch: '*' });
    assert.strictEqual(raw.etag, '"abc"');
  });

  it('maps sourceIfMatch onto source conditions', async () => {
    nock(BASE_URL)
      .put('/helix-code-bus/dst')
      .matchHeader('x-ms-source-if-match', '"src-etag"')
      .reply(202, '', {
        etag: '"abc"',
        'x-ms-copy-id': 'copy-1',
        'x-ms-copy-status': 'success',
      });
    const raw = await backend.copy('src', 'dst', { sourceIfMatch: '"src-etag"' });
    assert.strictEqual(raw.etag, '"abc"');
  });

  it('normalizes a non-404 copy error\'s status onto e.status', async () => {
    nock(BASE_URL)
      .put('/helix-code-bus/dst')
      .reply(412, '<?xml version="1.0" encoding="utf-8"?><Error><Code>ConditionNotMet</Code></Error>', {
        'content-type': 'application/xml',
      });
    await assert.rejects(
      backend.copy('src', 'dst', { ifNoneMatch: '*' }),
      (e) => e.status === 412,
    );
  });

  it('can remove a single object', async () => {
    nock(BASE_URL)
      .delete('/helix-code-bus/foo')
      .reply(202);
    await backend.remove('foo');
  });

  it('remove of a single object throws on error', async () => {
    nock(BASE_URL)
      .delete('/helix-code-bus/foo')
      .reply(500);
    await assert.rejects(backend.remove('foo'));
  });

  it('can remove multiple objects', async () => {
    nock(BASE_URL)
      .delete('/helix-code-bus/foo1')
      .reply(202)
      .delete('/helix-code-bus/foo2')
      .reply(202);
    const result = await backend.remove(['foo1', 'foo2']);
    assert.strictEqual(result.Deleted.length, 2);
    assert.strictEqual(result.Errors.length, 0);
  });

  it('collects errors when removing multiple objects without stopOnError', async () => {
    nock(BASE_URL)
      .delete('/helix-code-bus/foo1')
      .reply(202)
      .delete('/helix-code-bus/foo2')
      .reply(500);
    const result = await backend.remove(['foo1', 'foo2']);
    assert.strictEqual(result.Deleted.length, 1);
    assert.strictEqual(result.Errors.length, 1);
  });

  it('stops removing multiple objects on first error with stopOnError', async () => {
    nock(BASE_URL)
      .delete('/helix-code-bus/foo1')
      .reply(500);
    await assert.rejects(
      backend.remove(['foo1'], { stopOnError: true }),
    );
  });

  it('can list objects at the bucket root (no slash in key)', async () => {
    nock(BASE_URL)
      .get('/helix-code-bus')
      .query((q) => q.restype === 'container' && q.comp === 'list')
      .reply(200, listResponseXml({
        blobs: [{ name: 'root.html', contentLength: 123, contentType: 'text/html' }],
      }), { 'content-type': 'application/xml' });
    const { objects } = await backend.list('');
    assert.strictEqual(objects[0].key, 'root.html');
    assert.strictEqual(objects[0].name, 'root.html');
  });

  it('can list objects deeply', async () => {
    nock(BASE_URL)
      .get('/helix-code-bus')
      .query((q) => q.restype === 'container' && q.comp === 'list')
      .reply(200, listResponseXml({
        blobs: [{ name: 'foo/bar.html', contentLength: 123, contentType: 'text/html' }],
      }), { 'content-type': 'application/xml' });
    const { objects } = await backend.list('foo/');
    assert.strictEqual(objects.length, 1);
    assert.strictEqual(objects[0].key, 'foo/bar.html');
    assert.strictEqual(objects[0].name, 'bar.html');
    assert.strictEqual(objects[0].isFolder, false);
  });

  it('can list objects shallowly, including folders', async () => {
    nock(BASE_URL)
      .get('/helix-code-bus')
      .query((q) => q.restype === 'container' && q.comp === 'list' && q.delimiter === '/')
      .reply(200, listResponseXml({
        prefixes: ['foo/sub/'],
        blobs: [{ name: 'foo/bar.html', contentLength: 123, contentType: 'text/html' }],
      }), { 'content-type': 'application/xml' });
    const { objects } = await backend.list('foo/', { shallow: true });
    const folder = objects.find((o) => o.isFolder);
    assert.strictEqual(folder.key, 'foo/sub/');
    assert.strictEqual(folder.name, 'sub');
  });

  it('list stops at maxItems', async () => {
    nock(BASE_URL)
      .get('/helix-code-bus')
      .query((q) => q.restype === 'container' && q.comp === 'list')
      .reply(200, listResponseXml({
        blobs: [
          { name: 'foo/a.html' },
          { name: 'foo/b.html' },
        ],
      }), { 'content-type': 'application/xml' });
    const { objects } = await backend.list('foo/', { maxItems: 1 });
    assert.strictEqual(objects.length, 1);
  });

  it('can browse a single page with a continuation token', async () => {
    nock(BASE_URL)
      .get('/helix-code-bus')
      .query((q) => q.restype === 'container' && q.comp === 'list' && q.delimiter === '/')
      .reply(200, listResponseXml({
        prefixes: ['foo/sub/'],
        blobs: [{ name: 'foo/bar.html', contentLength: 123, contentType: 'text/html' }],
        nextMarker: 'next-page-token',
      }), { 'content-type': 'application/xml' });
    const { objects, continuationToken } = await backend.browse('foo/');
    assert.strictEqual(objects.length, 2);
    assert.strictEqual(continuationToken, 'next-page-token');
  });

  it('browse returns no continuation token on the last page', async () => {
    nock(BASE_URL)
      .get('/helix-code-bus')
      .query((q) => q.restype === 'container' && q.comp === 'list' && q.delimiter === '/')
      .reply(200, listResponseXml({
        blobs: [{ name: 'foo/bar.html', contentLength: 123, contentType: 'text/html' }],
      }), { 'content-type': 'application/xml' });
    const { continuationToken } = await backend.browse('foo/');
    assert.strictEqual(continuationToken, undefined);
  });
});
