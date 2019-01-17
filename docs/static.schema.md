
# Static Schema

```
https://ns.adobe.com/helix/shared/static
```

Where static assets for web applications are coming from

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [static.schema.json](static.schema.json) |

# Static Properties

| Property | Type | Required | Defined by |
|----------|------|----------|------------|
| [allow](#allow) | `string[]` | Optional | Static (this schema) |
| [deny](#deny) | `string[]` | Optional | Static (this schema) |
| [magic](#magic) | `boolean` | Optional | Static (this schema) |
| [repository](#repository) | complex | **Required** | Static (this schema) |

## allow

List of white listed paths

`allow`

* is optional
* type: `string[]`
* defined in this schema

### allow Type


Array type: `string[]`

All items must be of the type:
`string`










## deny

List of white listed paths

`deny`

* is optional
* type: `string[]`
* defined in this schema

### deny Type


Array type: `string[]`

All items must be of the type:
`string`










## magic

Deprecated: Enable server-side asset processing.

`magic`

* is optional
* type: `boolean`
* defined in this schema

### magic Type


`boolean`





## repository

Pointer to the repository for static resources

`repository`

* is **required**
* type: complex
* defined in this schema

### repository Type


**One** of the following *conditions* need to be fulfilled.


#### Condition 1


`string`

* format: `uri` – Uniformous Resource Identifier (according to [RFC3986](http://tools.ietf.org/html/rfc3986))



#### Condition 2


* []() – `https://ns.adobe.com/helix/shared/giturl`





