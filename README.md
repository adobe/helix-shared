# Helix Shared

> Shared libraries for Project Helix.

## Status

[![NPM Version](https://img.shields.io/npm/v/@adobe/helix-shared.svg)](https://www.npmjs.com/package/@adobe/helix-shared)
[![codecov](https://img.shields.io/codecov/c/github/adobe/helix-shared.svg)](https://codecov.io/gh/adobe/helix-shared)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/adobe/helix-shared/main.yaml)
[![GitHub license](https://img.shields.io/github/license/adobe/helix-shared.svg)](https://github.com/adobe/helix-shared/blob/main/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/helix-shared.svg)](https://github.com/adobe/helix-shared/issues)
[![Known Vulnerabilities](https://snyk.io/test/github/adobe/helix-shared/badge.svg?targetFile=package.json)](https://snyk.io/test/github/adobe/helix-shared?targetFile=package.json)

## Helix Configuration Files

- [`helix-fstab.yaml`](./docs/fstab.md): maps paths to source URLs, use this to pull content from sources other than GitHub
- [`helix-config.yaml`](./docs/config.md): defines Strains (variants) of a Helix site, use this to create "environments", tests, or other variants
- [`helix-query.yaml`](./docs/indexconfig.md): define what can be indexed and queried in a Helix site
- [`helix-markup.yaml`](./docs/markup.md): define what Markdown should generate which HTML, use this to tweak the HTML output

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
