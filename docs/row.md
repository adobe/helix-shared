# Row Schema

```txt
https://ns.adobe.com/helix/data-embed/row
```

A JSON representation of an Excel or Google Sheets data row.

| Abstract            | Extensible | Status      | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                |
| :------------------ | :--------- | :---------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | Unknown identifiability | Forbidden         | Allowed               | none                | [row.schema.json](row.schema.json "open original schema") |

## Row Type

`object` ([Row](row.md))

# Row Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                           |
| :-------------------- | :------- | :------- | :------------- | :--------------------------------------------------------------------------------------------------- |
| Additional Properties | Multiple | Optional | cannot be null | [Row](row-additionalproperties.md "https://ns.adobe.com/helix/data-embed/row#/additionalProperties") |

## Additional Properties

Additional properties are allowed, as long as they follow this schema:

Value of the cell in the given column.

*   is optional

*   Type: any of the folllowing: `string` or `number` ([Details](row-additionalproperties.md))

*   cannot be null

*   defined in: [Row](row-additionalproperties.md "https://ns.adobe.com/helix/data-embed/row#/additionalProperties")

### additionalProperties Type

any of the folllowing: `string` or `number` ([Details](row-additionalproperties.md))
