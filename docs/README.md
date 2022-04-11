# README

## Top-level Schemas

*   [FSTab (Mount Points)](./fstab.md "Defines a mapping between mount points and source URLs") – `https://ns.adobe.com/helix/shared/fstab`

*   [Index](./index.md) – `https://ns.adobe.com/helix/shared/index`

*   [Index Configuration](./indexconfig.md) – `https://ns.adobe.com/helix/shared/indexconfig`

*   [Mount Point](./mountpoint.md "Defines the target URL where content should be retrieved from") – `https://ns.adobe.com/helix/shared/mountpoint`

*   [Property](./property.md "Each property in the search index is made up of two parts:a select expression that selects nodes in the DOM or MDAST of the document to be indexeda value or values expression that specifies how to extract values from the selected nodes") – `https://ns.adobe.com/helix/shared/property`

*   [Query](./query.md "A named query that can be run against an index") – `https://ns.adobe.com/helix/shared/query`

*   [Sitemap](./sitemap.md "The sitemap configuration for a Project Helix website") – `https://ns.adobe.com/helix/shared/sitemap`

*   [Sitemap Configuration](./sitemapconfig.md) – `https://ns.adobe.com/helix/shared/sitemapconfig`

*   [Sitemap Language](./sitemap-language.md "The sitemap language configuration for a sitemap") – `https://ns.adobe.com/helix/shared/sitemap-language`

## Other Schemas

### Objects

*   [Folders](./fstab-properties-folders.md "Mapping from subtrees to single sources for catch-all folder support") – `https://ns.adobe.com/helix/shared/fstab#/properties/folders`

*   [Multi-Value Property](./property-oneof-multi-value-property.md "The property in an index") – `https://ns.adobe.com/helix/shared/property#/oneOf/1`

*   [Multi-Value Property](./property-oneof-multi-value-property.md "The property in an index") – `https://ns.adobe.com/helix/shared/property#/oneOf/1`

*   [Properties](./index-properties-properties.md "The properties to add to the index") – `https://ns.adobe.com/helix/shared/index#/properties/properties`

*   [Queries](./index-properties-queries.md "Named queries that can be executed against this index") – `https://ns.adobe.com/helix/shared/index#/properties/queries`

*   [Single-Value Property](./property-oneof-single-value-property.md "The property in an index") – `https://ns.adobe.com/helix/shared/property#/oneOf/0`

*   [Single-Value Property](./property-oneof-single-value-property.md "The property in an index") – `https://ns.adobe.com/helix/shared/property#/oneOf/0`

*   [Sitemap Languages](./sitemap-properties-sitemap-languages.md "The languages to add to the sitemap") – `https://ns.adobe.com/helix/shared/sitemap#/properties/languages`

*   [Untitled object in FSTab (Mount Points)](./fstab-properties-mountpoints.md) – `https://ns.adobe.com/helix/shared/fstab#/properties/mountpoints`

*   [Untitled object in Index Configuration](./indexconfig-properties-indices.md) – `https://ns.adobe.com/helix/shared/indexconfig#/properties/indices`

*   [Untitled object in Mount Point](./mountpoint-oneof-1.md) – `https://ns.adobe.com/helix/shared/mountpoint#/oneOf/1`

*   [Untitled object in Mount Point](./mountpoint-oneof-1.md) – `https://ns.adobe.com/helix/shared/mountpoint#/oneOf/1`

*   [Untitled object in Sitemap Configuration](./sitemapconfig-properties-sitemaps.md) – `https://ns.adobe.com/helix/shared/sitemapconfig#/properties/sitemaps`

### Arrays

*   [Exclude](./index-properties-exclude.md "Glob patterns for paths where this index must not be used") – `https://ns.adobe.com/helix/shared/index#/properties/exclude`

*   [Include](./index-properties-include.md "Glob patterns for paths where this index is used") – `https://ns.adobe.com/helix/shared/index#/properties/include`

*   [Untitled array in Mount Point](./mountpoint-oneof-1-properties-credentials.md "encrypted credentials") – `https://ns.adobe.com/helix/shared/mountpoint#/oneOf/1/properties/credentials`

*   [Untitled array in Mount Point](./mountpoint-oneof-1-properties-credentials.md "encrypted credentials") – `https://ns.adobe.com/helix/shared/mountpoint#/oneOf/1/properties/credentials`

*   [Untitled array in Query](./query-properties-parameters.md "Which URL parameters to accept in the query when served on the web") – `https://ns.adobe.com/helix/shared/query#/properties/parameters`

*   [Untitled array in Query](./query-properties-parameters.md "Which URL parameters to accept in the query when served on the web") – `https://ns.adobe.com/helix/shared/query#/properties/parameters`

## Version Note

The schemas linked above follow the JSON Schema Spec version: `http://json-schema.org/draft-07/schema#`
