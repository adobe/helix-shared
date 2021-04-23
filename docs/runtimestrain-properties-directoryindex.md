# Untitled string in Runtime Strain Schema

```txt
https://ns.adobe.com/helix/shared/runtimestrain#/properties/directoryIndex
```

Name of the resource to use for requests to directories (no extension).
When a request is made by the browser to `/help` and `directoryIndex=README.html`, then the request will be treated as if it was made to `/help/README.html`. Slashes (`/`) are not allowed in the directory index.

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                     |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :----------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [runtimestrain.schema.json*](runtimestrain.schema.json "open original schema") |

## directoryIndex Type

`string`

## directoryIndex Constraints

**pattern**: the string must match the following regular expression: 

```regexp
^[^/]+$
```

[try pattern](https://regexr.com/?expression=%5E%5B%5E%2F%5D%2B%24 "try regular expression with regexr.com")

## directoryIndex Default Value

The default value is:

```json
"index.html"
```
