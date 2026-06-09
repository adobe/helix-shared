# Helix Shared - Git

The `GitUrl` class provides utilities for parsing, manipulating, and working with Git repository URLs across various formats including HTTP/HTTPS, SSH, and SCP-style URLs.

## Installation

```bash
npm install @adobe/helix-shared-git
```

## Usage

### Parsing Git URLs from Strings

The `GitUrl` class can parse standard Git URLs and extract repository information:

```js
import { GitUrl } from '@adobe/helix-shared-git';

// Parse a standard Git URL
const url = new GitUrl('https://github.com/adobe/helix-shared.git#main');

console.log(url.protocol);  // 'https'
console.log(url.hostname);  // 'github.com'
console.log(url.owner);     // 'adobe'
console.log(url.repo);      // 'helix-shared'
console.log(url.ref);       // 'main'
console.log(url.path);      // ''
```

### Creating Git URLs from Objects

You can also create a `GitUrl` from an object representation:

```js
const url = new GitUrl({
  owner: 'adobe',
  repo: 'helix-shared',
  ref: 'main',
  path: '/packages'
});

console.log(url.toString());
// 'https://github.com/adobe/helix-shared.git/packages#main'
```

### Working with Different Git URL Formats

The `GitUrl` class supports multiple Git URL formats:

```js
// Standard HTTPS URL
const httpsUrl = new GitUrl('https://github.com/adobe/helix-shared.git#main');

// SSH URL
const sshUrl = new GitUrl('ssh://git@github.com/adobe/helix-shared.git#main');

// SCP-style Git URL (commonly used with git clone)
const scpUrl = new GitUrl('git@github.com:adobe/helix-shared.git#main');

// Self-hosted Git server with custom port
const customUrl = new GitUrl('https://git.example.com:8080/company/repo.git#develop');
```

### Accessing Raw Content and API URLs

The `GitUrl` class provides convenient properties for accessing raw content and API endpoints:

```js
const url = new GitUrl('https://github.com/adobe/helix-shared.git#main');

// Get the raw content URL
console.log(url.raw);
// 'https://raw.githubusercontent.com/adobe/helix-shared/main'

// Get the raw content root URL
console.log(url.rawRoot);
// 'https://raw.githubusercontent.com'

// Get the API root URL
console.log(url.apiRoot);
// 'https://api.github.com'
```

### Using Defaults

You can provide default values that will be used if the URL doesn't specify certain properties:

```js
const url = new GitUrl('https://github.com/adobe/helix-shared.git', {
  ref: 'main',
  path: '/src'
});

console.log(url.ref);   // 'main'
console.log(url.path);  // '/src'
```

### Serialization and Deserialization

Convert `GitUrl` objects to and from JSON:

```js
const url = new GitUrl('https://github.com/adobe/helix-shared.git#main');

// Convert to JSON
const json = url.toJSON();
console.log(json);
// {
//   protocol: 'https',
//   host: 'github.com',
//   hostname: 'github.com',
//   port: '',
//   owner: 'adobe',
//   repo: 'helix-shared',
//   ref: 'main',
//   path: ''
// }

// Create from JSON
const urlFromJson = new GitUrl(json);
console.log(urlFromJson.toString());
// 'https://github.com/adobe/helix-shared.git#main'
```

### Minimal JSON Representation

For more compact serialization, use the `minimal` option:

```js
const url = new GitUrl({
  owner: 'adobe',
  repo: 'helix-shared',
  ref: 'main'
});

console.log(url.toJSON({ minimal: true }));
// { owner: 'adobe', repo: 'helix-shared', ref: 'main' }
```

### Comparing Git URLs

Compare two Git URLs while ignoring transport-level differences:

```js
const url1 = new GitUrl('https://github.com/adobe/helix-shared.git#main');
const url2 = new GitUrl('ssh://git@github.com/adobe/helix-shared.git#main');

console.log(url1.equalsIgnoreTransport(url2));  // true
```

### Working with Local Repositories

The `GitUrl` class has special handling for local repositories (specific to Helix):

```js
const localUrl = new GitUrl('https://localhost/local/default.git');

console.log(localUrl.isLocal);  // true
```

## API Reference

### Properties

- `protocol` - Transport protocol (e.g., 'https', 'ssh')
- `hostname` - Repository provider hostname (e.g., 'github.com')
- `host` - Repository provider host with port (e.g., 'github.com:443')
- `port` - Repository provider port
- `owner` - Repository owner
- `repo` - Repository name (without .git extension)
- `ref` - Repository reference, such as a branch or tag
- `path` - Resource path within the repository
- `raw` - Raw content URL for the repository
- `rawRoot` - Root URL for raw content
- `apiRoot` - Root URL for the API
- `isLocal` - Whether this is a local Helix repository

### Methods

- `toString()` - Returns the string representation of the Git URL
- `toJSON(options)` - Returns a plain object representation. Options:
  - `minimal`: Returns only non-default properties
  - `keepFormat`: Preserves the original format (string vs object)
- `toYAMLNode(doc, forceObject)` - Returns a YAML node representation
- `equalsIgnoreTransport(other)` - Compares URLs ignoring protocol and authentication

## URL Format

The expected Git URL format is:

```
<scheme>://<hostname>[:<port>]/<owner>/<repo>.git[/<path>][#ref]
```

For SCP-style URLs:

```
git@<hostname>:<owner>/<repo>.git[#ref]
```

### Required Components

- `owner` - The repository owner or organization
- `repo` - The repository name

### Optional Components

- `protocol` - Defaults to 'https'
- `hostname` - Defaults to 'github.com'
- `port` - Defaults to standard port for the protocol
- `path` - Resource path within the repository
- `ref` - Branch, tag, or commit reference. Defaults to 'master' in raw URLs

## Special Handling

### GitHub URLs

For GitHub URLs, the `raw` property automatically uses `raw.githubusercontent.com` instead of `raw.github.com`.

### IP Addresses

When the hostname is an IP address, the raw and API URLs are constructed differently:

```js
const url = new GitUrl('http://127.0.0.1:8080/company/repo.git');

console.log(url.raw);
// 'http://127.0.0.1:8080/raw/company/repo/master'
```

### SSH Protocol Conversion

URLs with SSH protocol automatically convert to HTTPS for raw and API URLs:

```js
const url = new GitUrl('ssh://git@github.com/adobe/helix-shared.git');

console.log(url.raw);
// 'https://raw.githubusercontent.com/adobe/helix-shared/master'
```
