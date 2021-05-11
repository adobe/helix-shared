# Workbook Schema

```txt
https://ns.adobe.com/helix/data-embed/workbook
```

A JSON representation of an Excel or Google Sheets workbook containing multiple sheets.

| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                          |
| :------------------ | :--------- | :---------- | :----------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------------ |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [workbook.schema.json](workbook.schema.json "open original schema") |

## Workbook Type

`object` ([Workbook](workbook.md))

# Workbook Properties

| Property             | Type          | Required | Nullable       | Defined by                                                                                                                          |
| :------------------- | :------------ | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| [:type](#type)       | Not specified | Optional | cannot be null | [Workbook](workbook-properties-type.md "https://ns.adobe.com/helix/data-embed/workbook#/properties/:type")                          |
| [:names](#names)     | `array`       | Required | cannot be null | [Workbook](workbook-properties-names.md "https://ns.adobe.com/helix/data-embed/workbook#/properties/:names")                        |
| [:version](#version) | `number`      | Optional | cannot be null | [Workbook](workbook-properties-version.md "https://ns.adobe.com/helix/data-embed/workbook#/properties/:version")                    |
| `^[^:].*`            | `object`      | Optional | cannot be null | [Workbook](data-embed-response-allof-0-oneof-worksheet.md "https://ns.adobe.com/helix/data-embed/sheet#/patternProperties/^[^:].*") |

## :type

The response type, depending on the presence of the `sheet` request parameter.

`:type`

*   is optional

*   Type: unknown

*   cannot be null

*   defined in: [Workbook](workbook-properties-type.md "https://ns.adobe.com/helix/data-embed/workbook#/properties/:type")

### :type Type

unknown

### :type Constraints

**constant**: the value of this property must be equal to:

```json
"multi-sheet"
```

## :names

The list of sheet names that exist in the workbook response.

`:names`

*   is required

*   Type: `string[]`

*   cannot be null

*   defined in: [Workbook](workbook-properties-names.md "https://ns.adobe.com/helix/data-embed/workbook#/properties/:names")

### :names Type

`string[]`

## :version

The workbook response format version

`:version`

*   is optional

*   Type: `number`

*   cannot be null

*   defined in: [Workbook](workbook-properties-version.md "https://ns.adobe.com/helix/data-embed/workbook#/properties/:version")

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

## Pattern: `^[^:].*`

A JSON representation of an Excel or Google Sheets worksheet containing rows and columns.

`^[^:].*`

*   is optional

*   Type: `object` ([Worksheet](data-embed-response-allof-0-oneof-worksheet.md))

*   cannot be null

*   defined in: [Workbook](data-embed-response-allof-0-oneof-worksheet.md "https://ns.adobe.com/helix/data-embed/sheet#/patternProperties/^\[^:].\*")

### ^\[^:].\* Type

`object` ([Worksheet](data-embed-response-allof-0-oneof-worksheet.md))
