
# Redirect Rule Schema

```
https://ns.adobe.com/helix/shared/redirectrule
```

A strain is a combination of code and content that enables the creation of a digital experience. Strains can be used to create language variants of websites, A/B tests, personalization, or to aggregate content from multiple sources

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [redirectrule.schema.json](redirectrule.schema.json) |

# Redirect Rule Properties

| Property | Type | Required | Nullable | Defined by |
|----------|------|----------|----------|------------|
| [from](#from) | `string` | Optional  | No | Redirect Rule (this schema) |
| [to](#to) | `string` | Optional  | No | Redirect Rule (this schema) |

## from

A URL path or regular expression to match the path of a URL. It can contain capture groups that can be used in `to`.

`from`

* is optional
* type: `string`
* defined in this schema

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

* is optional
* type: `string`
* defined in this schema

### to Type


`string`






### to Examples

```json
"/new"
```

```json
"/new/$1.html"
```


