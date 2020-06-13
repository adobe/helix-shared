# Proxy Strain Schema

```txt
https://ns.adobe.com/helix/shared/proxystrain#/definitions/anystrain/oneOf/0
```

A strain is a combination of code and content that enables the creation of a digital experience. Strains can be used to create language variants of websites, A/B tests, personalization, or to aggregate content from multiple sources


| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                          |
| :------------------ | ---------- | ----------- | ------------ | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [strains.schema.json\*](strains.schema.json "open original schema") |

## 0 Type

`object` ([Proxy Strain](strains-definitions-anystrain-oneof-proxy-strain.md))

# Proxy Strain Properties

| Property                | Type      | Required | Nullable       | Defined by                                                                                                                     |
| :---------------------- | --------- | -------- | -------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| [name](#name)           | `string`  | Required | cannot be null | [Proxy Strain](proxystrain-properties-name.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/name")           |
| [origin](#origin)       | Merged    | Required | cannot be null | [Proxy Strain](proxystrain-properties-origin.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/origin")       |
| [sticky](#sticky)       | `boolean` | Optional | cannot be null | [Proxy Strain](proxystrain-properties-sticky.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/sticky")       |
| [url](#url)             | `string`  | Optional | cannot be null | [Proxy Strain](proxystrain-properties-url.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/url")             |
| [urls](#urls)           | `array`   | Optional | cannot be null | [Proxy Strain](proxystrain-properties-urls.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/urls")           |
| [condition](#condition) | Merged    | Optional | cannot be null | [Proxy Strain](proxystrain-properties-condition.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/condition") |
| [perf](#perf)           | `object`  | Optional | cannot be null | [Proxy Strain](proxystrain-properties-performance.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/perf")    |
| [params](#params)       | `array`   | Optional | cannot be null | [Proxy Strain](proxystrain-properties-params.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/params")       |
| [redirects](#redirects) | `array`   | Optional | cannot be null | [Proxy Strain](proxystrain-properties-redirects.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/redirects") |

## name

Name of the strain


`name`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [Proxy Strain](proxystrain-properties-name.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/name")

### name Type

`string`

## origin

Origin backend for proxy strains.


`origin`

-   is required
-   Type: merged type ([Details](proxystrain-properties-origin.md))
-   cannot be null
-   defined in: [Proxy Strain](proxystrain-properties-origin.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/origin")

### origin Type

merged type ([Details](proxystrain-properties-origin.md))

any of

-   [Untitled string in Proxy Strain](proxystrain-properties-origin-anyof-0.md "check type definition")
-   [Origin](proxystrain-properties-origin-anyof-origin.md "check type definition")

## sticky

Sticky strains are not re-evaluated on every request. As soon as a visitor is determined to match a sticky strain, a session cookie will be set to keep the user in the strain.


`sticky`

-   is optional
-   Type: `boolean`
-   cannot be null
-   defined in: [Proxy Strain](proxystrain-properties-sticky.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/sticky")

### sticky Type

`boolean`

## url

URL condition.

**Warning**: this property has been deprecated in favour of adding the `url` to the `condition` property.


`url`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Proxy Strain](proxystrain-properties-url.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/url")

### url Type

`string`

### url Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc4291 "check the specification")

## urls

List of known URLs for testing this strain


`urls`

-   is optional
-   Type: `string[]`
-   cannot be null
-   defined in: [Proxy Strain](proxystrain-properties-urls.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/urls")

### urls Type

`string[]`

## condition

VLC condition that controls that can optionally activate this strain.


`condition`

-   is optional
-   Type: merged type ([Details](proxystrain-properties-condition.md))
-   cannot be null
-   defined in: [Proxy Strain](proxystrain-properties-condition.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/condition")

### condition Type

merged type ([Details](proxystrain-properties-condition.md))

one (and only one) of

-   [Untitled string in Proxy Strain](proxystrain-properties-condition-oneof-0.md "check type definition")
-   [Conditions](conditions-properties-conditions.md "check type definition")

## perf

Performance testing details.


`perf`

-   is optional
-   Type: `object` ([Performance](proxystrain-properties-performance.md))
-   cannot be null
-   defined in: [Proxy Strain](proxystrain-properties-performance.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/perf")

### perf Type

`object` ([Performance](proxystrain-properties-performance.md))

## params

A list (using globbing language) of accepted of URL parameters. Note: every parameter is a potential cache killer.


`params`

-   is optional
-   Type: `string[]`
-   cannot be null
-   defined in: [Proxy Strain](proxystrain-properties-params.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/params")

### params Type

`string[]`

## redirects

The redirect rules that should be applied to this strain


`redirects`

-   is optional
-   Type: `object[]` ([Redirect Rule](proxystrain-properties-redirects-redirect-rule.md))
-   cannot be null
-   defined in: [Proxy Strain](proxystrain-properties-redirects.md "https&#x3A;//ns.adobe.com/helix/shared/proxystrain#/properties/redirects")

### redirects Type

`object[]` ([Redirect Rule](proxystrain-properties-redirects-redirect-rule.md))
