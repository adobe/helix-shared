# Source Schema

```txt
https://ns.adobe.com/helix/shared/index#/properties/source
```

The source representation to be used by the indexer to extract values

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                     |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [index.schema.json*](index.schema.json "open original schema") |

## source Type

`string` ([Source](index-properties-source.md))

## source Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value        | Explanation |
| :----------- | :---------- |
| `"html"`     |             |
| `"markdown"` |             |
