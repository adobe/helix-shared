# Helix Shared - Utils

A collection of utility functions for Helix Project applications, providing common functionality for HTTP status code handling, header sanitization, and cryptographic operations.

## Features

### Backend Response Mapping

The utils package provides standardized functions to handle backend HTTP responses in gateway/proxy scenarios. These utilities help you propagate status codes correctly and use appropriate log levels.

```js
import { propagateStatusCode, logLevelForStatusCode } from '@adobe/helix-shared-utils';

// When proxying a backend response, translate the status code appropriately
const backendStatus = 500; // Internal Server Error from backend
const gatewayStatus = propagateStatusCode(backendStatus); // Returns 502 (Bad Gateway)

// Log backend responses at the appropriate level
const backendStatus = 429; // Too Many Requests from backend
const level = logLevelForStatusCode(backendStatus); // Returns 'error'
logger[level](`Backend returned ${backendStatus}`);
```

The status code mapping follows these rules:
- **2xx and 3xx responses**: Passed through unchanged, logged at `verbose` level
- **404 responses**: Passed through unchanged, logged at `info` level
- **429 responses**: Mapped to `503` (Service Unavailable), logged at `error` level
- **Other 4xx responses**: Passed through unchanged, logged at `warn` level
- **500 responses**: Mapped to `502` (Bad Gateway), logged at `error` level
- **Other 5xx responses**: Passed through unchanged, logged at `error` level

### Header Value Sanitization

Clean up header values by removing invalid characters and enforcing length limits.

```js
import { cleanupHeaderValue } from '@adobe/helix-shared-utils';

// Remove invalid characters (non-ASCII, control characters)
const dirty = 'Error invoking: 어도비코리아.md';
const clean = cleanupHeaderValue(dirty);
// Returns: 'Error invoking: .md'

// Truncate long values to 1024 characters
const longValue = 'a'.repeat(2000);
const truncated = cleanupHeaderValue(longValue);
// Returns: a string of exactly 1024 characters
```

The function strips any characters outside the valid HTTP header value range (TAB, space through DEL, and extended ASCII) and truncates values to a maximum of 1024 characters.

### Surrogate Key Computation

Compute Fastly-compatible surrogate keys for cache invalidation using HMAC-SHA256.

```js
import { computeSurrogateKey } from '@adobe/helix-shared-utils';

// Compute a surrogate key for a URL
const key = await computeSurrogateKey('https://example.com/page');
// Returns: 'LryzWp9TSqzkYkz6' (16 character base64url string)

// Works with any string input
const key = await computeSurrogateKey('my-cache-key');
// Returns: consistent, deterministic hash
```

The algorithm uses HMAC-SHA256 with the key `"helix"`, producing a base64url-encoded result truncated to 16 characters. This is compatible with Fastly's VCL implementation:

```vcl
declare local var.key STRING;
set var.key = digest.hmac_sha256_base64("helix", "input");
set var.key = regsub(var.key, "(.{16}).*", "\1");
```

The function works across environments:
- Node.js >= v15: Uses WebCrypto API
- Browsers and Service Workers: Uses WebCrypto API
- Legacy Node.js < v15: Falls back to crypto module

### Content Bus ID Hashing

Generate SHA-256 digests for Content Bus identifiers.

```js
import { hashContentBusId } from '@adobe/helix-shared-utils';

// Create a hash for a content identifier
const hash = await hashContentBusId('user@domain.com/repo/path');
// Returns: SHA-256 digest as hex string, truncated to 59 characters
```

This function provides consistent hashing across Node.js and browser environments, automatically selecting the appropriate crypto implementation.

## Cross-Platform Crypto Support

The utils package includes platform-specific crypto implementations that are automatically selected based on the runtime environment:

- **Node.js**: Uses the native `crypto` module
- **Browsers/Workers**: Uses the Web Crypto API

This is handled transparently through package.json imports mapping:

```json
"imports": {
  "#crypto": {
    "node": "./src/crypto.node.js",
    "browser": "./src/crypto.worker.js",
    "worker": "./src/crypto.worker.js"
  }
}
```

## Installation

```bash
npm install @adobe/helix-shared-utils
```

## Requirements

- Node.js >= 14.18
- Supports ES modules (type: "module")
