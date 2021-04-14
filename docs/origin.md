# Origin Schema

```txt
https://ns.adobe.com/helix/shared/origin
```

Representation of a origin host for a proxy strain.

As proxy strains deliver content from another web server, the `origin` property can be used to specify the source of this third-party content to be served. In the simplest case, the `origin` property can be a simple URL, but for advanced configuration, all the properties in this schema are available.

The properties in this schema are largely identical with the properties defined in the [Fastly Backend API](https://docs.fastly.com/api/config#backend).

| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                      |
| :------------------ | :--------- | :---------- | :----------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [origin.schema.json](origin.schema.json "open original schema") |

## Origin Type

`object` ([Origin](origin.md))

# Origin Properties

| Property                                        | Type      | Required | Nullable       | Defined by                                                                                                                        |
| :---------------------------------------------- | :-------- | :------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| [hostname](#hostname)                           | `string`  | Optional | cannot be null | [Origin](origin-properties-hostname.md "https://ns.adobe.com/helix/shared/origin#/properties/hostname")                           |
| [port](#port)                                   | `integer` | Optional | cannot be null | [Origin](origin-properties-port.md "https://ns.adobe.com/helix/shared/origin#/properties/port")                                   |
| [error_threshold](#error_threshold)             | `integer` | Optional | cannot be null | [Origin](origin-properties-error_threshold.md "https://ns.adobe.com/helix/shared/origin#/properties/error_threshold")             |
| [first_byte_timeout](#first_byte_timeout)       | `integer` | Optional | cannot be null | [Origin](origin-properties-first_byte_timeout.md "https://ns.adobe.com/helix/shared/origin#/properties/first_byte_timeout")       |
| [weight](#weight)                               | `integer` | Optional | cannot be null | [Origin](origin-properties-weight.md "https://ns.adobe.com/helix/shared/origin#/properties/weight")                               |
| [address](#address)                             | `string`  | Optional | cannot be null | [Origin](origin-properties-address.md "https://ns.adobe.com/helix/shared/origin#/properties/address")                             |
| [connect_timeout](#connect_timeout)             | `string`  | Optional | cannot be null | [Origin](origin-properties-connect_timeout.md "https://ns.adobe.com/helix/shared/origin#/properties/connect_timeout")             |
| [name](#name)                                   | `string`  | Optional | cannot be null | [Origin](origin-properties-name.md "https://ns.adobe.com/helix/shared/origin#/properties/name")                                   |
| [between_bytes_timeout](#between_bytes_timeout) | `integer` | Optional | cannot be null | [Origin](origin-properties-between_bytes_timeout.md "https://ns.adobe.com/helix/shared/origin#/properties/between_bytes_timeout") |
| [shield](#shield)                               | `string`  | Optional | cannot be null | [Origin](origin-properties-shield.md "https://ns.adobe.com/helix/shared/origin#/properties/shield")                               |
| [ssl_cert_hostname](#ssl_cert_hostname)         | `string`  | Optional | cannot be null | [Origin](origin-properties-ssl_cert_hostname.md "https://ns.adobe.com/helix/shared/origin#/properties/ssl_cert_hostname")         |
| [max_conn](#max_conn)                           | `integer` | Optional | cannot be null | [Origin](origin-properties-max_conn.md "https://ns.adobe.com/helix/shared/origin#/properties/max_conn")                           |
| [use_ssl](#use_ssl)                             | `boolean` | Optional | cannot be null | [Origin](origin-properties-use_ssl.md "https://ns.adobe.com/helix/shared/origin#/properties/use_ssl")                             |
| [path](#path)                                   | `string`  | Optional | cannot be null | [Origin](origin-properties-path.md "https://ns.adobe.com/helix/shared/origin#/properties/path")                                   |
| [override_host](#override_host)                 | `string`  | Optional | cannot be null | [Origin](origin-properties-override_host.md "https://ns.adobe.com/helix/shared/origin#/properties/override_host")                 |

## hostname

The hostname of the backend.

`hostname`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Origin](origin-properties-hostname.md "https://ns.adobe.com/helix/shared/origin#/properties/hostname")

### hostname Type

`string`

### hostname Constraints

**hostname**: the string must be a hostname, according to [RFC 1123, section 2.1](https://tools.ietf.org/html/rfc1123 "check the specification")

## port

The port number.

`port`

*   is optional

*   Type: `integer`

*   cannot be null

*   defined in: [Origin](origin-properties-port.md "https://ns.adobe.com/helix/shared/origin#/properties/port")

### port Type

`integer`

## error_threshold



`error_threshold`

*   is optional

*   Type: `integer`

*   cannot be null

*   defined in: [Origin](origin-properties-error_threshold.md "https://ns.adobe.com/helix/shared/origin#/properties/error_threshold")

### error_threshold Type

`integer`

## first_byte_timeout

How long to wait for the first bytes in milliseconds.

`first_byte_timeout`

*   is optional

*   Type: `integer`

*   cannot be null

*   defined in: [Origin](origin-properties-first_byte_timeout.md "https://ns.adobe.com/helix/shared/origin#/properties/first_byte_timeout")

### first_byte_timeout Type

`integer`

## weight

Weight used to load balance this backend against others.

`weight`

*   is optional

*   Type: `integer`

*   cannot be null

*   defined in: [Origin](origin-properties-weight.md "https://ns.adobe.com/helix/shared/origin#/properties/weight")

### weight Type

`integer`

## address

An hostname, IPv4, or IPv6 address for the backend.

`address`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Origin](origin-properties-address.md "https://ns.adobe.com/helix/shared/origin#/properties/address")

### address Type

`string`

### address Constraints

**hostname**: the string must be a hostname, according to [RFC 1123, section 2.1](https://tools.ietf.org/html/rfc1123 "check the specification")

## connect_timeout

How long to wait for a timeout in milliseconds.

`connect_timeout`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Origin](origin-properties-connect_timeout.md "https://ns.adobe.com/helix/shared/origin#/properties/connect_timeout")

### connect_timeout Type

`string`

## name

The name of the backend.

`name`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Origin](origin-properties-name.md "https://ns.adobe.com/helix/shared/origin#/properties/name")

### name Type

`string`

## between_bytes_timeout

How long to wait between bytes in milliseconds.

`between_bytes_timeout`

*   is optional

*   Type: `integer`

*   cannot be null

*   defined in: [Origin](origin-properties-between_bytes_timeout.md "https://ns.adobe.com/helix/shared/origin#/properties/between_bytes_timeout")

### between_bytes_timeout Type

`integer`

## shield

The shield POP designated to reduce inbound load on this origin by serving the cached data to the rest of the network.

`shield`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Origin](origin-properties-shield.md "https://ns.adobe.com/helix/shared/origin#/properties/shield")

### shield Type

`string`

## ssl_cert_hostname

Overrides ssl_hostname, but only for cert verification. Does not affect SNI at all.

`ssl_cert_hostname`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Origin](origin-properties-ssl_cert_hostname.md "https://ns.adobe.com/helix/shared/origin#/properties/ssl_cert_hostname")

### ssl_cert_hostname Type

`string`

### ssl_cert_hostname Constraints

**hostname**: the string must be a hostname, according to [RFC 1123, section 2.1](https://tools.ietf.org/html/rfc1123 "check the specification")

## max_conn

Maximum number of connections.

`max_conn`

*   is optional

*   Type: `integer`

*   cannot be null

*   defined in: [Origin](origin-properties-max_conn.md "https://ns.adobe.com/helix/shared/origin#/properties/max_conn")

### max_conn Type

`integer`

## use_ssl

Whether or not to use SSL to reach the backend.

`use_ssl`

*   is optional

*   Type: `boolean`

*   cannot be null

*   defined in: [Origin](origin-properties-use_ssl.md "https://ns.adobe.com/helix/shared/origin#/properties/use_ssl")

### use_ssl Type

`boolean`

## path

The base path to make requests again. For example, if your `origin` is `http://www.example.com/foo` and a request is made to your site using the URL `/bar`, a backend request to `http://www.example.com/foo/bar` will be made.

`path`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Origin](origin-properties-path.md "https://ns.adobe.com/helix/shared/origin#/properties/path")

### path Type

`string`

## override_host

The hostname to override the [Host header](https://docs.fastly.com/guides/basic-configuration/specifying-an-override-host).
By default, proxy strains use the `Host` header that was used to make the request to Helix's CDN, which is ideal for migration use cases where the existing backend expects to serve traffic to a hostname that has now been taken over by Helix. In cases where Helix is aggregating content from multiple hosts, and the backend won't serve any content to the domain name Helix is using, set the `override_host` property to an accepted `Host` header value.

`override_host`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Origin](origin-properties-override_host.md "https://ns.adobe.com/helix/shared/origin#/properties/override_host")

### override_host Type

`string`

### override_host Constraints

**hostname**: the string must be a hostname, according to [RFC 1123, section 2.1](https://tools.ietf.org/html/rfc1123 "check the specification")
