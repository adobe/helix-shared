
# Strain Schema

```
https://ns.adobe.com/helix/shared/strain
```

A strain is a combination of code and content that enables the creation of a digital experience. Strains can be used to create language variants of websites, A/B tests, personalization, or to aggregate content from multiple sources

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [strain.schema.json](strain.schema.json) |

# Strain Properties

| Property | Type | Required | Defined by |
|----------|------|----------|------------|
| [code](#code) | complex | **Required** | Strain (this schema) |
| [content](#content) | complex | **Required** | Strain (this schema) |

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





