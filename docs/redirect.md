# Redirect Schema

```txt
https://ns.adobe.com/helix/shared/redirect
```

A redirect specification take take the form of either a URL of a spreadsheet with rewrite rules or a rewrite rule as `from`, `to` pairs.

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                          |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------------ |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [redirect.schema.json](redirect.schema.json "open original schema") |

## Redirect Type

merged type ([Redirect](redirect.md))

any of

*   [Rewrites Excel Spreadsheet](redirect-anyof-rewrites-excel-spreadsheet.md "check type definition")

*   [Rewrites Google Spreadsheet](redirect-anyof-rewrites-google-spreadsheet.md "check type definition")

*   [Redirect Rule](proxystrain-properties-redirects-redirect-rule.md "check type definition")
