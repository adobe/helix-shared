# Index Schema

```txt
https://ns.adobe.com/helix/shared/index
```




| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                    |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [index.schema.json](index.schema.json "open original schema") |

## Index Type

`object` ([Index](index.md))

# Index Properties

| Property                  | Type     | Required | Nullable       | Defined by                                                                                                    |
| :------------------------ | -------- | -------- | -------------- | :------------------------------------------------------------------------------------------------------------ |
| [source](#source)         | `string` | Optional | cannot be null | [Index](index-properties-source.md "https&#x3A;//ns.adobe.com/helix/shared/index#/properties/source")         |
| [fetch](#fetch)           | `string` | Optional | cannot be null | [Index](index-properties-fetch.md "https&#x3A;//ns.adobe.com/helix/shared/index#/properties/fetch")           |
| [properties](#properties) | `object` | Optional | cannot be null | [Index](index-properties-properties.md "https&#x3A;//ns.adobe.com/helix/shared/index#/properties/properties") |
| [queries](#queries)       | `object` | Optional | cannot be null | [Index](index-properties-queries.md "https&#x3A;//ns.adobe.com/helix/shared/index#/properties/queries")       |

## source

The source representation to be used by the indexer to extract values


`source`

-   is optional
-   Type: `string` ([Source](index-properties-source.md))
-   cannot be null
-   defined in: [Index](index-properties-source.md "https&#x3A;//ns.adobe.com/helix/shared/index#/properties/source")

### source Type

`string` ([Source](index-properties-source.md))

### source Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value        | Explanation |
| :----------- | ----------- |
| `"html"`     |             |
| `"markdown"` |             |

## fetch

The source document to retrieve values from. Known variables in the URI Template are: `repo`, `ref`, `owner`, `path`


`fetch`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Index](index-properties-fetch.md "https&#x3A;//ns.adobe.com/helix/shared/index#/properties/fetch")

### fetch Type

`string`

### fetch Constraints

**URI Template**: the string must be a URI template, according to [RFC 6570](https://tools.ietf.org/html/rfc6570 "check the specification")

## properties

The properties to add to the index


`properties`

-   is optional
-   Type: `object` ([Properties](index-properties-properties.md))
-   cannot be null
-   defined in: [Index](index-properties-properties.md "https&#x3A;//ns.adobe.com/helix/shared/index#/properties/properties")

### properties Type

`object` ([Properties](index-properties-properties.md))

## queries

Named queries that can be executed against this index


`queries`

-   is optional
-   Type: `object` ([Queries](index-properties-queries.md))
-   cannot be null
-   defined in: [Index](index-properties-queries.md "https&#x3A;//ns.adobe.com/helix/shared/index#/properties/queries")

### queries Type

`object` ([Queries](index-properties-queries.md))
