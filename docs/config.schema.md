
# Configuration Schema

```
https://ns.adobe.com/helix/shared/config
```

A Configuration File for Project Helix.

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [config.schema.json](config.schema.json) |

# Configuration Properties

| Property | Type | Required | Default | Defined by |
|----------|------|----------|---------|------------|
| [definitions](#definitions) | `object` | Optional |  | Configuration (this schema) |
| [strains](#strains) | `object` | **Required** |  | Configuration (this schema) |
| [version](#version) | `enum` | Optional | `1` | Configuration (this schema) |

## definitions

A container for referencable objects that can be re-used elsewhere in the configuration.

`definitions`

* is optional
* type: `object`
* defined in this schema

### definitions Type


`object` with following properties:


| Property | Type | Required |
|----------|------|----------|






## strains

A map of strains. Every strain name must be unique for a given config.

`strains`

* is **required**
* type: `object`
* defined in this schema

### strains Type


`object` with following properties:


| Property | Type | Required |
|----------|------|----------|
| `default`|  | **Required** |



#### default

undefined

`default`

* is **required**
* type: reference

##### default Type


* []() – `https://ns.adobe.com/helix/shared/strain`










## version

The helix-config file format version

`version`

* is optional
* type: `enum`
* default: `1`
* defined in this schema

The value of this property **must** be equal to one of the [known values below](#version-known-values).

### version Known Values
| Value | Description |
|-------|-------------|
| `1` |  |



