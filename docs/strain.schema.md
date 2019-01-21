
# Strain Schema

```
https://ns.adobe.com/helix/shared/strain
```

A strain is a combination of code and content that enables the creation of a digital experience. Strains can be used to create language variants of websites, A/B tests, personalization, or to aggregate content from multiple sources

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [strain.schema.json](strain.schema.json) |

# Strain Properties

| Property | Type | Required | Default | Defined by |
|----------|------|----------|---------|------------|
| [code](#code) | complex | Optional |  | Strain (this schema) |
| [condition](#condition) | `string` | Optional |  | Strain (this schema) |
| [content](#content) | complex | Optional |  | Strain (this schema) |
| [directoryIndex](#directoryindex) | `string` | Optional | `"index.html"` | Strain (this schema) |
| [origin](#origin) | complex | Optional |  | Strain (this schema) |
| [static](#static) | complex | Optional |  | Strain (this schema) |
| [sticky](#sticky) | `boolean` | Optional |  | Strain (this schema) |
| [url](#url) | `string` | Optional |  | Strain (this schema) |
| [urls](#urls) | `string[]` | Optional |  | Strain (this schema) |

## code

Pointer to the code repository

`code`

* is optional
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

* is optional
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







## origin

Origin backend for proxy strains.

`origin`

* is optional
* type: complex
* defined in this schema

### origin Type


**One** of the following *conditions* need to be fulfilled.


#### Condition 1


`string`

* format: `uri` – Uniformous Resource Identifier (according to [RFC3986](http://tools.ietf.org/html/rfc3986))



#### Condition 2


* []() – `https://ns.adobe.com/helix/shared/origin`






## static

Pointer to the repository for static resources

`static`

* is optional
* type: complex
* defined in this schema

### static Type


**One** of the following *conditions* need to be fulfilled.


#### Condition 1


`string`

* format: `uri` – Uniformous Resource Identifier (according to [RFC3986](http://tools.ietf.org/html/rfc3986))



#### Condition 2


* []() – `https://ns.adobe.com/helix/shared/giturl`






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







