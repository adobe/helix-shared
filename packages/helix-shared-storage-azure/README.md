# @adobe/helix-shared-storage-azure

An Azure Blob Storage `StorageBackend` implementation for [`@adobe/helix-shared-storage`](../helix-shared-storage). See [`AbstractStorageBackend`](../helix-shared-storage/src/AbstractStorageBackend.js) for the backend convention this package implements.

## Usage

Existing consumers of `@adobe/helix-shared-storage`'s `Storage.fromContext()` migrate with a one-line import change:

```diff
- import { Storage } from '@adobe/helix-shared-storage';
+ import { StorageAzure as Storage } from '@adobe/helix-shared-storage-azure';
```

No other call site changes are required — `Storage.fromContext(context)`, `storage.contentBus()`, etc. all keep working exactly as before.

The default backend factory authenticates against Azure Blob Storage from environment variables, preferring a connection string when set:

- `HLX_AZURE_STORAGE_CONNECTION_STRING`, or
- `HLX_AZURE_STORAGE_ACCOUNT_NAME` + `HLX_AZURE_STORAGE_ACCOUNT_KEY`

Consumers constructing `Storage` directly (bypassing `fromContext`) pass an explicit `backendFactory`:

```js
import { Storage } from '@adobe/helix-shared-storage';
import { createDefaultBackendFactory } from '@adobe/helix-shared-storage-azure';

const storage = new Storage({
  backendFactory: createDefaultBackendFactory(process.env),
});
```
