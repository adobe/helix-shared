# Row Schema

```txt
https://ns.adobe.com/helix/data-embed/row#/properties/data/items
```

A JSON representation of an Excel or Google Sheets data row.

| Abstract            | Extensible | Status      | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                     |
| :------------------ | :--------- | :---------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | Unknown identifiability | Forbidden         | Allowed               | none                | [sheet.schema.json*](sheet.schema.json "open original schema") |

## items Type

`object` ([Row](sheet-properties-data-row.md))

# items Properties

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
