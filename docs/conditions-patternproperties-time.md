# Untitled string in Conditions Schema

```txt
https://ns.adobe.com/helix/shared/conditions#/patternProperties/^time[<=>]?$
```

Absolute time of the request, evaluated against UTC

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                               |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :----------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [conditions.schema.json*](conditions.schema.json "open original schema") |

## ^time\[<=>]?$ Type

`string`

## ^time\[<=>]?$ Constraints

**date time**: the string must be a date time string, according to [RFC 3339, section 5.6](https://tools.ietf.org/html/rfc3339 "check the specification")
