
# Origin Schema

```
https://ns.adobe.com/helix/shared/origin
```

Representation of a origin host for a proxy strain.

As proxy strains deliver content from another web server, the `origin` property can be used to specify the source of this third-party content to be served. In the simplest case, the `origin` property can be a simple URL, but for advanced configuration, all the properties in this schema are available.

The properties in this schema are largely identical with the properties defined in the [Fastly Backend API](https://docs.fastly.com/api/config#backend).

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [origin.schema.json](origin.schema.json) |

# Origin Properties

| Property | Type | Required | Nullable | Defined by |
|----------|------|----------|----------|------------|
| [address](#address) | `string` | Optional  | No | Origin (this schema) |
| [between_bytes_timeout](#between_bytes_timeout) | `integer` | Optional  | No | Origin (this schema) |
| [connect_timeout](#connect_timeout) | `string` | Optional  | No | Origin (this schema) |
| [error_threshold](#error_threshold) | `integer` | Optional  | No | Origin (this schema) |
| [first_byte_timeout](#first_byte_timeout) | `integer` | Optional  | No | Origin (this schema) |
| [hostname](#hostname) | `string` | Optional  | No | Origin (this schema) |
| [max_conn](#max_conn) | `integer` | Optional  | No | Origin (this schema) |
| [name](#name) | `string` | Optional  | No | Origin (this schema) |
| [override_host](#override_host) | `string` | Optional  | No | Origin (this schema) |
| [path](#path) | `string` | Optional  | No | Origin (this schema) |
| [port](#port) | `integer` | Optional  | No | Origin (this schema) |
| [shield](#shield) | `string` | Optional  | No | Origin (this schema) |
| [ssl_cert_hostname](#ssl_cert_hostname) | `string` | Optional  | No | Origin (this schema) |
| [use_ssl](#use_ssl) | `boolean` | Optional  | No | Origin (this schema) |
| [weight](#weight) | `integer` | Optional  | No | Origin (this schema) |

## address

An hostname, IPv4, or IPv6 address for the backend.

`address`

* is optional
* type: `string`
* defined in this schema

### address Type


`string`

* format: `hostname` – Domain Name (according to [RFC 1034, section 3.1](https://tools.ietf.org/html/rfc1034))






## between_bytes_timeout

How long to wait between bytes in milliseconds.

`between_bytes_timeout`

* is optional
* type: `integer`
* defined in this schema

### between_bytes_timeout Type


`integer`







## connect_timeout

How long to wait for a timeout in milliseconds.

`connect_timeout`

* is optional
* type: `string`
* defined in this schema

### connect_timeout Type


`string`







## error_threshold


`error_threshold`

* is optional
* type: `integer`
* defined in this schema

### error_threshold Type


`integer`







## first_byte_timeout

How long to wait for the first bytes in milliseconds.

`first_byte_timeout`

* is optional
* type: `integer`
* defined in this schema

### first_byte_timeout Type


`integer`







## hostname

The hostname of the backend.

`hostname`

* is optional
* type: `string`
* defined in this schema

### hostname Type


`string`

* format: `hostname` – Domain Name (according to [RFC 1034, section 3.1](https://tools.ietf.org/html/rfc1034))






## max_conn

Maximum number of connections.

`max_conn`

* is optional
* type: `integer`
* defined in this schema

### max_conn Type


`integer`







## name

The name of the backend.

`name`

* is optional
* type: `string`
* defined in this schema

### name Type


`string`







## override_host

The hostname to override the [Host header](https://docs.fastly.com/guides/basic-configuration/specifying-an-override-host).
By default, proxy strains use the `Host` header that was used to make the request to Helix's CDN, which is ideal for migration use cases where the existing backend expects to serve traffic to a hostname that has now been taken over by Helix. In cases where Helix is aggregating content from multiple hosts, and the backend won't serve any content to the domain name Helix is using, set the `override_host` property to an accepted `Host` header value.

`override_host`

* is optional
* type: `string`
* defined in this schema

### override_host Type


`string`

* format: `hostname` – Domain Name (according to [RFC 1034, section 3.1](https://tools.ietf.org/html/rfc1034))






## path

The base path to make requests again. For example, if your `origin` is `http://www.example.com/foo` and a request is made to your site using the URL `/bar`, a backend request to `http://www.example.com/foo/bar` will be made.

`path`

* is optional
* type: `string`
* defined in this schema

### path Type


`string`







## port

The port number.

`port`

* is optional
* type: `integer`
* defined in this schema

### port Type


`integer`







## shield

The shield POP designated to reduce inbound load on this origin by serving the cached data to the rest of the network.

`shield`

* is optional
* type: `string`
* defined in this schema

### shield Type


`string`







## ssl_cert_hostname

Overrides ssl_hostname, but only for cert verification. Does not affect SNI at all.

`ssl_cert_hostname`

* is optional
* type: `string`
* defined in this schema

### ssl_cert_hostname Type


`string`

* format: `hostname` – Domain Name (according to [RFC 1034, section 3.1](https://tools.ietf.org/html/rfc1034))






## use_ssl

Whether or not to use SSL to reach the backend.

`use_ssl`

* is optional
* type: `boolean`
* defined in this schema

### use_ssl Type


`boolean`





## weight

Weight used to load balance this backend against others.

`weight`

* is optional
* type: `integer`
* defined in this schema

### weight Type


`integer`






