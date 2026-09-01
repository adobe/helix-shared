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
