# Helix Shared - storage

The storage module provides a unified, backend-agnostic interface for managing objects in cloud storage. `Storage` and `Bucket` are configured with a pluggable `StorageBackend` — this package ships no cloud SDK itself; it defines the interface and generic bucket operations (compression, metadata copy/rename algebra, deep copy/delete) on top of it.

The default AWS S3 (+ Cloudflare R2 mirroring) backend lives in a separate package, [`@adobe/helix-shared-storage-s3`](../helix-shared-storage-s3), which most consumers will want to install alongside this one.

## Installation

```bash
npm install @adobe/helix-shared-storage @adobe/helix-shared-storage-s3
```

## Basic Usage

Existing S3/R2 consumers use `StorageS3`, the `Storage` subclass pre-wired with the default S3(+R2) backend, exported from `@adobe/helix-shared-storage-s3`:

```js
import { StorageS3 as Storage } from '@adobe/helix-shared-storage-s3';

export async function main(req, context) {
  const storage = Storage.fromContext(context);
  const bucket = storage.contentBus();

  const data = await bucket.get('/my/content.json');

  return new Response(data);
}
```

Consumers who want a different backend (or no cloud SDK dependency at all) construct core's generic `Storage` directly with an explicit `backendFactory` — a function `(bucketId, opts) => StorageBackend`:

```js
import { Storage } from '@adobe/helix-shared-storage';
import { createDefaultBackendFactory } from '@adobe/helix-shared-storage-s3';

const storage = new Storage({
  backendFactory: createDefaultBackendFactory(process.env),
  log: console,
});

const bucket = storage.bucket('my-bucket-name');
await bucket.put('/path/to/file.txt', 'Hello World', 'text/plain');
const data = await bucket.get('/path/to/file.txt');
storage.close();
```

## Working with Predefined Buckets

The storage module provides convenient methods for accessing common Helix buckets:

```js
const storage = Storage.fromContext(context);

const contentBucket = storage.contentBus();
const codeBucket = storage.codeBus();
const mediaBucket = storage.mediaBus();
const configBucket = storage.configBus();
const sourceBucket = storage.sourceBus(); // mirroring to a secondary backend disabled by default
```

## Bucket Operations

### Storing Objects

Store data from a Response object:

```js
import { Response } from '@adobe/fetch';

const response = new Response('Hello World', {
  headers: {
    'content-type': 'text/plain',
    'cache-control': 'max-age=3600',
  },
});

await bucket.store('/path/to/file.txt', response);
```

Store data directly with optional compression:

```js
// With compression (default)
await bucket.put('/path/to/file.txt', 'Hello World', 'text/plain', {
  'custom-meta': 'value',
});

// Without compression
await bucket.put('/path/to/file.txt', 'Hello World', 'text/plain', {}, false);
```

### Retrieving Objects

Get object contents:

```js
const data = await bucket.get('/path/to/file.txt');
if (data) {
  console.log(data.toString());
}
```

Get object contents with metadata:

```js
const meta = {};
const data = await bucket.get('/path/to/file.txt', meta);
if (data) {
  console.log('Content:', data.toString());
  console.log('Metadata:', meta);
}
```

Get only metadata:

```js
const metadata = await bucket.metadata('/path/to/file.txt');
console.log(metadata);
```

Get object headers:

```js
const headers = await bucket.head('/path/to/file.txt');
if (headers) {
  console.log('Content-Type:', headers.contentType);
  console.log('Last-Modified:', headers.lastModified);
}
```

### Copying Objects

Copy within the same bucket:

```js
await bucket.copy('/source/file.txt', '/destination/file.txt');
```

Copy with metadata manipulation:

```js
await bucket.copy('/source/file.txt', '/destination/file.txt', {
  renameMetadata: {
    'old-meta-key': 'new-meta-key',
  },
  addMetadata: {
    'additional-meta': 'value',
  },
});
```

### Listing Objects

List all objects under a prefix:

```js
const { objects } = await bucket.list('path/to/folder/');
objects.forEach((obj) => {
  console.log('Key:', obj.key);
  console.log('Size:', obj.contentLength);
  console.log('Type:', obj.contentType);
  console.log('Modified:', obj.lastModified);
});
```

List objects in a shallow manner (only direct children):

```js
const { objects } = await bucket.list('path/to/folder/', {
  shallow: true,
  maxItems: 100, // limit result count
});
```

List folders:

```js
const folders = await bucket.listFolders('path/to/');
folders.forEach((folder) => {
  console.log('Folder:', folder);
});
```

### Copying Directory Trees

Copy an entire directory tree with optional filtering:

```js
// Copy all files
await bucket.copyDeep('/source/folder/', '/destination/folder/');

// Copy with filter
await bucket.copyDeep(
  '/source/folder/',
  '/destination/folder/',
  (obj) => obj.contentType === 'text/plain',
);

// Copy with metadata options
await bucket.copyDeep(
  '/source/folder/',
  '/destination/folder/',
  () => true,
  {
    addMetadata: {
      'copied-at': new Date().toISOString(),
    },
  },
);
```

### Removing Objects

Remove a single object:

```js
await bucket.remove('/path/to/file.txt');
```

Remove multiple objects:

```js
await bucket.remove([
  '/path/to/file1.txt',
  '/path/to/file2.txt',
  '/path/to/file3.txt',
]);
```

Remove an entire directory:

```js
await bucket.rmdir('/path/to/folder/');
```

### Updating Metadata

Update metadata for an existing object. `meta` may mix custom, user-defined keys with common
system-property field names (e.g. `contentType`) — each backend recognizes and applies its own
subset appropriately (the default S3 backend maps `contentType` onto the object's `Content-Type`
system property instead of writing it as custom metadata):

```js
await bucket.putMeta('/path/to/file.txt', {
  contentType: 'text/html',
  'new-meta-key': 'new-value',
  'updated-at': new Date().toISOString(),
});
```

`putMeta()` fully replaces the metadata set — any system-property field or custom key not
included is not preserved. To update metadata without accidentally losing existing fields, use
`getMeta()` (the `putMeta()`-compatible counterpart of `metadata()`) to round-trip safely:

```js
const meta = await bucket.getMeta('/path/to/file.txt');
meta['updated-at'] = new Date().toISOString();
await bucket.putMeta('/path/to/file.txt', meta);
```

## Configuration Options

### Bucket Name Mapping

You can customize bucket names using the `HELIX_BUCKET_NAMES` environment variable or the `bucketNames` option:

```js
const storage = new Storage({
  backendFactory,
  bucketNames: JSON.stringify({
    config: 'my-custom-config-bucket',
    code: 'my-custom-code-bucket',
    content: 'my-custom-content-bucket',
    media: 'my-custom-media-bucket',
  }),
});
```

Or use the helper function:

```js
import { parseBucketNames } from '@adobe/helix-shared-storage';

const bucketMap = parseBucketNames(process.env.HELIX_BUCKET_NAMES);
console.log(bucketMap.content); // 'helix-content-bus' (default) or custom name
```

### Backend Options (e.g. Disabling R2 Mirroring)

`bucket()` and the named bus accessors take an opaque options bag forwarded verbatim to the configured `backendFactory` — core doesn't interpret it. The default S3/R2 backend (`@adobe/helix-shared-storage-s3`) recognizes `{ disableR2: true }`:

```js
// Disable R2 for a specific bucket
const bucket = storage.contentBus({ disableR2: true });
```

Whether R2 mirroring is configured *at all*, and any HTTP/timeout/retry tuning, is a backend-package concern — see `@adobe/helix-shared-storage-s3`'s `createDefaultBackendFactory` for the S3/R2-specific environment variables it reads (`CLOUDFLARE_ACCOUNT_ID`, `HELIX_STORAGE_DISABLE_R2`, `HELIX_HTTP_CONNECTION_TIMEOUT`, etc.).

## Important Behaviors

### Automatic Compression

All objects stored via `put()` and `store()` are automatically compressed with gzip unless explicitly disabled. Objects are automatically decompressed when retrieved with `get()`.

### Path Sanitization

Leading slashes in object keys are automatically removed. Both `/path/to/file.txt` and `path/to/file.txt` refer to the same object.

### Metadata Headers

Certain HTTP headers are stored as backend system properties rather than custom metadata: `cache-control`, `content-type`, and `expires`. The `last-modified` header is stored as custom metadata with the key `x-source-last-modified`.

### Parallel Operations

Write operations (put, store, copy, remove, putMeta) are dispatched to every backend a `MirroringBackend` composes in parallel (e.g. S3 + R2 with the default backend); read operations only query the primary.

### Batch Deletions

Each backend owns its own batching limits when removing multiple objects (e.g. the default S3/R2 backend chunks into groups of 1000 to comply with AWS S3 limits).
