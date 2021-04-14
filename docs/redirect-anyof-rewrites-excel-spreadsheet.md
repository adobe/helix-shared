# Rewrites Excel Spreadsheet Schema

```txt
https://ns.adobe.com/helix/shared/redirect#/anyOf/0
```

A link to an Excel spreadsheet hosted on Sharepoint, shared with `helix@adobe.com` that has at least two columns. The first column, titled ‟from” contains the rewrite source path, the second column, titled ‟to” specifies the rewrite target path.

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                           |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [redirect.schema.json*](redirect.schema.json "open original schema") |

## 0 Type

`string` ([Rewrites Excel Spreadsheet](redirect-anyof-rewrites-excel-spreadsheet.md))

## 0 Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc3986 "check the specification")
