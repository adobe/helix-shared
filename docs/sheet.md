# Worksheet Schema

```txt
https://ns.adobe.com/helix/data-embed/sheet
```

A JSON representation of an Excel or Google Sheets worksheet containing rows and columns.

| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                    |
| :------------------ | :--------- | :---------- | :----------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------ |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [sheet.schema.json](sheet.schema.json "open original schema") |

## Worksheet Type

`object` ([Worksheet](sheet.md))

# Worksheet Properties

| Property             | Type          | Required | Nullable       | Defined by                                                                                                  |
| :------------------- | :------------ | :------- | :------------- | :---------------------------------------------------------------------------------------------------------- |
| [:type](#type)       | Not specified | Optional | cannot be null | [Worksheet](sheet-properties-type.md "https://ns.adobe.com/helix/data-embed/sheet#/properties/:type")       |
| [limit](#limit)      | `integer`     | Required | cannot be null | [Worksheet](sheet-properties-limit.md "https://ns.adobe.com/helix/data-embed/sheet#/properties/limit")      |
| [offset](#offset)    | `integer`     | Required | cannot be null | [Worksheet](sheet-properties-offset.md "https://ns.adobe.com/helix/data-embed/sheet#/properties/offset")    |
| [total](#total)      | `integer`     | Required | cannot be null | [Worksheet](sheet-properties-total.md "https://ns.adobe.com/helix/data-embed/sheet#/properties/total")      |
| [data](#data)        | `array`       | Required | cannot be null | [Worksheet](sheet-properties-data.md "https://ns.adobe.com/helix/data-embed/sheet#/properties/data")        |
| [:version](#version) | `number`      | Optional | cannot be null | [Worksheet](sheet-properties-version.md "https://ns.adobe.com/helix/data-embed/sheet#/properties/:version") |

## :type

The response type, depending on the presence of the `sheet` request parameter.

`:type`

*   is optional

*   Type: unknown

*   cannot be null

*   defined in: [Worksheet](sheet-properties-type.md "https://ns.adobe.com/helix/data-embed/sheet#/properties/:type")

### :type Type

unknown

### :type Constraints

**constant**: the value of this property must be equal to:

```json
"sheet"
```

## limit

The maximum number of items requested by the `limit` parameter.

`limit`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Worksheet](sheet-properties-limit.md "https://ns.adobe.com/helix/data-embed/sheet#/properties/limit")

### limit Type

`integer`

### limit Constraints

**minimum**: the value of this number must greater than or equal to: `0`

## offset

The starting row that items have been retrieved by as specified by the `offset` parameter.

`offset`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Worksheet](sheet-properties-offset.md "https://ns.adobe.com/helix/data-embed/sheet#/properties/offset")

### offset Type

`integer`

### offset Constraints

**minimum**: the value of this number must greater than or equal to: `0`

## total

The total number of items in the data sheet. This value can be greater than the sum of `limit` and `offset`

`total`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Worksheet](sheet-properties-total.md "https://ns.adobe.com/helix/data-embed/sheet#/properties/total")

### total Type

`integer`

### total Constraints

**minimum**: the value of this number must greater than or equal to: `0`

## data

The data rows that are part of the result set

`data`

*   is required

*   Type: `object[]` ([Row](sheet-properties-data-row.md))

*   cannot be null

*   defined in: [Worksheet](sheet-properties-data.md "https://ns.adobe.com/helix/data-embed/sheet#/properties/data")

### data Type

`object[]` ([Row](sheet-properties-data-row.md))

## :version

The workbook response format version

`:version`

*   is optional

*   Type: `number`

*   cannot be null

*   defined in: [Worksheet](sheet-properties-version.md "https://ns.adobe.com/helix/data-embed/sheet#/properties/:version")

### :version Type

`number`

### :version Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value | Explanation |
| :---- | :---------- |
| `3`   |             |

### :version Default Value

The default value is:

```json
3
```
