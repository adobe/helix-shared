# Configuration Schema

```txt
https://ns.adobe.com/helix/shared/config
```

A Configuration File for Project Helix.


| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                      |
| :------------------ | ---------- | ----------- | ------------ | :---------------- | --------------------- | ------------------- | --------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [config.schema.json](config.schema.json "open original schema") |

## Configuration Type

`object` ([Configuration](config.md))

# Configuration Properties

| Property                    | Type     | Required | Nullable       | Defined by                                                                                                                |
| :-------------------------- | -------- | -------- | -------------- | :------------------------------------------------------------------------------------------------------------------------ |
| [definitions](#definitions) | `object` | Optional | cannot be null | [Configuration](config-properties-definitions.md "https&#x3A;//ns.adobe.com/helix/shared/config#/properties/definitions") |
| [version](#version)         | Multiple | Optional | cannot be null | [Configuration](config-properties-version.md "https&#x3A;//ns.adobe.com/helix/shared/config#/properties/version")         |
| [strains](#strains)         | Merged   | Required | cannot be null | [Configuration](config-properties-strains.md "https&#x3A;//ns.adobe.com/helix/shared/strains#/properties/strains")        |

## definitions

A container for referencable objects that can be re-used elsewhere in the configuration.


`definitions`

-   is optional
-   Type: `object` ([Details](config-properties-definitions.md))
-   cannot be null
-   defined in: [Configuration](config-properties-definitions.md "https&#x3A;//ns.adobe.com/helix/shared/config#/properties/definitions")

### definitions Type

`object` ([Details](config-properties-definitions.md))

## version

The helix-config file format version


`version`

-   is optional
-   Type: any of the folllowing: `string` or `number` ([Details](config-properties-version.md))
-   cannot be null
-   defined in: [Configuration](config-properties-version.md "https&#x3A;//ns.adobe.com/helix/shared/config#/properties/version")

### version Type

any of the folllowing: `string` or `number` ([Details](config-properties-version.md))

### version Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value | Explanation |
| :---- | ----------- |
| `"1"` |             |
| `1`   |             |

### version Default Value

The default value is:

```json
1
```

## strains




`strains`

-   is required
-   Type: merged type ([Strains](config-properties-strains.md))
-   cannot be null
-   defined in: [Configuration](config-properties-strains.md "https&#x3A;//ns.adobe.com/helix/shared/strains#/properties/strains")

### strains Type

merged type ([Strains](config-properties-strains.md))

one (and only one) of

-   [Untitled array in Strains](strains-oneof-0.md "check type definition")
