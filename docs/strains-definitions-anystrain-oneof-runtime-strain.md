# Runtime Strain Schema

```txt
https://ns.adobe.com/helix/shared/runtimestrain#/definitions/anystrain/oneOf/1
```

A runtime strain is a combination of code and content that enables the creation of a digital experience.

| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                         |
| :------------------ | :--------- | :---------- | :----------- | :---------------- | :-------------------- | :------------------ | :----------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [strains.schema.json*](strains.schema.json "open original schema") |

## 1 Type

`object` ([Runtime Strain](strains-definitions-anystrain-oneof-runtime-strain.md))

# 1 Properties

| Property                          | Type      | Required | Nullable       | Defined by                                                                                                                                |
| :-------------------------------- | :-------- | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| [name](#name)                     | `string`  | Required | cannot be null | [Runtime Strain](runtimestrain-properties-name.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/name")                     |
| [code](#code)                     | Merged    | Required | cannot be null | [Runtime Strain](runtimestrain-properties-code.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/code")                     |
| [content](#content)               | Merged    | Required | cannot be null | [Runtime Strain](runtimestrain-properties-content.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/content")               |
| [static](#static)                 | Merged    | Required | cannot be null | [Runtime Strain](runtimestrain-properties-static.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/static")                 |
| [directoryIndex](#directoryindex) | `string`  | Optional | cannot be null | [Runtime Strain](runtimestrain-properties-directoryindex.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/directoryIndex") |
| [sticky](#sticky)                 | `boolean` | Optional | cannot be null | [Runtime Strain](runtimestrain-properties-sticky.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/sticky")                 |
| [package](#package)               | Merged    | Optional | cannot be null | [Runtime Strain](runtimestrain-properties-package.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/package")               |
| [url](#url)                       | `string`  | Optional | cannot be null | [Runtime Strain](runtimestrain-properties-url.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/url")                       |
| [urls](#urls)                     | `array`   | Optional | cannot be null | [Runtime Strain](runtimestrain-properties-urls.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/urls")                     |
| [condition](#condition)           | Merged    | Optional | cannot be null | [Runtime Strain](runtimestrain-properties-condition.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/condition")           |
| [perf](#perf)                     | `object`  | Optional | cannot be null | [Runtime Strain](proxystrain-properties-performance.md "https://ns.adobe.com/helix/shared/performance#/properties/perf")                  |
| [version-lock](#version-lock)     | `object`  | Optional | cannot be null | [Runtime Strain](proxystrain-properties-version-lock.md "https://ns.adobe.com/helix/shared/version-lock#/properties/version-lock")        |
| [params](#params)                 | `array`   | Optional | cannot be null | [Runtime Strain](runtimestrain-properties-params.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/params")                 |
| [redirects](#redirects)           | `array`   | Optional | cannot be null | [Runtime Strain](runtimestrain-properties-redirects.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/redirects")           |

## name

Name of the strain

`name`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Runtime Strain](runtimestrain-properties-name.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/name")

### name Type

`string`

## code

Pointer to the code repository

`code`

*   is required

*   Type: merged type ([Details](runtimestrain-properties-code.md))

*   cannot be null

*   defined in: [Runtime Strain](runtimestrain-properties-code.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/code")

### code Type

merged type ([Details](runtimestrain-properties-code.md))

one (and only one) of

*   [Untitled string in Runtime Strain](runtimestrain-properties-code-oneof-0.md "check type definition")

*   [Git URL](runtimestrain-properties-code-oneof-git-url.md "check type definition")

## content

Pointer to the content repository

`content`

*   is required

*   Type: merged type ([Details](runtimestrain-properties-content.md))

*   cannot be null

*   defined in: [Runtime Strain](runtimestrain-properties-content.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/content")

### content Type

merged type ([Details](runtimestrain-properties-content.md))

one (and only one) of

*   [Untitled string in Runtime Strain](runtimestrain-properties-content-oneof-0.md "check type definition")

*   [Git URL](runtimestrain-properties-code-oneof-git-url.md "check type definition")

## static

Pointer to the repository for static resources

`static`

*   is required

*   Type: merged type ([Details](runtimestrain-properties-static.md))

*   cannot be null

*   defined in: [Runtime Strain](runtimestrain-properties-static.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/static")

### static Type

merged type ([Details](runtimestrain-properties-static.md))

one (and only one) of

*   [Untitled string in Runtime Strain](runtimestrain-properties-static-oneof-0.md "check type definition")

*   [Git URL](runtimestrain-properties-static-oneof-git-url.md "check type definition")

## directoryIndex

Name of the resource to use for requests to directories (no extension).
When a request is made by the browser to `/help` and `directoryIndex=README.html`, then the request will be treated as if it was made to `/help/README.html`. Slashes (`/`) are not allowed in the directory index.

`directoryIndex`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Runtime Strain](runtimestrain-properties-directoryindex.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/directoryIndex")

### directoryIndex Type

`string`

### directoryIndex Constraints

**pattern**: the string must match the following regular expression: 

```regexp
^[^/]+$
```

[try pattern](https://regexr.com/?expression=%5E%5B%5E%2F%5D%2B%24 "try regular expression with regexr.com")

### directoryIndex Default Value

The default value is:

```json
"index.html"
```

## sticky

Sticky strains are not re-evaluated on every request. As soon as a visitor is determined to match a sticky strain, a session cookie will be set to keep the user in the strain.

`sticky`

*   is optional

*   Type: `boolean`

*   cannot be null

*   defined in: [Runtime Strain](runtimestrain-properties-sticky.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/sticky")

### sticky Type

`boolean`

## package



`package`

*   is optional

*   Type: merged type ([Details](runtimestrain-properties-package.md))

*   cannot be null

*   defined in: [Runtime Strain](runtimestrain-properties-package.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/package")

### package Type

merged type ([Details](runtimestrain-properties-package.md))

one (and only one) of

*   [Untitled string in Runtime Strain](runtimestrain-properties-package-oneof-0.md "check type definition")

*   [Untitled string in Runtime Strain](runtimestrain-properties-package-oneof-1.md "check type definition")

*   [Untitled string in Runtime Strain](runtimestrain-properties-package-oneof-2.md "check type definition")

## url

URL condition.

**Warning**: this property has been deprecated in favour of adding the `url` to the `condition` property.

`url`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Runtime Strain](runtimestrain-properties-url.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/url")

### url Type

`string`

### url Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc3986 "check the specification")

## urls

List of known URLs for testing this strain

`urls`

*   is optional

*   Type: `string[]`

*   cannot be null

*   defined in: [Runtime Strain](runtimestrain-properties-urls.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/urls")

### urls Type

`string[]`

## condition

VLC condition that controls that can optionally activate this strain.

`condition`

*   is optional

*   Type: merged type ([Details](runtimestrain-properties-condition.md))

*   cannot be null

*   defined in: [Runtime Strain](runtimestrain-properties-condition.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/condition")

### condition Type

merged type ([Details](runtimestrain-properties-condition.md))

one (and only one) of

*   [Untitled string in Runtime Strain](runtimestrain-properties-condition-oneof-0.md "check type definition")

*   [Conditions](conditions-properties-conditions.md "check type definition")

## perf

Performance testing details.

`perf`

*   is optional

*   Type: `object` ([Performance](proxystrain-properties-performance.md))

*   cannot be null

*   defined in: [Runtime Strain](proxystrain-properties-performance.md "https://ns.adobe.com/helix/shared/performance#/properties/perf")

### perf Type

`object` ([Performance](proxystrain-properties-performance.md))

## version-lock



`version-lock`

*   is optional

*   Type: `object` ([Version Lock](proxystrain-properties-version-lock.md))

*   cannot be null

*   defined in: [Runtime Strain](proxystrain-properties-version-lock.md "https://ns.adobe.com/helix/shared/version-lock#/properties/version-lock")

### version-lock Type

`object` ([Version Lock](proxystrain-properties-version-lock.md))

### version-lock Examples

```yaml
helix-embed: v3
helix-data-embed: ci999

```

## params

A list (using globbing language) of accepted URL parameters. Note: every parameter is a potential cache killer.

`params`

*   is optional

*   Type: `string[]`

*   cannot be null

*   defined in: [Runtime Strain](runtimestrain-properties-params.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/params")

### params Type

`string[]`

## redirects

The redirect rules that should be applied to this strain

`redirects`

*   is optional

*   Type: `object[]` ([Redirect Rule](proxystrain-properties-redirects-redirect-rule.md))

*   cannot be null

*   defined in: [Runtime Strain](runtimestrain-properties-redirects.md "https://ns.adobe.com/helix/shared/runtimestrain#/properties/redirects")

### redirects Type

`object[]` ([Redirect Rule](proxystrain-properties-redirects-redirect-rule.md))
