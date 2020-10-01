# CI Build Number Schema

```txt
https://ns.adobe.com/helix/shared/version-lock#/additionalProperties/oneOf/1
```

A Continious Integration build number, starting with `ci`


| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                    |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | ----------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [version-lock.schema.json\*](version-lock.schema.json "open original schema") |

## 1 Type

`string` ([CI Build Number](version-lock-additionalproperties-oneof-ci-build-number.md))

## 1 Constraints

**pattern**: the string must match the following regular expression: 

```regexp
^ci[0-9]+$
```

[try pattern](https://regexr.com/?expression=%5Eci%5B0-9%5D%2B%24 "try regular expression with regexr.com")

## 1 Examples

```yaml
ci999

```
