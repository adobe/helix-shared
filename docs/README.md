# README

## Top-level Schemas

*   [Conditions](./conditions.md "A condition expression") – `https://ns.adobe.com/helix/shared/conditions`

*   [Configuration](./config.md "The Strains configuration for a Project Helix website") – `https://ns.adobe.com/helix/shared/config`

*   [Configuration](./markupconfig.md "A Markup Configuration File for Project Helix") – `https://ns.adobe.com/helix/shared/markupconfig`

*   [FSTab (Mount Points)](./fstab.md "Defines a mapping between mount points and source URLs") – `https://ns.adobe.com/helix/shared/fstab`

*   [Git URL](./giturl.md "Representation of the fragments of a Git URL") – `https://ns.adobe.com/helix/shared/giturl`

*   [Git URL](./staticgiturl.md "Representation of the fragments of a Git URL") – `https://ns.adobe.com/helix/shared/staticgiturl`

*   [Index](./index.md) – `https://ns.adobe.com/helix/shared/index`

*   [Index Configuration](./indexconfig.md) – `https://ns.adobe.com/helix/shared/indexconfig`

*   [Markup Configuration](./markup.md "A container for markup mappings") – `https://ns.adobe.com/helix/shared/markup`

*   [Markup Mapping](./markupmapping.md "A markup mapping defines how Helix should generate markup for certain Markdown or DOM patterns") – `https://ns.adobe.com/helix/shared/markupmapping`

*   [Mount Point](./mountpoint.md "Defines the target URL where content should be retrieved from") – `https://ns.adobe.com/helix/shared/mountpoint`

*   [Origin](./origin.md "Representation of a origin host for a proxy strain") – `https://ns.adobe.com/helix/shared/origin`

*   [Performance](./performance.md "Performance testing details") – `https://ns.adobe.com/helix/shared/performance`

*   [Property](./property.md "Each property in the search index is made up of two parts:a select expression that selects nodes in the DOM or MDAST of the document to be indexeda value or values expression that specifies how to extract values from the selected nodes") – `https://ns.adobe.com/helix/shared/property`

*   [Proxy Strain](./proxystrain.md "A proxy strain is a strain that serves content from another web server, acting as a pure proxy") – `https://ns.adobe.com/helix/shared/proxystrain`

*   [Query](./query.md "A named query that can be run against an index") – `https://ns.adobe.com/helix/shared/query`

*   [Redirect](./redirect.md "A redirect specification take take the form of either a URL of a spreadsheet with rewrite rules or a rewrite rule as from, to pairs") – `https://ns.adobe.com/helix/shared/redirect`

*   [Redirect Rule](./redirectrule.md "A strain is a combination of code and content that enables the creation of a digital experience") – `https://ns.adobe.com/helix/shared/redirectrule`

*   [Redirects Configuration](./redirects.md "This configuration file enables the creation of programmatic redirects, rewrites, and vanity URLs") – `https://ns.adobe.com/helix/shared/redirects`

*   [Response](./data-embed-response.md "The Helix Data Embed Response format") – `https://ns.adobe.com/helix/data-embed/response`

*   [Row](./row.md "A JSON representation of an Excel or Google Sheets data row") – `https://ns.adobe.com/helix/data-embed/row`

*   [Runtime Strain](./runtimestrain.md "A runtime strain is a combination of code and content that enables the creation of a digital experience") – `https://ns.adobe.com/helix/shared/runtimestrain`

*   [Strains](./strains.md) – `https://ns.adobe.com/helix/shared/strains`

*   [Vanity URL mapping](./vanity.md) – `https://ns.adobe.com/helix/shared/vanity`

*   [Version Lock](./version-lock.md "The version-lock property allows pinning of specific services to a particular version number") – `https://ns.adobe.com/helix/shared/version-lock`

*   [Workbook](./workbook.md "A JSON representation of an Excel or Google Sheets workbook containing multiple sheets") – `https://ns.adobe.com/helix/data-embed/workbook`

*   [Worksheet](./sheet.md "A JSON representation of an Excel or Google Sheets worksheet containing rows and columns") – `https://ns.adobe.com/helix/data-embed/sheet`

## Other Schemas

### Objects

*   [Git URL](./runtimestrain-properties-code-oneof-git-url.md "Representation of the fragments of a Git URL") – `https://ns.adobe.com/helix/shared/giturl#/properties/code/oneOf/1`

*   [Git URL](./runtimestrain-properties-static-oneof-git-url.md "Representation of the fragments of a Git URL") – `https://ns.adobe.com/helix/shared/staticgiturl#/properties/static/oneOf/1`

*   [Markup Mapping](./markup-markup-mapping.md) – `https://ns.adobe.com/helix/shared/markupmapping#/additionalProperties`

*   [Multi-Value Property](./property-oneof-multi-value-property.md "The property in an index") – `https://ns.adobe.com/helix/shared/property#/oneOf/1`

*   [Multi-Value Property](./property-oneof-multi-value-property.md "The property in an index") – `https://ns.adobe.com/helix/shared/property#/oneOf/1`

*   [Origin](./proxystrain-properties-origin-anyof-origin.md "Representation of a origin host for a proxy strain") – `https://ns.adobe.com/helix/shared/origin#/properties/origin/anyOf/1`

*   [Performance](./proxystrain-properties-performance.md "Performance testing details") – `https://ns.adobe.com/helix/shared/performance#/properties/perf`

*   [Properties](./index-properties-properties.md "The properties to add to the index") – `https://ns.adobe.com/helix/shared/index#/properties/properties`

*   [Property](./index-properties-properties-property.md) – `https://ns.adobe.com/helix/shared/property#/properties/properties/additionalProperties`

*   [Proxy Strain](./strains-definitions-anystrain-oneof-proxy-strain.md "A strain is a combination of code and content that enables the creation of a digital experience") – `https://ns.adobe.com/helix/shared/proxystrain#/definitions/anystrain/oneOf/0`

*   [Queries](./index-properties-queries.md "Named queries that can be executed against this index") – `https://ns.adobe.com/helix/shared/index#/properties/queries`

*   [Query](./index-properties-queries-query.md "A named query that can be run against an index") – `https://ns.adobe.com/helix/shared/query#/properties/queries/additionalProperties`

*   [Redirect Rule](./proxystrain-properties-redirects-redirect-rule.md "A strain is a combination of code and content that enables the creation of a digital experience") – `https://ns.adobe.com/helix/shared/redirectrule#/properties/redirects/items`

*   [Row](./sheet-properties-data-row.md "A JSON representation of an Excel or Google Sheets data row") – `https://ns.adobe.com/helix/data-embed/row#/properties/data/items`

*   [Runtime Strain](./strains-definitions-anystrain-oneof-runtime-strain.md "A runtime strain is a combination of code and content that enables the creation of a digital experience") – `https://ns.adobe.com/helix/shared/runtimestrain#/definitions/anystrain/oneOf/1`

*   [Single-Value Property](./property-oneof-single-value-property.md "The property in an index") – `https://ns.adobe.com/helix/shared/property#/oneOf/0`

*   [Single-Value Property](./property-oneof-single-value-property.md "The property in an index") – `https://ns.adobe.com/helix/shared/property#/oneOf/0`

*   [Untitled object in Configuration](./config-properties-definitions.md "A container for referencable objects that can be re-used elsewhere in the configuration") – `https://ns.adobe.com/helix/shared/config#/properties/definitions`

*   [Untitled object in Configuration](./markupconfig-properties-definitions.md "A container for referencable objects that can be re-used elsewhere in the configuration") – `https://ns.adobe.com/helix/shared/markupconfig#/properties/definitions`

*   [Untitled object in FSTab (Mount Points)](./fstab-properties-mountpoints.md) – `https://ns.adobe.com/helix/shared/fstab#/properties/mountpoints`

*   [Untitled object in Index Configuration](./indexconfig-properties-indices.md) – `https://ns.adobe.com/helix/shared/indexconfig#/properties/indices`

*   [Untitled object in Markup Mapping](./markupmapping-properties-attribute.md "create new attributes for each key value pair below this property") – `https://ns.adobe.com/helix/shared/markupmapping#/properties/attribute`

*   [Untitled object in Markup Mapping](./markupmapping-properties-attribute.md "create new attributes for each key value pair below this property") – `https://ns.adobe.com/helix/shared/markupmapping#/properties/attribute`

*   [Untitled object in Mount Point](./mountpoint-oneof-1.md) – `https://ns.adobe.com/helix/shared/mountpoint#/oneOf/1`

*   [Untitled object in Mount Point](./mountpoint-oneof-1.md) – `https://ns.adobe.com/helix/shared/mountpoint#/oneOf/1`

*   [Vanity URL extractor](./redirects-properties-vanity-url-extractor.md "Configure one or multiple vanity URL extractors, each extractor is a property of this object") – `https://ns.adobe.com/helix/shared/redirects#/properties/vanity`

*   [Vanity URL mapping](./redirects-properties-vanity-url-extractor-vanity-url-mapping.md) – `https://ns.adobe.com/helix/shared/vanity#/properties/vanity/additionalProperties`

*   [Version Lock](./proxystrain-properties-version-lock.md) – `https://ns.adobe.com/helix/shared/version-lock#/properties/version-lock`

*   [Workbook](./data-embed-response-allof-0-oneof-workbook.md "A JSON representation of an Excel or Google Sheets workbook containing multiple sheets") – `https://ns.adobe.com/helix/data-embed/workbook#/allOf/0/oneOf/1`

*   [Worksheet](./data-embed-response-allof-0-oneof-worksheet.md "A JSON representation of an Excel or Google Sheets worksheet containing rows and columns") – `https://ns.adobe.com/helix/data-embed/sheet#/allOf/0/oneOf/0`

### Arrays

*   [Untitled array in Conditions](./conditions-properties-and.md "All conditions in this list must be met") – `https://ns.adobe.com/helix/shared/conditions#/properties/and`

*   [Untitled array in Conditions](./conditions-properties-or.md "Any conditions in this list must be met") – `https://ns.adobe.com/helix/shared/conditions#/properties/or`

*   [Untitled array in Git URL](./staticgiturl-properties-allow.md "List of white listed paths") – `https://ns.adobe.com/helix/shared/staticgiturl#/properties/allow`

*   [Untitled array in Git URL](./staticgiturl-properties-deny.md "List of white listed paths") – `https://ns.adobe.com/helix/shared/staticgiturl#/properties/deny`

*   [Untitled array in Git URL](./staticgiturl-properties-allow.md "List of white listed paths") – `https://ns.adobe.com/helix/shared/staticgiturl#/properties/allow`

*   [Untitled array in Git URL](./staticgiturl-properties-deny.md "List of white listed paths") – `https://ns.adobe.com/helix/shared/staticgiturl#/properties/deny`

*   [Untitled array in Markup Mapping](./markupmapping-properties-classnames.md "Add the following class names to the class attribute of the generated HTML") – `https://ns.adobe.com/helix/shared/markupmapping#/properties/classnames`

*   [Untitled array in Markup Mapping](./markupmapping-properties-classnames.md "Add the following class names to the class attribute of the generated HTML") – `https://ns.adobe.com/helix/shared/markupmapping#/properties/classnames`

*   [Untitled array in Mount Point](./mountpoint-oneof-1-properties-credentials.md "encrypted credentials") – `https://ns.adobe.com/helix/shared/mountpoint#/oneOf/1/properties/credentials`

*   [Untitled array in Mount Point](./mountpoint-oneof-1-properties-credentials.md "encrypted credentials") – `https://ns.adobe.com/helix/shared/mountpoint#/oneOf/1/properties/credentials`

*   [Untitled array in Proxy Strain](./proxystrain-properties-urls.md "List of known URLs for testing this strain") – `https://ns.adobe.com/helix/shared/proxystrain#/properties/urls`

*   [Untitled array in Proxy Strain](./proxystrain-properties-params.md "A list (using globbing language) of accepted URL parameters") – `https://ns.adobe.com/helix/shared/proxystrain#/properties/params`

*   [Untitled array in Proxy Strain](./proxystrain-properties-redirects.md "The redirect rules that should be applied to this strain") – `https://ns.adobe.com/helix/shared/proxystrain#/properties/redirects`

*   [Untitled array in Proxy Strain](./proxystrain-properties-urls.md "List of known URLs for testing this strain") – `https://ns.adobe.com/helix/shared/proxystrain#/properties/urls`

*   [Untitled array in Proxy Strain](./proxystrain-properties-params.md "A list (using globbing language) of accepted URL parameters") – `https://ns.adobe.com/helix/shared/proxystrain#/properties/params`

*   [Untitled array in Proxy Strain](./proxystrain-properties-redirects.md "The redirect rules that should be applied to this strain") – `https://ns.adobe.com/helix/shared/proxystrain#/properties/redirects`

*   [Untitled array in Query](./query-properties-parameters.md "Which URL parameters to accept in the query when served on the web") – `https://ns.adobe.com/helix/shared/query#/properties/parameters`

*   [Untitled array in Query](./query-properties-parameters.md "Which URL parameters to accept in the query when served on the web") – `https://ns.adobe.com/helix/shared/query#/properties/parameters`

*   [Untitled array in Redirects Configuration](./redirects-properties-redirects.md) – `https://ns.adobe.com/helix/shared/redirects#/properties/redirects`

*   [Untitled array in Runtime Strain](./runtimestrain-properties-urls.md "List of known URLs for testing this strain") – `https://ns.adobe.com/helix/shared/runtimestrain#/properties/urls`

*   [Untitled array in Runtime Strain](./runtimestrain-properties-params.md "A list (using globbing language) of accepted URL parameters") – `https://ns.adobe.com/helix/shared/runtimestrain#/properties/params`

*   [Untitled array in Runtime Strain](./runtimestrain-properties-redirects.md "The redirect rules that should be applied to this strain") – `https://ns.adobe.com/helix/shared/runtimestrain#/properties/redirects`

*   [Untitled array in Runtime Strain](./runtimestrain-properties-urls.md "List of known URLs for testing this strain") – `https://ns.adobe.com/helix/shared/runtimestrain#/properties/urls`

*   [Untitled array in Runtime Strain](./runtimestrain-properties-params.md "A list (using globbing language) of accepted URL parameters") – `https://ns.adobe.com/helix/shared/runtimestrain#/properties/params`

*   [Untitled array in Runtime Strain](./runtimestrain-properties-redirects.md "The redirect rules that should be applied to this strain") – `https://ns.adobe.com/helix/shared/runtimestrain#/properties/redirects`

*   [Untitled array in Strains](./strains-oneof-0.md "A list of strains") – `https://ns.adobe.com/helix/shared/strains#/oneOf/0`

*   [Untitled array in Strains](./strains-oneof-0.md "A list of strains") – `https://ns.adobe.com/helix/shared/strains#/oneOf/0`

*   [Untitled array in Workbook](./workbook-properties-names.md "The list of sheet names that exist in the workbook response") – `https://ns.adobe.com/helix/data-embed/workbook#/properties/:names`

*   [Untitled array in Workbook](./workbook-properties-names.md "The list of sheet names that exist in the workbook response") – `https://ns.adobe.com/helix/data-embed/workbook#/properties/:names`

*   [Untitled array in Worksheet](./sheet-properties-data.md "The data rows that are part of the result set") – `https://ns.adobe.com/helix/data-embed/sheet#/properties/data`

*   [Untitled array in Worksheet](./sheet-properties-data.md "The data rows that are part of the result set") – `https://ns.adobe.com/helix/data-embed/sheet#/properties/data`

## Version Note

The schemas linked above follow the JSON Schema Spec version: `http://json-schema.org/draft-07/schema#`
