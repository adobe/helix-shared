# Redirect Rule Schema

```txt
https://ns.adobe.com/helix/shared/redirectrule
```

A strain is a combination of code and content that enables the creation of a digital experience. Strains can be used to create language variants of websites, A/B tests, personalization, or to aggregate content from multiple sources


| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                  |
| :------------------ | ---------- | ----------- | ------------ | :---------------- | --------------------- | ------------------- | --------------------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [redirectrule.schema.json](redirectrule.schema.json "open original schema") |

## Redirect Rule Type

`object` ([Redirect Rule](redirectrule.md))

# Redirect Rule Properties

| Property      | Type     | Required | Nullable       | Defined by                                                                                                              |
| :------------ | -------- | -------- | -------------- | :---------------------------------------------------------------------------------------------------------------------- |
| [from](#from) | `string` | Optional | cannot be null | [Redirect Rule](redirectrule-properties-from.md "https&#x3A;//ns.adobe.com/helix/shared/redirectrule#/properties/from") |
| [to](#to)     | `string` | Optional | cannot be null | [Redirect Rule](redirectrule-properties-to.md "https&#x3A;//ns.adobe.com/helix/shared/redirectrule#/properties/to")     |

## from

A URL path or regular expression to match the path of a URL. It can contain capture groups that can be used in `to`.


`from`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Redirect Rule](redirectrule-properties-from.md "https&#x3A;//ns.adobe.com/helix/shared/redirectrule#/properties/from")

### from Type

`string`

### from Examples

```json
"/old"
```

```json
"/old/(.*)\\.php$"
```

## to

A replacement string that replaces matched URLs found in `from`.


`to`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Redirect Rule](redirectrule-properties-to.md "https&#x3A;//ns.adobe.com/helix/shared/redirectrule#/properties/to")

### to Type

`string`

### to Examples

```json
"/new"
```

```json
"/new/$1.html"
```
