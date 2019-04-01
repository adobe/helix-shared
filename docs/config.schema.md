
# Configuration Schema

```
https://ns.adobe.com/helix/shared/config
```

A Configuration File for Project Helix.

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [config.schema.json](config.schema.json) |
## Schema Hierarchy

* Configuration `https://ns.adobe.com/helix/shared/config`
  * [Strains](strains.schema.md) `https://ns.adobe.com/helix/shared/strains`


# Configuration Properties

| Property | Type | Required | Nullable | Default | Defined by |
|----------|------|----------|----------|---------|------------|
| [definitions](#definitions) | `object` | Optional  | No |  | Configuration (this schema) |
| [strains](#strains) | Strains | **Required**  | No |  | Configuration (this schema) |
| [version](#version) | `enum` | Optional  | No | `1` | Configuration (this schema) |

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


`strains`

* is **required**
* type: Strains
* defined in this schema

### strains Type


* [Strains](strains.schema.md) – `https://ns.adobe.com/helix/shared/strains`





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



