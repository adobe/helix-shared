# @adobe/helix-shared-storage-s3

The default AWS S3 (+ Cloudflare R2 mirroring) [`StorageBackend`](../helix-shared-storage/src/StorageBackend.d.ts) implementation for [`@adobe/helix-shared-storage`](../helix-shared-storage).

## Usage

Existing S3/R2 consumers of `@adobe/helix-shared-storage`'s `HelixStorage.fromContext()` migrate with a one-line import change:

```diff
- import { HelixStorage } from '@adobe/helix-shared-storage';
+ import { HelixStorageS3 as HelixStorage } from '@adobe/helix-shared-storage-s3';
```

No other call site changes are required — `HelixStorage.fromContext(context)`, `storage.contentBus()`, `disableR2` defaults, etc. all keep working exactly as before.

Consumers constructing `HelixStorage` directly (bypassing `fromContext`) pass an explicit `backendFactory`:

```js
import { HelixStorage } from '@adobe/helix-shared-storage';
import { createDefaultBackendFactory } from '@adobe/helix-shared-storage-s3';

const storage = new HelixStorage({
  backendFactory: createDefaultBackendFactory(process.env),
});
```
