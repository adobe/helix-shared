# Untitled string in Vanity URL mapping Schema

```txt
https://ns.adobe.com/helix/shared/vanity#/properties/fetch
```

The source document to retrieve values from. Known variables in the URI Template are: `repo`, `ref`, `owner`, `path`

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                       |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :--------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [vanity.schema.json*](vanity.schema.json "open original schema") |

## fetch Type

`string`

## fetch Constraints

**URI Template**: the string must be a URI template, according to [RFC 6570](https://tools.ietf.org/html/rfc6570 "check the specification")
