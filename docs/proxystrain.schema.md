
# Proxy Strain Schema

```
https://ns.adobe.com/helix/shared/proxystrain
```

A proxy strain is a strain that serves content from another web server, acting as a pure proxy.

## How are Proxy Strains configured?

Add an `origin` property to your strain object in the `helix-config.yaml`. The `origin` property can be either the base URL of the web server that you want to serve content from
or a more complex configuration object, described in the [Origin schema](origin.schema.md).

Most of the other properties that can be used to describe other strains (i.e. [Runtime strains](runtimestrain.schema.md)) do not work for Proxy strains and are not just irrelevant, but also forbidden.

## What are useful scenarios for Proxy Strains?

You can use Proxy Strains in a number of scenarios:

- in order to integrate non-Helix web applications that should run on the same hostname
- in order to serve legacy content from an old website as a fallback
- in order to enable a gradual migration of an existing site to Helix

A good pattern for migrating to Project Helix is to define one proxy strain as the `default` that serves the old site from the current backend.

Over time, add more and more runtime strains that are powered by Helix and adjust the `url` and `conditions` so that they receive more traffic.

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [proxystrain.schema.json](proxystrain.schema.json) |
## Schema Hierarchy

* Proxy Strain `https://ns.adobe.com/helix/shared/proxystrain`
  * [Performance](performance.schema.md) `https://ns.adobe.com/helix/shared/performance`


# Proxy Strain Properties

| Property | Type | Required | Nullable | Defined by |
|----------|------|----------|----------|------------|
| [condition](#condition) | complex | Optional  | No | Proxy Strain (this schema) |
| [name](#name) | `string` | **Required**  | No | Proxy Strain (this schema) |
| [origin](#origin) | complex | **Required**  | No | Proxy Strain (this schema) |
| [params](#params) | `string[]` | Optional  | No | Proxy Strain (this schema) |
| [perf](#perf) | Performance | Optional  | No | Proxy Strain (this schema) |
| [redirects](#redirects) | Redirect Rule | Optional  | No | Proxy Strain (this schema) |
| [sticky](#sticky) | `boolean` | Optional  | No | Proxy Strain (this schema) |
| [url](#url) | `string` | Optional  | No | Proxy Strain (this schema) |
| [urls](#urls) | `string[]` | Optional  | No | Proxy Strain (this schema) |

## condition

VLC condition that controls that can optionally activate this strain.

`condition`

* is optional
* type: complex
* defined in this schema

### condition Type


**One** of the following *conditions* need to be fulfilled.


#### Condition 1


`string`




#### Condition 2


* []() – `https://ns.adobe.com/helix/shared/conditions`






## name

Name of the strain

`name`

* is **required**
* type: `string`
* defined in this schema

### name Type


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
* type: Performance
* defined in this schema

### perf Type


* [Performance](performance.schema.md) – `https://ns.adobe.com/helix/shared/performance`





## redirects

The redirect rules that should be applied to this strain

`redirects`

* is optional
* type: Redirect Rule
* defined in this schema

### redirects Type


Array type: Redirect Rule

All items must be of the type:
* [Redirect Rule](redirectrule.schema.md) – `https://ns.adobe.com/helix/shared/redirectrule`








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







