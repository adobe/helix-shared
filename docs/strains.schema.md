
# Strains Schema

```
https://ns.adobe.com/helix/shared/strains
```

A map of strains. Every strain name must be unique for a given config.

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Permitted | [strains.schema.json](strains.schema.json) |

# Strains Properties

| Property | Type | Required | Defined by |
|----------|------|----------|------------|
| [default](#default) | complex | **Required** | Strains (this schema) |
| `*` | any | Additional | this schema *allows* additional properties |

## default


`default`

* is **required**
* type: complex
* defined in this schema

### default Type


**One** of the following *conditions* need to be fulfilled.


#### Condition 1


* []() – `https://ns.adobe.com/helix/shared/proxystrain`


#### Condition 2


* []() – `https://ns.adobe.com/helix/shared/runtimestrain`





