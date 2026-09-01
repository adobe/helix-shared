# @adobe/helix-shared-storage-s3

The default AWS S3 (+ Cloudflare R2 mirroring) `StorageBackend` implementation for [`@adobe/helix-shared-storage`](../helix-shared-storage). See [`AbstractStorageBackend`](../helix-shared-storage/src/AbstractStorageBackend.js) for the backend convention this package implements.

## Usage

Existing S3/R2 consumers of `@adobe/helix-shared-storage`'s `Storage.fromContext()` migrate with a one-line import change:

```diff
- import { Storage } from '@adobe/helix-shared-storage';
+ import { StorageS3 as Storage } from '@adobe/helix-shared-storage-s3';
```

No other call site changes are required — `Storage.fromContext(context)`, `storage.contentBus()`, `disableR2` defaults, etc. all keep working exactly as before.

Consumers constructing `Storage` directly (bypassing `fromContext`) pass an explicit `backendFactory`:

```js
import { Storage } from '@adobe/helix-shared-storage';
import { createDefaultBackendFactory } from '@adobe/helix-shared-storage-s3';

const storage = new Storage({
  backendFactory: createDefaultBackendFactory(process.env),
});
```
