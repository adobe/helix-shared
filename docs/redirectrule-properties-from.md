# Untitled string in Redirect Rule Schema

```txt
https://ns.adobe.com/helix/shared/redirectrule#/properties/from
```

A URL path or regular expression to match the path of a URL. It can contain capture groups that can be used in `to`.


| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                    |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | ----------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [redirectrule.schema.json\*](redirectrule.schema.json "open original schema") |

## from Type

`string`

## from Examples

```json
"/old"
```

```json
"/old/(.*)\\.php$"
```
