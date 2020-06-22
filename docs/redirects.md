# Redirects Configuration Schema

```txt
https://ns.adobe.com/helix/shared/redirects
```

This configuration file enables the creation of programmatic redirects, rewrites, and vanity URLs.


| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                            |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | --------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [redirects.schema.json](redirects.schema.json "open original schema") |

## Redirects Configuration Type

`object` ([Redirects Configuration](redirects.md))

# Redirects Configuration Properties

| Property                | Type         | Required | Nullable       | Defined by                                                                                                                                    |
| :---------------------- | ------------ | -------- | -------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| [version](#version)     | Unknown Type | Optional | cannot be null | [Redirects Configuration](redirects-properties-version.md "https&#x3A;//ns.adobe.com/helix/shared/redirects#/properties/version")             |
| [redirects](#redirects) | `array`      | Optional | cannot be null | [Redirects Configuration](redirects-properties-redirects.md "https&#x3A;//ns.adobe.com/helix/shared/redirects#/properties/redirects")         |
| [vanity](#vanity)       | `object`     | Optional | cannot be null | [Redirects Configuration](redirects-properties-vanity-url-extractor.md "https&#x3A;//ns.adobe.com/helix/shared/redirects#/properties/vanity") |

## version

The redirect-config file format version


`version`

-   is optional
-   Type: any of the folllowing: `string` or `number` ([Details](redirects-properties-version.md))
-   cannot be null
-   defined in: [Redirects Configuration](redirects-properties-version.md "https&#x3A;//ns.adobe.com/helix/shared/redirects#/properties/version")

### version Type

any of the folllowing: `string` or `number` ([Details](redirects-properties-version.md))

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

## redirects




`redirects`

-   is optional
-   Type: an array of merged types ([Redirect](redirects-properties-redirects-redirect.md))
-   cannot be null
-   defined in: [Redirects Configuration](redirects-properties-redirects.md "https&#x3A;//ns.adobe.com/helix/shared/redirects#/properties/redirects")

### redirects Type

an array of merged types ([Redirect](redirects-properties-redirects-redirect.md))

### redirects Default Value

The default value is:

```json
[]
```

## vanity

Configure one or multiple vanity URL extractors, each extractor is a property of this object


`vanity`

-   is optional
-   Type: `object` ([Vanity URL extractor](redirects-properties-vanity-url-extractor.md))
-   cannot be null
-   defined in: [Redirects Configuration](redirects-properties-vanity-url-extractor.md "https&#x3A;//ns.adobe.com/helix/shared/redirects#/properties/vanity")

### vanity Type

`object` ([Vanity URL extractor](redirects-properties-vanity-url-extractor.md))

### vanity Default Value

The default value is:

```json
{}
```
