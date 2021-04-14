# Untitled string in Origin Schema

```txt
https://ns.adobe.com/helix/shared/origin#/properties/ssl_cert_hostname
```

Overrides ssl_hostname, but only for cert verification. Does not affect SNI at all.

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                       |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :--------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [origin.schema.json*](origin.schema.json "open original schema") |

## ssl_cert_hostname Type

`string`

## ssl_cert_hostname Constraints

**hostname**: the string must be a hostname, according to [RFC 1123, section 2.1](https://tools.ietf.org/html/rfc1123 "check the specification")
