# Response Schema

```txt
https://ns.adobe.com/helix/data-embed/response
```

The Helix Data Embed Response format

| Abstract            | Extensible | Status      | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                                |
| :------------------ | :--------- | :---------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :---------------------------------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | Unknown identifiability | Forbidden         | Allowed               | none                | [data-embed-response.schema.json](data-embed-response.schema.json "open original schema") |

## Response Type

`object` ([Response](data-embed-response.md))

all of

*   one (and only one) of

    *   [Worksheet](data-embed-response-allof-0-oneof-worksheet.md "check type definition")

    *   [Workbook](data-embed-response-allof-0-oneof-workbook.md "check type definition")

*   [Untitled undefined type in Response](data-embed-response-allof-1.md "check type definition")

## Response Constraints

**minimum number of properties**: the minimum number of properties for this object is: `4`
