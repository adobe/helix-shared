# Untitled string in Git URL Schema

```txt
https://ns.adobe.com/helix/shared/staticgiturl#/properties/protocol
```

The protocol to access the Git repository

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                   |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :--------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [staticgiturl.schema.json*](staticgiturl.schema.json "open original schema") |

## protocol Type

`string`

## protocol Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value     | Explanation |
| :-------- | :---------- |
| `"https"` |             |
| `"http"`  |             |
| `"ssh"`   |             |
