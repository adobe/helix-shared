# Untitled string in Origin Schema

```txt
https://ns.adobe.com/helix/shared/origin#/properties/override_host
```

The hostname to override the [Host header](https://docs.fastly.com/guides/basic-configuration/specifying-an-override-host).
By default, proxy strains use the `Host` header that was used to make the request to Helix's CDN, which is ideal for migration use cases where the existing backend expects to serve traffic to a hostname that has now been taken over by Helix. In cases where Helix is aggregating content from multiple hosts, and the backend won't serve any content to the domain name Helix is using, set the `override_host` property to an accepted `Host` header value.


| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                        |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | ----------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [origin.schema.json\*](origin.schema.json "open original schema") |

## override_host Type

`string`

## override_host Constraints

**hostname**: the string must be a hostname, according to [RFC 1123, section 2.1](https://tools.ietf.org/html/rfc1123 "check the specification")
