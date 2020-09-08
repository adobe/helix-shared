# Proxy Strain Schema

```txt
https://ns.adobe.com/helix/shared/proxystrain
```

A proxy strain is a strain that serves content from another web server, acting as a pure proxy.

## How are Proxy Strains configured?

Add an `origin` property to your strain object in the `helix-config.yaml`. The `origin` property can be either the base URL of the web server that you want to serve content from
or a more complex configuration object, described in the [Origin schema](origin.schema.md).

Most of the other properties that can be used to describe other strains (i.e. [Runtime strains](runtimestrain.schema.md)) do not work for Proxy strains and are not just irrelevant, but also forbidden.

## What are useful scenarios for Proxy Strains?

You can use Proxy Strains in a number of scenarios:

-   in order to integrate non-Helix web applications that should run on the same hostname
-   in order to serve legacy content from an old website as a fallback
-   in order to enable a gradual migration of an existing site to Helix

A good pattern for migrating to Project Helix is to define one proxy strain as the `default` that serves the old site from the current backend.

Over time, add more and more runtime strains that are powered by Helix and adjust the `url` and `conditions` so that they receive more traffic.


| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                |
| :------------------ | ---------- | ----------- | ------------ | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [proxystrain.schema.json](proxystrain.schema.json "open original schema") |

## Proxy Strain Type

`object` ([Proxy Strain](proxystrain.md))

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

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc3986 "check the specification")

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

A list (using globbing language) of accepted URL parameters. Note: every parameter is a potential cache killer.


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
