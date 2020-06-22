# Rewrites Google Spreadsheet Schema

```txt
https://ns.adobe.com/helix/shared/redirect#/anyOf/1
```

A link to a Google spreadsheet, shared with `helix@adobe.com` that has at least two columns. The first column, titled ‟from” contains the rewrite source path, the second column, titled ‟to” specifies the rewrite target path.


| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                            |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | --------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [redirect.schema.json\*](redirect.schema.json "open original schema") |

## 1 Type

`string` ([Rewrites Google Spreadsheet](redirect-anyof-rewrites-google-spreadsheet.md))

## 1 Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc4291 "check the specification")
