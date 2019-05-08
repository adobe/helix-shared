## [1.1.1](https://github.com/adobe/helix-shared/compare/v1.1.0...v1.1.1) (2019-05-07)


### Bug Fixes

* **config:** disallow / in directoryIndex ([2b7a011](https://github.com/adobe/helix-shared/commit/2b7a011)), closes [#106](https://github.com/adobe/helix-shared/issues/106)

# [1.1.0](https://github.com/adobe/helix-shared/compare/v1.0.2...v1.1.0) (2019-05-06)


### Bug Fixes

* **proxy:** unify generated names of origins for proxy strains ([5d12ead](https://github.com/adobe/helix-shared/commit/5d12ead))


### Features

* **proxy:** enable getting the fastly compatible JSON for an origin ([b1df9d3](https://github.com/adobe/helix-shared/commit/b1df9d3))

## [1.0.2](https://github.com/adobe/helix-shared/compare/v1.0.1...v1.0.2) (2019-05-06)


### Bug Fixes

* **package:** update yaml to version 1.5.1 ([de74688](https://github.com/adobe/helix-shared/commit/de74688))

## [1.0.1](https://github.com/adobe/helix-shared/compare/v1.0.0...v1.0.1) (2019-05-03)


### Bug Fixes

* include types.js in index.js ([96725f7](https://github.com/adobe/helix-shared/commit/96725f7))

# [1.0.0](https://github.com/adobe/helix-shared/compare/v0.11.0...v1.0.0) (2019-05-03)


### Features

* More tools for generic programming ([6c074a3](https://github.com/adobe/helix-shared/commit/6c074a3))
* Use underscore to mark unused variables ([a760881](https://github.com/adobe/helix-shared/commit/a760881))


### BREAKING CHANGES

* Because sequence.js was growing very large,
that file was split up into multiple components.

The real highlights of this change are:
- The Trait class
- The Equals trait
- The cloning traits

feat(types): Trait – New class to facilitate generic programming. Quite complex. See it's api doc.
feat(types): Immutable – New trait to mark types as immutable
feat(types): Equals, eq(), assertEq() – New Trait for equality comparing values in an extensible way
feat(types): Shallowclone – Trait for shallow cloning values
feat(types): Deepclone – Trait for recursively cloning values
feat(types): Pairs, keys(), values() – Trait for iterating over any container as a key/value store
feat(types): Has, Get, Assign, Delete, Setdefault, Replace – Generic traits for accessing containers
feat(sequence): seqEq() function to compare sequences
feat(sequence): The Into trait now Supports typed Arrays, WeakMap and WeakSet
feat(sequence): The Sequence and Size Trait now supports typed arrays
feat(dom): Dom Nodes now implement the Equals Trait
feat(dom): Dom Nodes now implement the Deepclone Trait

# [0.11.0](https://github.com/adobe/helix-shared/compare/v0.10.5...v0.11.0) (2019-05-02)


### Features

* **proxystrains:** add support for `path` and `override_host` configuration parameters ([d0c8693](https://github.com/adobe/helix-shared/commit/d0c8693))

## [0.10.5](https://github.com/adobe/helix-shared/compare/v0.10.4...v0.10.5) (2019-04-29)


### Bug Fixes

* **dom:** normalize className attributes before comparison ([0e0fbff](https://github.com/adobe/helix-shared/commit/0e0fbff)), closes [#98](https://github.com/adobe/helix-shared/issues/98)

## [0.10.4](https://github.com/adobe/helix-shared/compare/v0.10.3...v0.10.4) (2019-04-25)


### Bug Fixes

* **conditions:** restrict conditions schema ([55e506c](https://github.com/adobe/helix-shared/commit/55e506c)), closes [#95](https://github.com/adobe/helix-shared/issues/95) [#96](https://github.com/adobe/helix-shared/issues/96)

## [0.10.3](https://github.com/adobe/helix-shared/compare/v0.10.2...v0.10.3) (2019-04-11)


### Bug Fixes

* **yaml:** Avoid deprecation warnings from yaml ([#89](https://github.com/adobe/helix-shared/issues/89)) ([1374cfe](https://github.com/adobe/helix-shared/commit/1374cfe)), closes [#88](https://github.com/adobe/helix-shared/issues/88)

## [0.10.2](https://github.com/adobe/helix-shared/compare/v0.10.1...v0.10.2) (2019-04-10)


### Bug Fixes

* **package:** update yaml to version 1.5.0 ([bf42d94](https://github.com/adobe/helix-shared/commit/bf42d94))

## [0.10.1](https://github.com/adobe/helix-shared/compare/v0.10.0...v0.10.1) (2019-04-10)


### Bug Fixes

* **config:** Ensure default ref is added to string giturls ([#87](https://github.com/adobe/helix-shared/issues/87)) ([30d9cc3](https://github.com/adobe/helix-shared/commit/30d9cc3)), closes [#86](https://github.com/adobe/helix-shared/issues/86)

# [0.10.0](https://github.com/adobe/helix-shared/compare/v0.9.0...v0.10.0) (2019-03-27)


### Features

* Helpers for implementing improved frontmatter in helix-pipe ([d5544d5](https://github.com/adobe/helix-shared/commit/d5544d5))
* Improve sequence.js dealing with null values ([f79fa59](https://github.com/adobe/helix-shared/commit/f79fa59))

# [0.9.0](https://github.com/adobe/helix-shared/compare/v0.8.4...v0.9.0) (2019-03-27)


### Features

* **configuration:** Strains can be and should be specified as an ordered list ([38b5e9d](https://github.com/adobe/helix-shared/commit/38b5e9d)), closes [#71](https://github.com/adobe/helix-shared/issues/71)

## [0.8.4](https://github.com/adobe/helix-shared/compare/v0.8.3...v0.8.4) (2019-03-23)


### Bug Fixes

* **config:** Add missing performance threshold properties ([a90a489](https://github.com/adobe/helix-shared/commit/a90a489)), closes [#65](https://github.com/adobe/helix-shared/issues/65)

## [0.8.3](https://github.com/adobe/helix-shared/compare/v0.8.2...v0.8.3) (2019-03-22)


### Bug Fixes

* **schema:** Add schema for missing performance metrics ([8af463d](https://github.com/adobe/helix-shared/commit/8af463d))

## [0.8.2](https://github.com/adobe/helix-shared/compare/v0.8.1...v0.8.2) (2019-03-20)


### Bug Fixes

* **release:** semantic-release should update package.json ([d8831e2](https://github.com/adobe/helix-shared/commit/d8831e2)), closes [#67](https://github.com/adobe/helix-shared/issues/67)

## [0.8.1](https://github.com/adobe/helix-shared/compare/v0.8.0...v0.8.1) (2019-03-11)


### Bug Fixes

* **config:** Use latest yaml parser to fix bug with comments ([#64](https://github.com/adobe/helix-shared/issues/64)) ([2728234](https://github.com/adobe/helix-shared/commit/2728234)), closes [#55](https://github.com/adobe/helix-shared/issues/55)

# [0.8.0](https://github.com/adobe/helix-shared/compare/v0.7.0...v0.8.0) (2019-03-06)


### Features

* **testing:** Introduce Fuzzy DOM Matching and Sequence Library ([95cfaae](https://github.com/adobe/helix-shared/commit/95cfaae)), closes [#53](https://github.com/adobe/helix-shared/issues/53)
