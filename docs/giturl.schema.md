
# Git URL Schema

```
https://ns.adobe.com/helix/shared/giturl
```

Representation of the fragments of a Git URL

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [giturl.schema.json](giturl.schema.json) |

# Git URL Properties

| Property | Type | Required | Default | Defined by |
|----------|------|----------|---------|------------|
| [hostname](#hostname) | `string` | Optional |  | Git URL (this schema) |
| [owner](#owner) | `string` | **Required** |  | Git URL (this schema) |
| [path](#path) | `string` | Optional |  | Git URL (this schema) |
| [port](#port) | `integer` | Optional |  | Git URL (this schema) |
| [protocol](#protocol) | `enum` | Optional |  | Git URL (this schema) |
| [ref](#ref) | `string` | **Required** | `"master"` | Git URL (this schema) |
| [repo](#repo) | `string` | **Required** |  | Git URL (this schema) |

## hostname

The hostname without port

`hostname`

* is optional
* type: `string`
* defined in this schema

### hostname Type


`string`



All instances must conform to this regular expression 
(test examples [here](https://regexr.com/?expression=hostname)):
```regex
hostname
```






## owner

The owner or username that the repository belongs to

`owner`

* is **required**
* type: `string`
* defined in this schema

### owner Type


`string`







## path

The path within the repository

`path`

* is optional
* type: `string`
* defined in this schema

### path Type


`string`







## port

The port to access the Git Repository

`port`

* is optional
* type: `integer`
* defined in this schema

### port Type


`integer`







## protocol

The protocol to access the Git repository

`protocol`

* is optional
* type: `enum`
* defined in this schema

The value of this property **must** be equal to one of the [known values below](#protocol-known-values).

### protocol Known Values
| Value | Description |
|-------|-------------|
| `https` |  |
| `http` |  |
| `ssh` |  |




## ref

The branch, tag, or sha of the tree in the repository to use

`ref`

* is **required**
* type: `string`
* default: `"master"`
* defined in this schema

### ref Type


`string`







## repo

The repository name

`repo`

* is **required**
* type: `string`
* defined in this schema

### repo Type


`string`






