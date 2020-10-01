# Release Version Schema

```txt
https://ns.adobe.com/helix/shared/version-lock#/additionalProperties/oneOf/0
```

A version number, starting with `v`


| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                    |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | ----------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [version-lock.schema.json\*](version-lock.schema.json "open original schema") |

## 0 Type

`string` ([Release Version](version-lock-additionalproperties-oneof-release-version.md))

## 0 Constraints

**pattern**: the string must match the following regular expression: 

```regexp
^v(0|[1-9]\d*)(\.(0|[1-9]\d*)(\.(0|[1-9]\d*))?)?(-.*)?$
```

[try pattern](https://regexr.com/?expression=%5Ev(0%7C%5B1-9%5D%5Cd*)(%5C.(0%7C%5B1-9%5D%5Cd*)(%5C.(0%7C%5B1-9%5D%5Cd*))%3F)%3F(-.*)%3F%24 "try regular expression with regexr.com")

## 0 Examples

```yaml
v1.0.0

```

```yaml
v1.0

```

```yaml
v1

```
