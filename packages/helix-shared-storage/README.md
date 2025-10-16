# Helix Shared - storage

The storage module provides a unified interface for managing objects in AWS S3 and Cloudflare R2 storage. It offers simplified bucket operations with automatic mirroring to R2, compression support, and comprehensive file management capabilities.

## Basic Usage

```js
import { HelixStorage } from '@adobe/helix-shared-storage';

const storage = new HelixStorage({
  region: 'us-east-1',
  accessKeyId: 'YOUR_AWS_ACCESS_KEY',
  secretAccessKey: 'YOUR_AWS_SECRET_KEY',
  r2AccountId: 'YOUR_R2_ACCOUNT_ID',
  r2AccessKeyId: 'YOUR_R2_ACCESS_KEY',
  r2SecretAccessKey: 'YOUR_R2_SECRET_KEY',
  log: console,
});

// Get a bucket instance
const bucket = storage.bucket('my-bucket-name');

// Store data
await bucket.put('/path/to/file.txt', 'Hello World', 'text/plain');

// Retrieve data
const data = await bucket.get('/path/to/file.txt');

// Clean up
storage.close();
```

## Creating Storage from Context

When working within the Helix ecosystem, you can create a storage instance from the context object:

```js
import { HelixStorage } from '@adobe/helix-shared-storage';

export async function main(req, context) {
  const storage = HelixStorage.fromContext(context);
  const bucket = storage.contentBus();

  // Use the bucket...
  const data = await bucket.get('/my/content.json');

  return new Response(data);
}
```

## Working with Predefined Buckets

The storage module provides convenient methods for accessing common Helix buckets:

```js
const storage = HelixStorage.fromContext(context);

// Access different bucket types
const contentBucket = storage.contentBus();
const codeBucket = storage.codeBus();
const mediaBucket = storage.mediaBus();
const configBucket = storage.configBus();
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
  console.log('Content-Type:', headers.ContentType);
  console.log('Last-Modified:', headers.LastModified);
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
const objects = await bucket.list('path/to/folder/');
objects.forEach((obj) => {
  console.log('Key:', obj.key);
  console.log('Path:', obj.path);
  console.log('Size:', obj.contentLength);
  console.log('Type:', obj.contentType);
  console.log('Modified:', obj.lastModified);
});
```

List objects in a shallow manner (only direct children):

```js
const objects = await bucket.list('path/to/folder/', true);
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
  (obj) => obj.contentType === 'text/plain'
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
  }
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

Update metadata for an existing object:

```js
await bucket.putMeta('/path/to/file.txt', {
  'new-meta-key': 'new-value',
  'updated-at': new Date().toISOString(),
});
```

## Configuration Options

### Bucket Name Mapping

You can customize bucket names using the `HELIX_BUCKET_NAMES` environment variable or the `bucketNames` option:

```js
const storage = new HelixStorage({
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

### Disabling R2 Mirroring

By default, all write operations are mirrored to both S3 and R2. You can disable R2 for specific operations:

```js
// Disable R2 globally
const storage = new HelixStorage({
  disableR2: true,
  // ... other options
});

// Disable R2 for specific buckets
const bucket = storage.contentBus(true); // disableR2 = true
```

You can also disable R2 using the `HELIX_STORAGE_DISABLE_R2` environment variable:

```bash
export HELIX_STORAGE_DISABLE_R2=true
```

### HTTP Configuration

Configure connection timeouts and keep-alive:

```js
const storage = new HelixStorage({
  connectionTimeout: 5000, // milliseconds
  socketTimeout: 15000, // milliseconds
  keepAlive: true,
});
```

These can also be set via environment variables:
- `HELIX_HTTP_CONNECTION_TIMEOUT` - Connection timeout in milliseconds
- `HELIX_HTTP_SOCKET_TIMEOUT` - Socket timeout in milliseconds
- `HELIX_HTTP_S3_KEEP_ALIVE` - Enable HTTP keep-alive (true/false)

## Important Behaviors

### Automatic Compression

All objects stored via `put()` and `store()` are automatically compressed with gzip unless explicitly disabled. Objects are automatically decompressed when retrieved with `get()`.

### Path Sanitization

Leading slashes in object keys are automatically removed. Both `/path/to/file.txt` and `path/to/file.txt` refer to the same object.

### Metadata Headers

Certain HTTP headers are stored as S3 system properties rather than custom metadata:
- `cache-control` → `CacheControl`
- `content-type` → `ContentType`
- `expires` → `Expires`
- `content-disposition` → `ContentDisposition`
- `content-encoding` → `ContentEncoding`
- `content-language` → `ContentLanguage`

The `last-modified` header is stored as custom metadata with the key `x-source-last-modified`.

### Parallel Operations

Write operations (put, store, copy, remove) are automatically executed in parallel on both S3 and R2 when R2 mirroring is enabled. Read operations only query S3.

### Batch Deletions

When removing multiple objects, they are automatically batched into chunks of 1000 objects per request to comply with AWS S3 limits.
