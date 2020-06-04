# Untitled object in Mount Point Schema

```txt
https://ns.adobe.com/helix/shared/mountpoint#/oneOf/1
```




| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [mountpoint.schema.json\*](mountpoint.schema.json "open original schema") |

## 1 Type

`object` ([Details](mountpoint-oneof-1.md))

# undefined Properties

| Property                      | Type     | Required | Nullable       | Defined by                                                                                                                                        |
| :---------------------------- | -------- | -------- | -------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| [url](#url)                   | `string` | Required | cannot be null | [Mount Point](mountpoint-oneof-1-properties-url.md "https&#x3A;//ns.adobe.com/helix/shared/mountpoint#/oneOf/1/properties/url")                   |
| [fallbackPath](#fallbackPath) | `string` | Optional | cannot be null | [Mount Point](mountpoint-oneof-1-properties-fallbackpath.md "https&#x3A;//ns.adobe.com/helix/shared/mountpoint#/oneOf/1/properties/fallbackPath") |

## url




`url`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [Mount Point](mountpoint-oneof-1-properties-url.md "https&#x3A;//ns.adobe.com/helix/shared/mountpoint#/oneOf/1/properties/url")

### url Type

`string`

### url Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc4291 "check the specification")

## fallbackPath

Specifies the fallback path if the requested item cannot be found. The fallback path is relative to the basepath of the item originally requested, so if the requested item is `/foo/bar.md` and the `fallbackPath` is `baz.md`, then `/foo/baz.md` will be the fallback item. 


`fallbackPath`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Mount Point](mountpoint-oneof-1-properties-fallbackpath.md "https&#x3A;//ns.adobe.com/helix/shared/mountpoint#/oneOf/1/properties/fallbackPath")

### fallbackPath Type

`string`
