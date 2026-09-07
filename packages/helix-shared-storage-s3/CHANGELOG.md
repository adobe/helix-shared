# [@adobe/helix-shared-storage-s3-v1.3.0](https://github.com/adobe/helix-shared/compare/@adobe/helix-shared-storage-s3-v1.2.0...@adobe/helix-shared-storage-s3-v1.3.0) (2026-09-07)


### Features

* **storage:** add streaming putStream() to the storage backend interface ([#1266](https://github.com/adobe/helix-shared/issues/1266)) ([475e287](https://github.com/adobe/helix-shared/commit/475e28786dc129ec98e52185efc791f6a88d4b16))

# [@adobe/helix-shared-storage-s3-v1.2.0](https://github.com/adobe/helix-shared/compare/@adobe/helix-shared-storage-s3-v1.1.1...@adobe/helix-shared-storage-s3-v1.2.0) (2026-09-07)


### Features

* **storage:** add backend-agnostic conditional-copy support to CopyOptions ([#1265](https://github.com/adobe/helix-shared/issues/1265)) ([99b1151](https://github.com/adobe/helix-shared/commit/99b115178f753c4495289e2a15f6064d45de3376))

# [@adobe/helix-shared-storage-s3-v1.1.1](https://github.com/adobe/helix-shared/compare/@adobe/helix-shared-storage-s3-v1.1.0...@adobe/helix-shared-storage-s3-v1.1.1) (2026-09-02)


### Bug Fixes

* **storage:** allow parameters to backend to be passed explicitly ([#1262](https://github.com/adobe/helix-shared/issues/1262)) ([bf0768f](https://github.com/adobe/helix-shared/commit/bf0768f0bfa87d4f413691a0d64eba5f274bc7aa))

# [@adobe/helix-shared-storage-s3-v1.1.0](https://github.com/adobe/helix-shared/compare/@adobe/helix-shared-storage-s3-v1.0.0...@adobe/helix-shared-storage-s3-v1.1.0) (2026-09-01)


### Features

* use correct deps ([1441ffe](https://github.com/adobe/helix-shared/commit/1441ffe57804a0c2e354155aacbee264284dfcc8))

# @adobe/helix-shared-storage-s3-v1.0.0 (2026-09-01)


* feat(storage)!: pluggable StorageBackend, extract @adobe/helix-shared-storage-s3 ([b06f628](https://github.com/adobe/helix-shared/commit/b06f628a3b70f9df4ca1e8c99d7006049a8e49a7)), closes [#1258](https://github.com/adobe/helix-shared/issues/1258)


### BREAKING CHANGES

* HelixStorage/HelixStorageS3 renamed to Storage/StorageS3;
Storage now requires an explicit backendFactory; head()/get() metadata use
lowerCamelCase common fields instead of raw S3 field names; putMeta() drops
its opts param; AWS_S3_SYSTEM_HEADERS and Storage.s3() are removed.
