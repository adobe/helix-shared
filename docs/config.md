# Configuration Schema

```txt
https://ns.adobe.com/helix/shared/config
```

The Strains configuration for a Project Helix website.

The `helix-config.yaml` file contains the list of Strains that have been configured for a Helix site.

Each strain represents a variant of the site. It is required to have a default strain for each website. A strain is either a [Runtime strain](runtimestrain.md), if it's powered by the Helix pipeline on Adobe I/O Runtime, or a [Proxy strain](proxystrain.md), if it's serving content from another host.

All strains can have [Conditions](conditions.md) that determine if a visitor is eligible to see a certain strain. If a request fulfills the conditions of multiple strains, the first eligible strain will be served. This is why order of the strains in `helix-config.yaml` is important.

| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                      |
| :------------------ | :--------- | :---------- | :----------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [config.schema.json](config.schema.json "open original schema") |

## Configuration Type

`object` ([Configuration](config.md))

## Configuration Examples

```yaml
strains:
  - name: preview
    owner: adobe
    repo: project-helix.io
    ref: preview
    condition:
      url: https://preview.project.helix.io/
  - name: legacy
    origin: https://www.adobe.io/helix
    condition:
      url: https://www.project.helix.io/
  - name: default
    owner: adobe
    repo: project-helix.io
    ref: master

```

# Configuration Properties

| Property                    | Type     | Required | Nullable       | Defined by                                                                                                           |
| :-------------------------- | :------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------- |
| [definitions](#definitions) | `object` | Optional | cannot be null | [Configuration](config-properties-definitions.md "https://ns.adobe.com/helix/shared/config#/properties/definitions") |
| [version](#version)         | Multiple | Optional | cannot be null | [Configuration](config-properties-version.md "https://ns.adobe.com/helix/shared/config#/properties/version")         |
| [strains](#strains)         | Merged   | Required | cannot be null | [Configuration](config-properties-strains.md "https://ns.adobe.com/helix/shared/strains#/properties/strains")        |
| [preflight](#preflight)     | `string` | Optional | cannot be null | [Configuration](config-properties-preflight.md "https://ns.adobe.com/helix/shared/config#/properties/preflight")     |

## definitions

A container for referencable objects that can be re-used elsewhere in the configuration.

`definitions`

*   is optional

*   Type: `object` ([Details](config-properties-definitions.md))

*   cannot be null

*   defined in: [Configuration](config-properties-definitions.md "https://ns.adobe.com/helix/shared/config#/properties/definitions")

### definitions Type

`object` ([Details](config-properties-definitions.md))

## version

The helix-config file format version

`version`

*   is optional

*   Type: any of the folllowing: `string` or `number` ([Details](config-properties-version.md))

*   cannot be null

*   defined in: [Configuration](config-properties-version.md "https://ns.adobe.com/helix/shared/config#/properties/version")

### version Type

any of the folllowing: `string` or `number` ([Details](config-properties-version.md))

### version Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value | Explanation |
| :---- | :---------- |
| `"1"` |             |
| `1`   |             |

### version Default Value

The default value is:

```json
1
```

## strains



`strains`

*   is required

*   Type: merged type ([Strains](config-properties-strains.md))

*   cannot be null

*   defined in: [Configuration](config-properties-strains.md "https://ns.adobe.com/helix/shared/strains#/properties/strains")

### strains Type

merged type ([Strains](config-properties-strains.md))

one (and only one) of

*   [Untitled array in Strains](strains-oneof-0.md "check type definition")

## preflight

The URL of a preflight check that should be performed before assigning a strain to a request. The headers returned by this preflight request can be used in strain conditions.

`preflight`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Configuration](config-properties-preflight.md "https://ns.adobe.com/helix/shared/config#/properties/preflight")

### preflight Type

`string`

### preflight Constraints

**pattern**: the string must match the following regular expression: 

```regexp
^https://adobeioruntime\.net/|^https://[^.]*\.anywhere\.run/
```

[try pattern](https://regexr.com/?expression=%5Ehttps%3A%2F%2Fadobeioruntime%5C.net%2F%7C%5Ehttps%3A%2F%2F%5B%5E.%5D\*%5C.anywhere%5C.run%2F "try regular expression with regexr.com")

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc3986 "check the specification")
