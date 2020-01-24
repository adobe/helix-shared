# Mount Point Schema

```txt
https://ns.adobe.com/helix/shared/mountpoint#/properties/mountpoints/patternProperties/^/.*[^/]$
```

Defines the target URL where content should be retrieved from.


| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                      |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | --------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [fstab.schema.json\*](fstab.schema.json "open original schema") |

## ]$ Type

`string` ([Mount Point](fstab-properties-mountpoints-patternproperties-mount-point.md))

## ]$ Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc4291 "check the specification")
