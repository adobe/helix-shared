# Multi-Value Property Schema

```txt
https://ns.adobe.com/helix/shared/property#/oneOf/1
```

The property in an index. The value will be stored as a list of values

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                            |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [property.schema.json\*](property.schema.json "open original schema") |

## 1 Type

`object` ([Multi-Value Property](property-oneof-multi-value-property.md))

# 1 Properties

| Property            | Type      | Required | Nullable       | Defined by                                                                                                                                     |
| :------------------ | :-------- | :------- | :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| [select](#select)   | `string`  | Required | cannot be null | [Property](property-oneof-multi-value-property-properties-select.md "https://ns.adobe.com/helix/shared/property#/oneOf/1/properties/select")   |
| [values](#values)   | `string`  | Required | cannot be null | [Property](property-oneof-multi-value-property-properties-values.md "https://ns.adobe.com/helix/shared/property#/oneOf/1/properties/values")   |
| [faceted](#faceted) | `boolean` | Optional | cannot be null | [Property](property-oneof-multi-value-property-properties-faceted.md "https://ns.adobe.com/helix/shared/property#/oneOf/1/properties/faceted") |

## select

A CSS selector expression that selects nodes in the HTML (DOM) or Markdown (MDAST) syntax tree

`select`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Property](property-oneof-multi-value-property-properties-select.md "https://ns.adobe.com/helix/shared/property#/oneOf/1/properties/select")

### select Type

`string`

## values

A ES6 template literal expression that extracts the values from the matching nodes to be stored in the index

`values`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Property](property-oneof-multi-value-property-properties-values.md "https://ns.adobe.com/helix/shared/property#/oneOf/1/properties/values")

### values Type

`string`

## faceted

Whether to enable faceted search on this property

`faceted`

*   is optional

*   Type: `boolean`

*   cannot be null

*   defined in: [Property](property-oneof-multi-value-property-properties-faceted.md "https://ns.adobe.com/helix/shared/property#/oneOf/1/properties/faceted")

### faceted Type

`boolean`
