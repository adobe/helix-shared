# Vanity URL mapping Schema

```txt
https://ns.adobe.com/helix/shared/vanity
```




| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                      |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | --------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [vanity.schema.json](vanity.schema.json "open original schema") |

## Vanity URL mapping Type

`object` ([Vanity URL mapping](vanity.md))

# Vanity URL mapping Properties

| Property          | Type     | Required | Nullable       | Defined by                                                                                                           |
| :---------------- | -------- | -------- | -------------- | :------------------------------------------------------------------------------------------------------------------- |
| [source](#source) | `string` | Optional | cannot be null | [Vanity URL mapping](vanity-properties-source.md "https&#x3A;//ns.adobe.com/helix/shared/vanity#/properties/source") |
| [fetch](#fetch)   | `string` | Optional | cannot be null | [Vanity URL mapping](vanity-properties-fetch.md "https&#x3A;//ns.adobe.com/helix/shared/vanity#/properties/fetch")   |
| [select](#select) | `string` | Optional | cannot be null | [Vanity URL mapping](vanity-properties-select.md "https&#x3A;//ns.adobe.com/helix/shared/vanity#/properties/select") |
| [value](#value)   | `string` | Optional | cannot be null | [Vanity URL mapping](vanity-properties-value.md "https&#x3A;//ns.adobe.com/helix/shared/vanity#/properties/value")   |

## source

The source representation to be used by the indexer to extract values


`source`

-   is optional
-   Type: `string` ([Source](vanity-properties-source.md))
-   cannot be null
-   defined in: [Vanity URL mapping](vanity-properties-source.md "https&#x3A;//ns.adobe.com/helix/shared/vanity#/properties/source")

### source Type

`string` ([Source](vanity-properties-source.md))

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
-   defined in: [Vanity URL mapping](vanity-properties-fetch.md "https&#x3A;//ns.adobe.com/helix/shared/vanity#/properties/fetch")

### fetch Type

`string`

### fetch Constraints

**URI Template**: the string must be a URI template, according to [RFC 6570](https://tools.ietf.org/html/rfc6570 "check the specification")

## select

A CSS selector expression that selects nodes in the HTML (DOM) or Markdown (MDAST) syntax tree


`select`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Vanity URL mapping](vanity-properties-select.md "https&#x3A;//ns.adobe.com/helix/shared/vanity#/properties/select")

### select Type

`string`

## value

A ES6 template literal expression that extracts the value from the matching node(s) to be stored in the index


`value`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Vanity URL mapping](vanity-properties-value.md "https&#x3A;//ns.adobe.com/helix/shared/vanity#/properties/value")

### value Type

`string`
