
# Proxy Strain Schema

```
https://ns.adobe.com/helix/shared/proxystrain
```

A strain is a combination of code and content that enables the creation of a digital experience. Strains can be used to create language variants of websites, A/B tests, personalization, or to aggregate content from multiple sources

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [proxystrain.schema.json](proxystrain.schema.json) |
## Schema Hierarchy

* Proxy Strain `https://ns.adobe.com/helix/shared/proxystrain`
  * [Runtime Strain](performance.schema.md) `https://ns.adobe.com/helix/shared/performance`


# Proxy Strain Properties

| Property | Type | Required | Defined by |
|----------|------|----------|------------|
| [condition](#condition) | `string` | Optional | Proxy Strain (this schema) |
| [origin](#origin) | complex | **Required** | Proxy Strain (this schema) |
| [params](#params) | `string[]` | Optional | Proxy Strain (this schema) |
| [perf](#perf) | Runtime Strain | Optional | Proxy Strain (this schema) |
| [sticky](#sticky) | `boolean` | Optional | Proxy Strain (this schema) |
| [url](#url) | `string` | Optional | Proxy Strain (this schema) |
| [urls](#urls) | `string[]` | Optional | Proxy Strain (this schema) |

## condition

VLC condition that controls that can optionally activate this strain.

`condition`

* is optional
* type: `string`
* defined in this schema

### condition Type


`string`







## origin

Origin backend for proxy strains.

`origin`

* is **required**
* type: complex
* defined in this schema

### origin Type


**Any** following *options* needs to be fulfilled.


#### Option 1


`string`

* format: `uri` – Uniformous Resource Identifier (according to [RFC3986](http://tools.ietf.org/html/rfc3986))



#### Option 2


* []() – `https://ns.adobe.com/helix/shared/origin`






## params

A whitelist (using globbing language) of URL parameters. Note: every parameter is a potential cache killer.

`params`

* is optional
* type: `string[]`
* defined in this schema

### params Type


Array type: `string[]`

All items must be of the type:
`string`










## perf


`perf`

* is optional
* type: Runtime Strain
* defined in this schema

### perf Type


* [Runtime Strain](performance.schema.md) – `https://ns.adobe.com/helix/shared/performance`





## sticky

Sticky strains are not re-evaluated on every request. As soon as a visitor is determined to match a sticky strain, a session cookie will be set to keep the user in the strain.

`sticky`

* is optional
* type: `boolean`
* defined in this schema

### sticky Type


`boolean`





## url

URL condition (note, this will be merged into a more general condition language)

`url`

* is optional
* type: `string`
* defined in this schema

### url Type


`string`

* format: `uri` – Uniformous Resource Identifier (according to [RFC3986](http://tools.ietf.org/html/rfc3986))






## urls

URL condition (note, this will be merged into a more general condition language)

`urls`

* is optional
* type: `string[]`
* defined in this schema

### urls Type


Array type: `string[]`

All items must be of the type:
`string`

* format: `uri` – Uniformous Resource Identifier (according to [RFC3986](http://tools.ietf.org/html/rfc3986))







