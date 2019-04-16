
# Runtime Strain Schema

```
https://ns.adobe.com/helix/shared/namedruntimestrain
```

A runtime strain is a combination of code and content that enables the creation of a digital experience.

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [namedruntimestrain.schema.json](namedruntimestrain.schema.json) |
## Schema Hierarchy

* Runtime Strain `https://ns.adobe.com/helix/shared/namedruntimestrain`
  * [Runtime Strain](performance.schema.md) `https://ns.adobe.com/helix/shared/performance`


# Runtime Strain Properties

| Property | Type | Required | Default | Defined by |
|----------|------|----------|---------|------------|
| [code](#code) | complex | **Required** |  | Runtime Strain (this schema) |
| [condition](#condition) | `string` | Optional |  | Runtime Strain (this schema) |
| [content](#content) | complex | **Required** |  | Runtime Strain (this schema) |
| [directoryIndex](#directoryindex) | `string` | Optional | `"index.html"` | Runtime Strain (this schema) |
| [name](#name) | `string` | **Required** |  | Runtime Strain (this schema) |
| [package](#package) | `string` | Optional |  | Runtime Strain (this schema) |
| [params](#params) | `string[]` | Optional |  | Runtime Strain (this schema) |
| [perf](#perf) | Runtime Strain | Optional |  | Runtime Strain (this schema) |
| [redirects](#redirects) | Redirect Rule | Optional |  | Runtime Strain (this schema) |
| [static](#static) | complex | **Required** |  | Runtime Strain (this schema) |
| [sticky](#sticky) | `boolean` | Optional |  | Runtime Strain (this schema) |
| [url](#url) | `string` | Optional |  | Runtime Strain (this schema) |
| [urls](#urls) | `string[]` | Optional |  | Runtime Strain (this schema) |

## code

Pointer to the code repository

`code`

* is **required**
* type: complex
* defined in this schema

### code Type


**One** of the following *conditions* need to be fulfilled.


#### Condition 1


`string`

* format: `uri` – Uniformous Resource Identifier (according to [RFC3986](http://tools.ietf.org/html/rfc3986))



#### Condition 2


* []() – `https://ns.adobe.com/helix/shared/giturl`






## condition

VLC condition that controls that can optionally activate this strain.

`condition`

* is optional
* type: `string`
* defined in this schema

### condition Type


`string`







## content

Pointer to the content repository

`content`

* is **required**
* type: complex
* defined in this schema

### content Type


**One** of the following *conditions* need to be fulfilled.


#### Condition 1


`string`

* format: `uri` – Uniformous Resource Identifier (according to [RFC3986](http://tools.ietf.org/html/rfc3986))



#### Condition 2


* []() – `https://ns.adobe.com/helix/shared/giturl`






## directoryIndex

Name of the resource to use for requests to directories (no extension).

`directoryIndex`

* is optional
* type: `string`
* default: `"index.html"`
* defined in this schema

### directoryIndex Type


`string`







## name

Name of the strain

`name`

* is **required**
* type: `string`
* defined in this schema

### name Type


`string`







## package

Name of the action package that renders this strain.

`package`

* is optional
* type: `string`
* defined in this schema

### package Type


`string`







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








## static

Pointer to the repository for static resources

`static`

* is **required**
* type: complex
* defined in this schema

### static Type


**One** of the following *conditions* need to be fulfilled.


#### Condition 1


`string`

* format: `uri` – Uniformous Resource Identifier (according to [RFC3986](http://tools.ietf.org/html/rfc3986))



#### Condition 2


* []() – `https://ns.adobe.com/helix/shared/staticgiturl`






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

List of known URLs for testing this strain

`urls`

* is optional
* type: `string[]`
* defined in this schema

### urls Type


Array type: `string[]`

All items must be of the type:
`string`

* format: `uri` – Uniformous Resource Identifier (according to [RFC3986](http://tools.ietf.org/html/rfc3986))







