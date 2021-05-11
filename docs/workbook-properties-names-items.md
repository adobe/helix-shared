# Untitled string in Workbook Schema

```txt
https://ns.adobe.com/helix/data-embed/workbook#/properties/:names/items
```

The sheet name. Sheet names may not start with `:`

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                           |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [workbook.schema.json*](workbook.schema.json "open original schema") |

## items Type

`string`

## items Constraints

**pattern**: the string must match the following regular expression: 

```regexp
^[^:].*
```

[try pattern](https://regexr.com/?expression=%5E%5B%5E%3A%5D.\* "try regular expression with regexr.com")
