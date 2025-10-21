# Helix Shared - tokencache

The tokencache package provides cache plugins for storing and retrieving OAuth tokens used by MSAL (Microsoft Authentication Library). It supports multiple storage backends including in-memory caching, filesystem storage, and S3-based persistence with optional encryption.

## Installation

```bash
npm install @adobe/helix-shared-tokencache
```

## Usage

Token caches can be layered, with a fast in-memory cache backed by a persistent storage layer. This enables efficient token retrieval while maintaining durability across application restarts.

### Basic Usage with getCachePlugin

The `getCachePlugin` function is the recommended way to get a cache plugin. It automatically searches for token caches in multiple locations:

1. `helix-content-bus/${contentBusId}/.helix-auth` (if contentBusId is provided)
2. `helix-code-bus/${owner}/.helix-auth` (if owner is provided)
3. `helix-content-bus/default/.helix-auth` (fallback)

```js
import { getCachePlugin } from '@adobe/helix-shared-tokencache';

const cachePlugin = await getCachePlugin({
  log: console,
  contentBusId: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789a',
  owner: 'adobe',
  user: 'content',
  readOnly: false
}, 'onedrive');

console.log(`Using token cache from: ${cachePlugin.location}`);
```

### Using Individual Cache Plugins

#### MemCachePlugin

In-memory cache plugin with optional backing storage:

```js
import { MemCachePlugin, S3CachePlugin } from '@adobe/helix-shared-tokencache';

// In-memory only
const memCache = new MemCachePlugin({
  log: console,
  key: 'my-cache-key',
  type: 'onedrive'
});

// In-memory with S3 backing
const s3Base = new S3CachePlugin({
  log: console,
  bucket: 'helix-content-bus',
  key: 'default/.helix-auth/auth-onedrive-content.json',
  secret: 'encryption-secret',
  type: 'onedrive'
});

const memCacheWithBacking = new MemCachePlugin({
  log: console,
  key: 'my-cache-key',
  base: s3Base,
  type: 'onedrive'
});
```

#### FSCachePlugin

Filesystem-based cache plugin:

```js
import { FSCachePlugin } from '@adobe/helix-shared-tokencache';

const fsCache = new FSCachePlugin({
  log: console,
  filePath: '/path/to/token-cache.json'
});
```

#### S3CachePlugin

S3-based cache plugin with optional encryption:

```js
import { S3CachePlugin } from '@adobe/helix-shared-tokencache';

const s3Cache = new S3CachePlugin({
  log: console,
  bucket: 'helix-content-bus',
  key: 'default/.helix-auth/auth-onedrive-content.json',
  secret: 'encryption-secret', // optional, enables encryption
  readOnly: false,
  type: 'onedrive'
});
```

### Using S3CacheManager

The S3CacheManager helps locate existing token caches:

```js
import { S3CacheManager } from '@adobe/helix-shared-tokencache';

// Find the first existing cache from multiple locations
const cachePlugin = await S3CacheManager.findCache('content', {
  log: console,
  prefix: 'default/.helix-auth',
  secret: 'default',
  bucket: 'helix-content-bus',
  type: 'onedrive',
  readOnly: false
}, {
  prefix: 'adobe/.helix-auth',
  secret: 'adobe',
  bucket: 'helix-code-bus'
}, {
  prefix: '0123456789abcdef/.helix-auth',
  secret: '0123456789abcdef',
  bucket: 'helix-content-bus'
});

// List all cache keys in a location
const manager = new S3CacheManager({
  log: console,
  bucket: 'helix-content-bus',
  prefix: 'default/.helix-auth',
  secret: 'default',
  type: 'onedrive'
});

const keys = await manager.listCacheKeys();
console.log('Available cache keys:', keys);
```

### Encryption and Decryption

The package provides AES-256-GCM encryption utilities for secure token storage:

```js
import { encrypt, decrypt } from '@adobe/helix-shared-tokencache';

const plainText = Buffer.from('sensitive token data', 'utf-8');
const secret = 'my-encryption-key';

// Encrypt
const encrypted = encrypt(secret, plainText);

// Decrypt
const decrypted = decrypt(secret, encrypted);
console.log(decrypted.toString('utf-8')); // 'sensitive token data'
```

## Configuration Options

### getCachePlugin Options

- `log` (Console): Logger instance (default: console)
- `contentBusId` (string): Content bus identifier for content-specific caches
- `owner` (string): Code owner for organization-specific caches
- `user` (string): User identifier for the cache (default: 'content')
- `readOnly` (boolean): If true, prevents writing to the underlying storage (default: false)
- `contentBucket` (string): Name of the content bus bucket (default: 'helix-content-bus')
- `codeBucket` (string): Name of the code bus bucket (default: 'helix-code-bus')

### Cache Plugin Methods

All cache plugins implement the following methods:

- `beforeCacheAccess(cacheContext)`: Called before cache access to load tokens
- `afterCacheAccess(cacheContext)`: Called after cache access to save tokens
- `deleteCache()`: Removes the cache from storage
- `getPluginMetadata()`: Retrieves metadata associated with the cache
- `setPluginMetadata(meta)`: Stores metadata with the cache
- `location`: Property that returns the cache location identifier

## Local Development

For local development, set the `HELIX_ONEDRIVE_LOCAL_AUTH_CACHE` environment variable to enable custom cache storage:

```bash
export HELIX_ONEDRIVE_LOCAL_AUTH_CACHE=1
```

This allows you to provide your own cache Map instance when calling `getCachePlugin`.
