# Configuration Schema

```txt
https://ns.adobe.com/helix/shared/markupconfig
```

A Markup Configuration File for Project Helix.


| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                  |
| :------------------ | ---------- | ----------- | ------------ | :---------------- | --------------------- | ------------------- | --------------------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [markupconfig.schema.json](markupconfig.schema.json "open original schema") |

## Configuration Type

`object` ([Configuration](markupconfig.md))

# Configuration Properties

| Property                    | Type         | Required | Nullable       | Defined by                                                                                                                            |
| :-------------------------- | ------------ | -------- | -------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| [definitions](#definitions) | `object`     | Optional | cannot be null | [Configuration](markupconfig-properties-definitions.md "https&#x3A;//ns.adobe.com/helix/shared/markupconfig#/properties/definitions") |
| [version](#version)         | Unknown Type | Optional | cannot be null | [Configuration](markupconfig-properties-version.md "https&#x3A;//ns.adobe.com/helix/shared/markupconfig#/properties/version")         |
| [markup](#markup)           | `object`     | Required | cannot be null | [Configuration](markupconfig-properties-markup-configuration.md "https&#x3A;//ns.adobe.com/helix/shared/markup#/properties/markup")   |

## definitions

A container for referencable objects that can be re-used elsewhere in the configuration.


`definitions`

-   is optional
-   Type: `object` ([Details](markupconfig-properties-definitions.md))
-   cannot be null
-   defined in: [Configuration](markupconfig-properties-definitions.md "https&#x3A;//ns.adobe.com/helix/shared/markupconfig#/properties/definitions")

### definitions Type

`object` ([Details](markupconfig-properties-definitions.md))

## version

The helix-config file format version


`version`

-   is optional
-   Type: any of the folllowing: `string` or `number` ([Details](markupconfig-properties-version.md))
-   cannot be null
-   defined in: [Configuration](markupconfig-properties-version.md "https&#x3A;//ns.adobe.com/helix/shared/markupconfig#/properties/version")

### version Type

any of the folllowing: `string` or `number` ([Details](markupconfig-properties-version.md))

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

## markup

A container for markup mappings. Each markup mapping is a named key.


`markup`

-   is required
-   Type: `object` ([Markup Configuration](markupconfig-properties-markup-configuration.md))
-   cannot be null
-   defined in: [Configuration](markupconfig-properties-markup-configuration.md "https&#x3A;//ns.adobe.com/helix/shared/markup#/properties/markup")

### markup Type

`object` ([Markup Configuration](markupconfig-properties-markup-configuration.md))
