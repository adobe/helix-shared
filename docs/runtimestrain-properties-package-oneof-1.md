# Untitled string in Runtime Strain Schema

```txt
https://ns.adobe.com/helix/shared/runtimestrain#/properties/package/oneOf/1
```

A pair of OpenWhisk namespace and package name, separated by slash.

This will be the base package to look up actions to run in this strain.

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                     |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :----------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [runtimestrain.schema.json*](runtimestrain.schema.json "open original schema") |

## 1 Type

`string`

## 1 Constraints

**pattern**: the string must match the following regular expression: 

```regexp
^[^/]+\/[^/]+$
```

[try pattern](https://regexr.com/?expression=%5E%5B%5E%2F%5D%2B%5C%2F%5B%5E%2F%5D%2B%24 "try regular expression with regexr.com")

## 1 Examples

```yaml
helix-pages/pages_4.15.1

```

```yaml
trieloff/10e05c072b108ac9533c6206c6eaa651901ca29b

```
