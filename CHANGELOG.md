## [7.3.1](https://github.com/adobe/helix-shared/compare/v7.3.0...v7.3.1) (2020-05-14)


### Bug Fixes

* **fstab:** relax fstab to allow for empty configurations ([9947afc](https://github.com/adobe/helix-shared/commit/9947afc2f230f6c4601459f67b400e573081932f))

# [7.3.0](https://github.com/adobe/helix-shared/compare/v7.2.1...v7.3.0) (2020-05-07)


### Features

* **utils:** Add utils for dealing with HTTP status codes in backend responses ([6697a0d](https://github.com/adobe/helix-shared/commit/6697a0d3c926a346962a468cf7615917c7b106fe))

## [7.2.1](https://github.com/adobe/helix-shared/compare/v7.2.0...v7.2.1) (2020-04-27)


### Bug Fixes

* **proxy:** use non-deprecated backend for proxy strains ([f2a0522](https://github.com/adobe/helix-shared/commit/f2a0522c66c17d74d56f6d3d152e2b0850283a80)), closes [#285](https://github.com/adobe/helix-shared/issues/285)

# [7.2.0](https://github.com/adobe/helix-shared/compare/v7.1.0...v7.2.0) (2020-04-24)


### Features

* **redirects:** add RedirectConfig class for loading and parsing of redirect config ([eabc2d9](https://github.com/adobe/helix-shared/commit/eabc2d9018a94e94807f4c33b1bf55c3abce927d)), closes [#282](https://github.com/adobe/helix-shared/issues/282)
* **redirects:** provide redirects handler that can list redirect rules as appropriate classes ([de36f38](https://github.com/adobe/helix-shared/commit/de36f382c9d860c28a55239bcd41a5f019f47616)), closes [#282](https://github.com/adobe/helix-shared/issues/282)
* **schema:** define schema for redirects and vanity url extraction ([f2b7f2d](https://github.com/adobe/helix-shared/commit/f2b7f2d72107d20e554a0f350ece0a8a14ea38b1)), closes [#282](https://github.com/adobe/helix-shared/issues/282)

# [7.1.0](https://github.com/adobe/helix-shared/compare/v7.0.1...v7.1.0) (2020-04-22)


### Bug Fixes

* **deps:** npm audit fix ([f6c28f5](https://github.com/adobe/helix-shared/commit/f6c28f5d7d474c01421e8c501fe2550e4b770409))
* **markup:** relax markup mapping schema ([fd62ae0](https://github.com/adobe/helix-shared/commit/fd62ae0689932e469f1e8e0d9eaf4cd45b938f41))


### Features

* **markup:** add support for content intelligence matching expressions ([16a0916](https://github.com/adobe/helix-shared/commit/16a0916f1e2062528271b34bebd51b212bca863a)), closes [#278](https://github.com/adobe/helix-shared/issues/278)
* **markup:** add URL matching type ([1902279](https://github.com/adobe/helix-shared/commit/19022790a8ea7eb333f126ab8d4434868ee7c49b)), closes [#279](https://github.com/adobe/helix-shared/issues/279)

## [7.0.1](https://github.com/adobe/helix-shared/compare/v7.0.0...v7.0.1) (2020-04-15)


### Bug Fixes

* **condition:** prefix match fails if already contains trailing slash ([#275](https://github.com/adobe/helix-shared/issues/275)) ([c2fff9a](https://github.com/adobe/helix-shared/commit/c2fff9a9eb8feff484db3fb6f1c7a0af82aaebd8))

# [7.0.0](https://github.com/adobe/helix-shared/compare/v6.0.5...v7.0.0) (2020-04-14)


### Bug Fixes

* **strain:** remove url property ([#271](https://github.com/adobe/helix-shared/issues/271)) ([527e396](https://github.com/adobe/helix-shared/commit/527e39624fe7fb00c1237598a92df22806e3f3b4))


### BREAKING CHANGES

* **strain:** url property removed from strain, use condition instead

Co-authored-by: Lars Trieloff <lars@trieloff.net>

## [6.0.5](https://github.com/adobe/helix-shared/compare/v6.0.4...v6.0.5) (2020-03-23)


### Bug Fixes

* **deps:** update dependency fs-extra to v9 ([7813516](https://github.com/adobe/helix-shared/commit/78135169acf1dc1dac69815c1f77ad0bf46acccd))

## [6.0.4](https://github.com/adobe/helix-shared/compare/v6.0.3...v6.0.4) (2020-03-17)


### Bug Fixes

* **deps:** update dependency yaml to v1.8.2 ([#263](https://github.com/adobe/helix-shared/issues/263)) ([7e1d879](https://github.com/adobe/helix-shared/commit/7e1d879a32afb400647c3d416f5b94bbbf22cf8d))

## [6.0.3](https://github.com/adobe/helix-shared/compare/v6.0.2...v6.0.3) (2020-03-09)


### Bug Fixes

* **deps:** update dependency yaml to v1.8.0 ([c65cee7](https://github.com/adobe/helix-shared/commit/c65cee77330bb0d997b651d3edea9dfff802333f))

## [6.0.2](https://github.com/adobe/helix-shared/compare/v6.0.1...v6.0.2) (2020-03-03)


### Bug Fixes

* **markup:** add name property to markup config schema ([e371416](https://github.com/adobe/helix-shared/commit/e371416e7545378b3fa24577f555ffd264ce345d)), closes [#248](https://github.com/adobe/helix-shared/issues/248)

## [6.0.1](https://github.com/adobe/helix-shared/compare/v6.0.0...v6.0.1) (2020-03-02)


### Bug Fixes

* **schema:** ensure the schemas are 'required()' ([d89bcff](https://github.com/adobe/helix-shared/commit/d89bcff5663e6b7c24db6bb7f926aade64405a04)), closes [#257](https://github.com/adobe/helix-shared/issues/257)

# [6.0.0](https://github.com/adobe/helix-shared/compare/v5.3.1...v6.0.0) (2020-02-28)


### Documentation

* **changelog:** mark 5.3.1 as a breaking change ([b556e6e](https://github.com/adobe/helix-shared/commit/b556e6e8149ce6e2d0c648a01a7c3d300d402b21)), closes [#256](https://github.com/adobe/helix-shared/issues/256) [#253](https://github.com/adobe/helix-shared/issues/253) [#254](https://github.com/adobe/helix-shared/issues/254)


### BREAKING CHANGES

* **changelog:** The 5.3.1 release introduces breaking changes for conditions handling. This commit formally acknowledges that.

## [5.3.1](https://github.com/adobe/helix-shared/compare/v5.3.0...v5.3.1) (2020-02-28)

**This is a breaking change**: the generated conditions change. Due to a mistake in the release process, no major version increase has been made.

### Bug Fixes

* **conditions:** changes required for integration with simulator ([2556169](https://github.com/adobe/helix-shared/commit/2556169801cfacea3f879b0cbeda308878adbb2e))
* **conditions:** relax stickyness rules ([90cfe49](https://github.com/adobe/helix-shared/commit/90cfe49c17702da202cf74f4f837a8631a79c6f9))
* **conditions:** use url.parse directly ([8a9bbe0](https://github.com/adobe/helix-shared/commit/8a9bbe057bc796c2aaa0d71f32dba99a94db79d9))
* **conditions:** use X-FullDirname ([05a639e](https://github.com/adobe/helix-shared/commit/05a639e79985f0a100dd5f94d7b72f0d057befa7))
* extra commit to add breaking change ([8cc054e](https://github.com/adobe/helix-shared/commit/8cc054e4b19cd43feb89558ae857d2c835330a07))
* trigger check reruns ([18ca7e1](https://github.com/adobe/helix-shared/commit/18ca7e15454c675e77785fee9686c0246e213d92))

# [5.3.0](https://github.com/adobe/helix-shared/compare/v5.2.2...v5.3.0) (2020-02-26)


### Features

* **fstab:** Improve mount config ([f423750](https://github.com/adobe/helix-shared/commit/f42375007a774aa41b27800c0af2be7a64821ee4))

## [5.2.2](https://github.com/adobe/helix-shared/compare/v5.2.1...v5.2.2) (2020-02-24)


### Bug Fixes

* **deps:** update dependency uuid to v7 ([ac0a11e](https://github.com/adobe/helix-shared/commit/ac0a11e9292310457063c906498f25e86e483558))

## [5.2.1](https://github.com/adobe/helix-shared/compare/v5.2.0...v5.2.1) (2020-02-14)


### Bug Fixes

* **config:** guard against broken config (fixes [#242](https://github.com/adobe/helix-shared/issues/242)) ([f221102](https://github.com/adobe/helix-shared/commit/f221102ed03cc3be1a4f2e4baa8ffd7ddb4e276a))
* **index:** guard against empty config (fixes [#241](https://github.com/adobe/helix-shared/issues/241)) ([fc733cb](https://github.com/adobe/helix-shared/commit/fc733cbc28c7610519c1a9a6a31a2321d2509f35))
* **query:** better defaults for query and pages ([04da304](https://github.com/adobe/helix-shared/commit/04da304f92dc5ae358b4b97ab9d98b8c087a07ba)), closes [#243](https://github.com/adobe/helix-shared/issues/243)

# [5.2.0](https://github.com/adobe/helix-shared/compare/v5.1.0...v5.2.0) (2020-02-12)


### Bug Fixes

* **query:** fix `getQueryURL` and `getQueryCache` methods ([6e10e08](https://github.com/adobe/helix-shared/commit/6e10e0806986ef2151affb2279a5f18dc8e84fdb))
* **query:** fix method name in tests ([12df2cc](https://github.com/adobe/helix-shared/commit/12df2cc6dbccc2408596e290eada8ecf5db71c29)), closes [#239](https://github.com/adobe/helix-shared/issues/239)


### Features

* **query:** add (wip) method for resolving query URL ([9ec6518](https://github.com/adobe/helix-shared/commit/9ec6518c4cc93de5c2117badc95bb7c830f2f3a0))

# [5.1.0](https://github.com/adobe/helix-shared/compare/v5.0.2...v5.1.0) (2020-01-23)


### Features

* **condition:** allow toVCLPath to be passed a function ([#229](https://github.com/adobe/helix-shared/issues/229)) ([ac54757](https://github.com/adobe/helix-shared/commit/ac54757c712482ef2e39c003d54978608800f465))

## [5.0.2](https://github.com/adobe/helix-shared/compare/v5.0.1...v5.0.2) (2020-01-23)


### Bug Fixes

* **condition:** toVCLPath should not return ([#228](https://github.com/adobe/helix-shared/issues/228)) ([23cb3de](https://github.com/adobe/helix-shared/commit/23cb3de063dee01cfc9d8c6599082487a89e5d62))

## [5.0.1](https://github.com/adobe/helix-shared/compare/v5.0.0...v5.0.1) (2020-01-23)


### Bug Fixes

* **index:** increase compatibility with index config consumers ([28e9df6](https://github.com/adobe/helix-shared/commit/28e9df68b8c83abd2a414e00d8a83fd5ddbc5204))

# [5.0.0](https://github.com/adobe/helix-shared/compare/v4.0.1...v5.0.0) (2020-01-16)


### Features

* **log:** remove logger support ([#211](https://github.com/adobe/helix-shared/issues/211)) ([972e49f](https://github.com/adobe/helix-shared/commit/972e49fc0a35e6a7d649da24667e973eb47a9e83))


### BREAKING CHANGES

* **log:** Logger and log is no longer exported by this project. use helix-log directly.

## [4.0.1](https://github.com/adobe/helix-shared/compare/v4.0.0...v4.0.1) (2020-01-15)


### Bug Fixes

* **index:** guard against empty index config ([ebbe6a0](https://github.com/adobe/helix-shared/commit/ebbe6a0ac4f09da765d45d048910ac12c15f5d41))

# [4.0.0](https://github.com/adobe/helix-shared/compare/v3.3.0...v4.0.0) (2020-01-14)


### Features

* **schema:** add support for multi-value properties ([fdb643c](https://github.com/adobe/helix-shared/commit/fdb643ca497a9b7e44bc098d46708a518202283b)), closes [#212](https://github.com/adobe/helix-shared/issues/212)


### BREAKING CHANGES

* **schema:** this is applying @tripodsan's changes from https://github.com/adobe/helix-index-pipelines/pull/38 to the Index Config schema. In particular it requires each property to have either one `value` or one `values` properties, but neve both. As this changes the behavior of `value`, it is a breaking change.

# [3.3.0](https://github.com/adobe/helix-shared/compare/v3.2.0...v3.3.0) (2019-12-20)


### Bug Fixes

* **config:** fix tests for optional strains list ([c1617a6](https://github.com/adobe/helix-shared/commit/c1617a6c0b91cd723734bcd521fc4f3813ae3cab))
* update copyright ([a004174](https://github.com/adobe/helix-shared/commit/a004174f0fb94e8c32db44d2722098ad974c5f25))
* **config:** generalize error message for YAML with tabs ([3bc63b5](https://github.com/adobe/helix-shared/commit/3bc63b5de38c891f6ba093fd147aea50da6b590d))
* **markup:** change default to `html` ([eb3d314](https://github.com/adobe/helix-shared/commit/eb3d314d429796b87ca0c22f4b55862fb4c6a5ff)), closes [/github.com/adobe/helix-pipeline/issues/516#issuecomment-549650766](https://github.com//github.com/adobe/helix-pipeline/issues/516/issues/issuecomment-549650766)


### Features

* **markup:** coerce array properties into arrays ([8d91304](https://github.com/adobe/helix-shared/commit/8d9130447f4900acd401d7d7cad9f0d40b65a3d8))
* **markup:** coerce the default value for type ([7c3333c](https://github.com/adobe/helix-shared/commit/7c3333c19416d13f578b77fcb0e624f00e8a3092))
* **markup:** define schema for markup configurations ([a73bb42](https://github.com/adobe/helix-shared/commit/a73bb4236e5b2ceaf3800e8b254bd8c14695f539))
* **markup:** expose new `markup` config property in `HelixConfig` ([5cf1e0c](https://github.com/adobe/helix-shared/commit/5cf1e0c218433341a84cb241ca1bd9d638adf49e))
* **markup:** validate markup config independently from strains config ([c20eea3](https://github.com/adobe/helix-shared/commit/c20eea3934a2a50c677309136ca5fa3188a97471))

# [3.2.0](https://github.com/adobe/helix-shared/compare/v3.1.2...v3.2.0) (2019-12-20)


### Bug Fixes

* **config:** bring up test coverage ([61e0134](https://github.com/adobe/helix-shared/commit/61e01340bc5c0f8db0c747d910e7628c3e124540))
* **config:** fix (and test) default value coercion ([67511d0](https://github.com/adobe/helix-shared/commit/67511d0860c99239af601b5c70bc9dc397829f8f))
* **config:** make recusive access work in schema-derived config ([d267e40](https://github.com/adobe/helix-shared/commit/d267e40a6c0045b45bd0424cd8e5093819f0b4de))
* **schema:** fix query schema id ([2128767](https://github.com/adobe/helix-shared/commit/2128767e813a8d5ed4e445426a2f97cd6d79af46))
* **schema:** fix query schema id ([1d45c3d](https://github.com/adobe/helix-shared/commit/1d45c3d8e1cd607d392c3594cd05742d940d97a7))
* **validate:** use correct ajv instance ([4340d63](https://github.com/adobe/helix-shared/commit/4340d6398e547ee7827dfe93aea1f4e47ce632e0))


### Features

* **config:** add (basic) support for `fstab.yaml` ([e0c5516](https://github.com/adobe/helix-shared/commit/e0c5516dba28467d4391f67065e7420ae7219ff1)), closes [#190](https://github.com/adobe/helix-shared/issues/190)
* **config:** NamedMapProxy allows turning a JSON Schema into a config class ([e1744d7](https://github.com/adobe/helix-shared/commit/e1744d77c457fc8e5a5b1f99232666f14b1dd16f)), closes [#195](https://github.com/adobe/helix-shared/issues/195)
* **query:** add schemas and config class for index and query configs ([ece8df4](https://github.com/adobe/helix-shared/commit/ece8df4e0aa3eed2a19e8c41164e2fcdf67a991d)), closes [#190](https://github.com/adobe/helix-shared/issues/190)

## [3.1.2](https://github.com/adobe/helix-shared/compare/v3.1.1...v3.1.2) (2019-11-06)


### Bug Fixes

* **giturl:** use githubusercontent for raw url ([#194](https://github.com/adobe/helix-shared/issues/194)) ([01da4b1](https://github.com/adobe/helix-shared/commit/01da4b1c222cdcc1cfe27226b20603c3ad85e2c6)), closes [#193](https://github.com/adobe/helix-shared/issues/193)

## [3.1.1](https://github.com/adobe/helix-shared/compare/v3.1.0...v3.1.1) (2019-10-29)


### Bug Fixes

* **ci:** use NPM_TOKEN env var for semantic-release ([545d9e3](https://github.com/adobe/helix-shared/commit/545d9e358a326a1fe16e8b76d509729154cbe708))

# [3.1.0](https://github.com/adobe/helix-shared/compare/v3.0.4...v3.1.0) (2019-10-21)


### Features

* **strain:** add url deprecation example ([f7dd2ee](https://github.com/adobe/helix-shared/commit/f7dd2ee2f2310b03df994a92fb59b8da420aaec7))

## [3.0.4](https://github.com/adobe/helix-shared/compare/v3.0.3...v3.0.4) (2019-10-16)


### Bug Fixes

* **package:** update snyk to the version 1.235.0. ([#182](https://github.com/adobe/helix-shared/issues/182)) ([311b8b3](https://github.com/adobe/helix-shared/commit/311b8b3))

## [3.0.3](https://github.com/adobe/helix-shared/compare/v3.0.2...v3.0.3) (2019-10-08)


### Bug Fixes

* **package:** update ferrum to version 1.4.1 ([9d7eedd](https://github.com/adobe/helix-shared/commit/9d7eedd))

## [3.0.2](https://github.com/adobe/helix-shared/compare/v3.0.1...v3.0.2) (2019-10-07)


### Bug Fixes

* **package:** update yaml to version 1.7.1 ([5d70d56](https://github.com/adobe/helix-shared/commit/5d70d56))

## [3.0.1](https://github.com/adobe/helix-shared/compare/v3.0.0...v3.0.1) (2019-10-01)


### Bug Fixes

* Deprecation warnings should be shown just once per run ([#159](https://github.com/adobe/helix-shared/issues/159)) ([3f21b52](https://github.com/adobe/helix-shared/commit/3f21b52))

# [3.0.0](https://github.com/adobe/helix-shared/compare/v2.3.0...v3.0.0) (2019-09-05)


### Bug Fixes

* 🐛 Bump version number because of incompatible change ([2c4a45b](https://github.com/adobe/helix-shared/commit/2c4a45b))


### BREAKING CHANGES

* Strain.condition is no longer a string but an object

# [2.3.0](https://github.com/adobe/helix-shared/compare/v2.2.1...v2.3.0) (2019-09-03)


### Features

* Conditions should be serialisable to JSON ([#148](https://github.com/adobe/helix-shared/issues/148)) ([5d7efc4](https://github.com/adobe/helix-shared/commit/5d7efc4))

## [2.2.1](https://github.com/adobe/helix-shared/compare/v2.2.0...v2.2.1) (2019-09-02)


### Bug Fixes

* Deprecate url in the strain schema ([3afd2b0](https://github.com/adobe/helix-shared/commit/3afd2b0))
* Deprecate url in the strain schema ([fa77a57](https://github.com/adobe/helix-shared/commit/fa77a57))
* Deprecate url in the strain schema ([46fc995](https://github.com/adobe/helix-shared/commit/46fc995))
* **schemas:** use XDM meta:status for deprecation notice ([c62b019](https://github.com/adobe/helix-shared/commit/c62b019))

# [2.2.0](https://github.com/adobe/helix-shared/compare/v2.1.1...v2.2.0) (2019-08-27)


### Features

* Conditions should be serialisable to JSON ([ca66e11](https://github.com/adobe/helix-shared/commit/ca66e11))

## [2.1.1](https://github.com/adobe/helix-shared/compare/v2.1.0...v2.1.1) (2019-07-24)


### Bug Fixes

* **logger:** export Logger again to keep module backward compatible ([#138](https://github.com/adobe/helix-shared/issues/138)) ([697260a](https://github.com/adobe/helix-shared/commit/697260a))

# [2.1.0](https://github.com/adobe/helix-shared/compare/v2.0.0...v2.1.0) (2019-07-23)


### Features

* **logging:** Simplify the logger interface ([b1b4ac2](https://github.com/adobe/helix-shared/commit/b1b4ac2))

# [2.0.0](https://github.com/adobe/helix-shared/compare/v1.5.1...v2.0.0) (2019-07-16)


### Code Refactoring

* **ferrum:** Migrate to ferrum ([#132](https://github.com/adobe/helix-shared/issues/132)) ([cc64bb6](https://github.com/adobe/helix-shared/commit/cc64bb6)), closes [#124](https://github.com/adobe/helix-shared/issues/124)


### BREAKING CHANGES

* **ferrum:** the following modules are no longer exports: functional, op, types, sequence

## [1.5.1](https://github.com/adobe/helix-shared/compare/v1.5.0...v1.5.1) (2019-07-08)


### Bug Fixes

* .snyk, package.json & package-lock.json to reduce vulnerabilities ([078fea7](https://github.com/adobe/helix-shared/commit/078fea7))

# [1.5.0](https://github.com/adobe/helix-shared/compare/v1.4.0...v1.5.0) (2019-06-20)


### Features

* **utils:** Add function to calculate surrogate key ([d4aae86](https://github.com/adobe/helix-shared/commit/d4aae86)), closes [#123](https://github.com/adobe/helix-shared/issues/123)

# [1.4.0](https://github.com/adobe/helix-shared/compare/v1.3.2...v1.4.0) (2019-06-05)


### Features

* **conditions:** Support to calculate base-url ([ccc1d74](https://github.com/adobe/helix-shared/commit/ccc1d74)), closes [#110](https://github.com/adobe/helix-shared/issues/110)

## [1.3.2](https://github.com/adobe/helix-shared/compare/v1.3.1...v1.3.2) (2019-05-24)


### Bug Fixes

* **package:** update yaml to version 1.6.0 ([f2be95d](https://github.com/adobe/helix-shared/commit/f2be95d))

## [1.3.1](https://github.com/adobe/helix-shared/compare/v1.3.0...v1.3.1) (2019-05-13)


### Bug Fixes

* **package:** update fs-extra to version 8.0.0 ([27131bd](https://github.com/adobe/helix-shared/commit/27131bd))

# [1.3.0](https://github.com/adobe/helix-shared/compare/v1.2.0...v1.3.0) (2019-05-12)


### Features

* **strains:** Conditions Language ([b0c46c4](https://github.com/adobe/helix-shared/commit/b0c46c4)), closes [#20](https://github.com/adobe/helix-shared/issues/20)

# [1.2.0](https://github.com/adobe/helix-shared/compare/v1.1.1...v1.2.0) (2019-05-07)


### Features

* **config:** allow merging of configs using a user-defined resolver function ([d61ffa7](https://github.com/adobe/helix-shared/commit/d61ffa7))

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
