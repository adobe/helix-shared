# Helix Shared

> Shared libraries for Project Helix.

## Status

[![NPM Version](https://img.shields.io/npm/v/@adobe/helix-shared.svg)](https://www.npmjs.com/package/@adobe/helix-shared)
[![codecov](https://img.shields.io/codecov/c/github/adobe/helix-shared.svg)](https://codecov.io/gh/adobe/helix-shared)
[![CircleCI](https://img.shields.io/circleci/project/github/adobe/helix-shared.svg)](https://circleci.com/gh/adobe/helix-shared)
[![GitHub license](https://img.shields.io/github/license/adobe/helix-shared.svg)](https://github.com/adobe/helix-shared/blob/master/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/helix-shared.svg)](https://github.com/adobe/helix-shared/issues)
[![LGTM Code Quality Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/adobe/helix-shared.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/adobe/helix-shared) [![Greenkeeper badge](https://badges.greenkeeper.io/adobe/helix-shared.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/adobe/helix-shared/badge.svg?targetFile=package.json)](https://snyk.io/test/github/adobe/helix-shared?targetFile=package.json)

## Usage

* [API Documentation](docs/API.md)
* [Configuration File Schema](docs/README.md)

### Using `HelixConfig` to read Helix configuration files

Helix is using YAML files for configuration management, but with the `HelixConfig` class, exported from `@adobe/helix-shared`, you can read, validate, and access configuration files with ease:

```javascript
const { HelixConfig } = require('@adobe/helix-shared');

// in an async function
const configfromyaml = new HelixConfig()
  .withSource(yamlstring)
  .init();

const configfromjson = new HelixConfig()
  .withJSON(jsonobject)
  .init();

const configfromfile = new HelixConfig()
  .withDirectory('/path/to/dir') // the directory contains a `helix-config.yaml`
  .init();
```

### Using `sequence`, `functional`, and `op` for functional programming


## Development


### Build

```bash
npm install
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```
