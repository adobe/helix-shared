# Untitled string in Configuration Schema

```txt
https://ns.adobe.com/helix/shared/config#/properties/preflight
```

The URL of a preflight check that should be performed before assigning a strain to a request. The headers returned by this preflight request can be used in strain conditions.


| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                        |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | ----------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [config.schema.json\*](config.schema.json "open original schema") |

## preflight Type

`string`

## preflight Constraints

**pattern**: the string must match the following regular expression: 

```regexp
^https://adobeioruntime\.net/
```

[try pattern](https://regexr.com/?expression=%5Ehttps%3A%2F%2Fadobeioruntime%5C.net%2F "try regular expression with regexr.com")

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc3986 "check the specification")
