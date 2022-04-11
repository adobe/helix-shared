# Single-Value Property Schema

```txt
https://ns.adobe.com/helix/shared/property#/oneOf/0
```

The property in an index. The value will be stored as a single cardinal value.

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                            |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [property.schema.json\*](property.schema.json "open original schema") |

## 0 Type

`object` ([Single-Value Property](property-oneof-single-value-property.md))

# 0 Properties

| Property            | Type      | Required | Nullable       | Defined by                                                                                                                                      |
| :------------------ | :-------- | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| [select](#select)   | `string`  | Required | cannot be null | [Property](property-oneof-single-value-property-properties-select.md "https://ns.adobe.com/helix/shared/property#/oneOf/0/properties/select")   |
| [value](#value)     | `string`  | Required | cannot be null | [Property](property-oneof-single-value-property-properties-value.md "https://ns.adobe.com/helix/shared/property#/oneOf/0/properties/value")     |
| [faceted](#faceted) | `boolean` | Optional | cannot be null | [Property](property-oneof-single-value-property-properties-faceted.md "https://ns.adobe.com/helix/shared/property#/oneOf/0/properties/faceted") |

## select

A CSS selector expression that selects nodes in the HTML (DOM) or Markdown (MDAST) syntax tree

`select`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Property](property-oneof-single-value-property-properties-select.md "https://ns.adobe.com/helix/shared/property#/oneOf/0/properties/select")

### select Type

`string`

## value

A ES6 template literal expression that extracts the value from the matching node(s) to be stored in the index

`value`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Property](property-oneof-single-value-property-properties-value.md "https://ns.adobe.com/helix/shared/property#/oneOf/0/properties/value")

### value Type

`string`

## faceted

Whether to enable faceted search on this property

`faceted`

*   is optional

*   Type: `boolean`

*   cannot be null

*   defined in: [Property](property-oneof-single-value-property-properties-faceted.md "https://ns.adobe.com/helix/shared/property#/oneOf/0/properties/faceted")

### faceted Type

`boolean`
