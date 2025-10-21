# Helix Shared - config

The config package provides a set of configuration classes for managing various Helix project configurations. These classes handle loading, validating, and managing YAML-based configuration files from local directories or remote GitHub repositories.

## Installation

```bash
npm install @adobe/helix-shared-config
```

## Usage

### IndexConfig - Managing Search Indices

The `IndexConfig` class manages search index configurations for content discovery and querying.

```js
import { IndexConfig } from '@adobe/helix-shared-config';

// Load from local file
const config = await new IndexConfig()
  .withConfigPath('/path/to/helix-query.yaml')
  .init();

// Load from GitHub repository
const config = await new IndexConfig()
  .withRepo('owner', 'repo', 'ref')
  .init();

// Access index configuration
const indices = config.toJSON().indices;

// Get a specific query
const query = config.getQuery('my-index', 'my-query');

// Get query cache timeout
const cacheTimeout = config.getQueryCache('my-index', 'my-query');

// Generate query URL with parameters
const queryUrl = config.getQueryURL('my-index', 'my-query', 'owner', 'repo', {
  page: '1',
  filter: 'value'
});
```

### MountConfig - Managing Mount Points

The `MountConfig` class manages mount point configurations that map paths to external content sources like OneDrive, Google Drive, or GitHub.

```js
import { MountConfig } from '@adobe/helix-shared-config';

// Load mount configuration
const config = await new MountConfig()
  .withRepo('owner', 'repo', 'ref')
  .init();

// Match a resource path to a mount point
const mountPoint = config.match('/docs/guide');

if (mountPoint) {
  console.log(mountPoint.type);    // 'onedrive', 'google', or 'github'
  console.log(mountPoint.url);     // Source URL
  console.log(mountPoint.relPath); // Relative path from mount point
}
```

Supported mount point types:
- **OneDrive/SharePoint**: `https://*.sharepoint.com/...` or `onedrive:` URLs
- **Google Drive**: `https://drive.google.com/...` or `gdrive:` URLs
- **GitHub**: `https://github.com/owner/repo/tree/ref/path` URLs

### SitemapConfig - Managing Sitemaps

The `SitemapConfig` class manages sitemap configurations for SEO and content discovery.

```js
import { SitemapConfig } from '@adobe/helix-shared-config';

// Load sitemap configuration
const config = await new SitemapConfig()
  .withRepo('owner', 'repo', 'ref')
  .init();

// Add a new sitemap
const sitemap = config.addSitemap({
  name: 'main',
  origin: 'https://example.com',
  source: '/content',
  destination: '/sitemap.xml',
  lastmod: 'YYYY-MM-DD'
});

// Add language variants
config.addLanguage('main', {
  name: 'en',
  source: '/en',
  destination: '/en/sitemap.xml',
  hreflang: 'en-US',
  alternate: 'https://example.com/en'
});

// Update sitemap origin
config.setOrigin('main', 'https://www.example.com');
```

### IgnoreConfig - Managing Ignore Patterns

The `IgnoreConfig` class manages ignore patterns similar to `.gitignore`.

```js
import { IgnoreConfig } from '@adobe/helix-shared-config';

// Load ignore configuration
const config = await new IgnoreConfig()
  .withDirectory('/path/to/project')
  .init();

// Check if a path is ignored
const isIgnored = config.ignores('/node_modules/package');
```

### ModifiersConfig - Managing Metadata Modifiers

The `ModifiersConfig` class manages metadata and header modifiers based on URL patterns.

```js
import { ModifiersConfig } from '@adobe/helix-shared-config/modifiers';

// Parse from a sheet-like structure
const sheet = [
  { url: '/*', key: 'Cache-Control', value: 'max-age=3600' },
  { url: '/blog/*', Title: 'Blog', Description: 'Our blog' },
  { url: '/docs/**', key: 'X-Robots-Tag', value: 'noindex' }
];

const config = ModifiersConfig.fromModifierSheet(sheet);

// Get modifiers for a specific path
const modifiers = config.getModifiers('/blog/post-1');
// Returns: { 'cache-control': 'max-age=3600', 'title': 'Blog', 'description': 'Our blog' }
```

### Config Wrappers for Serverless Functions

Use `requiredConfig` or `optionalConfig` to automatically load configurations in serverless functions.

```js
import { requiredConfig, optionalConfig } from '@adobe/helix-shared-config';

// Function that requires configuration
async function handler(request, context) {
  // Configuration available in context.config
  const { fstab, index } = context.config;

  const mountPoint = fstab.match(request.url);
  // ... process request
}

// Wrap with required config - returns 400 if config is missing
export const main = requiredConfig(handler, 'fstab', 'index');

// Or use optional config - continues without config if missing
export const main = optionalConfig(handler, 'fstab', 'index');
```

The wrappers automatically extract `owner`, `repo`, and `ref` from the request parameters and load the specified configurations.

## Configuration Options

All configuration classes extend `BaseConfig` and support the following options:

### Loading Configuration

```js
const config = await new IndexConfig()
  .withDirectory('/path/to/dir')           // Set working directory
  .withConfigPath('/path/to/config.yaml') // Set explicit config file path
  .withSource('yaml: content')            // Provide YAML source directly
  .withJSON({ key: 'value' })            // Provide parsed JSON directly
  .withLogger(logger)                     // Set custom logger
  .init();
```

### Loading from GitHub

```js
const config = await new IndexConfig()
  .withRepo('owner', 'repo', 'ref', {
    headers: {
      authorization: 'token ghp_...'
    }
  })
  .withTransactionID('request-id-123')
  .init();
```

### Caching

```js
const config = await new IndexConfig()
  .withCache({ max: 100 })  // Set cache size (max entries)
  .withRepo('owner', 'repo', 'ref')
  .init();
```

### Validation

```js
// Check for parsing errors
const errors = config.getErrors();
if (errors.length > 0) {
  console.error('Configuration errors:', errors);
}
```

## Configuration File Formats

### helix-query.yaml (IndexConfig)

```yaml
version: 1
indices:
  my-index:
    include:
      - /content/**
    exclude:
      - /content/drafts/**
    target: https://example.algolia.net
    properties:
      title:
        select: head > meta[property="og:title"]
        value: attribute(el, 'content')
      description:
        select: head > meta[name="description"]
        value: attribute(el, 'content')
    queries:
      search:
        query: '{search}'
        parameters:
          - search
        hitsPerPage: 10
        cache: 600
```

### fstab.yaml (MountConfig)

```yaml
mountpoints:
  /: https://adobe.sharepoint.com/sites/example/Shared%20Documents/root
  /docs: https://github.com/owner/repo/tree/main/documentation
  /assets: https://drive.google.com/drive/folders/abc123def456
```

### helix-sitemap.yaml (SitemapConfig)

```yaml
version: 1
sitemaps:
  website:
    origin: https://www.example.com
    source: /content
    destination: /sitemap.xml
    lastmod: YYYY-MM-DD
    languages:
      en:
        source: /en
        destination: /en/sitemap.xml
        hreflang: en-US
        alternate: https://www.example.com/en
```

### .hlxignore (IgnoreConfig)

```
# Ignore patterns (glob format)
node_modules/
*.tmp
.git/
.DS_Store
```

## Advanced Usage

### Adding/Modifying Index Definitions

```js
const config = await new IndexConfig().init();

// Add a new index
config.addIndex({
  name: 'blog',
  include: ['/blog/**'],
  exclude: ['/blog/drafts/**'],
  target: 'https://example.algolia.net',
  properties: {
    title: { select: 'h1', value: 'textContent(el)' }
  }
});

// Replace an existing index
config.replaceIndex({
  name: 'blog',
  include: ['/blog/**', '/news/**'],
  exclude: [],
  target: 'https://example.algolia.net',
  properties: {}
});

// Remove an index
config.removeIndex({ name: 'blog' });

// Save changes
await config.saveConfig();
```

### Working with Configuration Sources

```js
// Export to YAML
const yamlString = config.toYAML();

// Export to JSON
const jsonObject = config.toJSON();

// Get raw source
const source = config.source;

// Get version
const version = config.version;
```

## Error Handling

Configuration classes include robust error handling:

```js
try {
  const config = await new IndexConfig()
    .withRepo('owner', 'repo', 'ref')
    .init();

  const errors = config.getErrors();
  if (errors.length > 0) {
    // Handle YAML parsing errors
    errors.forEach(error => console.error(error.message));
  }
} catch (e) {
  // Handle loading errors
  console.error('Failed to load configuration:', e);
}
```

## License

Apache-2.0
