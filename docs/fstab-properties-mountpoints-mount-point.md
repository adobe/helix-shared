# Mount Point Schema

```txt
https://ns.adobe.com/helix/shared/mountpoint#/properties/mountpoints/items
```

Defines the mount point.


| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                      |
| :------------------ | ---------- | ----------- | ------------ | :---------------- | --------------------- | ------------------- | --------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Allowed               | none                | [fstab.schema.json\*](fstab.schema.json "open original schema") |

## items Type

`object` ([Mount Point](fstab-properties-mountpoints-mount-point.md))

## items Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc4291 "check the specification")

# Mount Point Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                        |
| :-------------------- | -------- | -------- | -------------- | :---------------------------------------------------------------------------------------------------------------- |
| [path](#path)         | `string` | Required | cannot be null | [Mount Point](mountpoint-properties-path.md "https&#x3A;//ns.adobe.com/helix/shared/mountpoint#/properties/path") |
| [url](#url)           | `string` | Required | cannot be null | [Mount Point](mountpoint-properties-url.md "https&#x3A;//ns.adobe.com/helix/shared/mountpoint#/properties/url")   |
| [type](#type)         | `string` | Optional | cannot be null | [Mount Point](mountpoint-properties-type.md "https&#x3A;//ns.adobe.com/helix/shared/mountpoint#/properties/type") |
| Additional Properties | Any      | Optional | can be null    |                                                                                                                   |

## path

Mount point root path.


`path`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [Mount Point](mountpoint-properties-path.md "https&#x3A;//ns.adobe.com/helix/shared/mountpoint#/properties/path")

### path Type

`string`

## url

Defines the target URL where content should be retrieved from.


`url`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [Mount Point](mountpoint-properties-url.md "https&#x3A;//ns.adobe.com/helix/shared/mountpoint#/properties/url")

### url Type

`string`

### url Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc4291 "check the specification")

## type

Type of the mount point.


`type`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Mount Point](mountpoint-properties-type.md "https&#x3A;//ns.adobe.com/helix/shared/mountpoint#/properties/type")

### type Type

`string`

## Additional Properties

Additional properties are allowed and do not have to follow a specific schema
