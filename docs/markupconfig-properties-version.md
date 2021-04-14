# Untitled undefined type in Configuration Schema

```txt
https://ns.adobe.com/helix/shared/markupconfig#/properties/version
```

The helix-config file format version

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                   |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :--------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [markupconfig.schema.json*](markupconfig.schema.json "open original schema") |

## version Type

any of the folllowing: `string` or `number` ([Details](markupconfig-properties-version.md))

## version Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value | Explanation |
| :---- | :---------- |
| `"1"` |             |
| `1`   |             |

## version Default Value

The default value is:

```json
1
```
