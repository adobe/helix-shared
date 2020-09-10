# Git URL Schema

```txt
https://ns.adobe.com/helix/shared/giturl#/properties/code/oneOf/1
```

Representation of the fragments of a Git URL


| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                      |
| :------------------ | ---------- | ----------- | ------------ | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [runtimestrain.schema.json\*](runtimestrain.schema.json "open original schema") |

## 1 Type

`object` ([Git URL](runtimestrain-properties-code-oneof-git-url.md))

# Git URL Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                    |
| :-------------------- | -------- | -------- | -------------- | :------------------------------------------------------------------------------------------------------------ |
| [protocol](#protocol) | `string` | Optional | cannot be null | [Git URL](giturl-properties-protocol.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/protocol") |
| [hostname](#hostname) | `string` | Optional | cannot be null | [Git URL](giturl-properties-hostname.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/hostname") |
| [host](#host)         | `string` | Optional | cannot be null | [Git URL](giturl-properties-host.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/host")         |
| [port](#port)         | Multiple | Optional | cannot be null | [Git URL](giturl-properties-port.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/port")         |
| [owner](#owner)       | `string` | Required | cannot be null | [Git URL](giturl-properties-owner.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/owner")       |
| [path](#path)         | `string` | Optional | cannot be null | [Git URL](giturl-properties-path.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/path")         |
| [repo](#repo)         | `string` | Required | cannot be null | [Git URL](giturl-properties-repo.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/repo")         |
| [ref](#ref)           | `string` | Required | cannot be null | [Git URL](giturl-properties-ref.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/ref")           |

## protocol

The protocol to access the Git repository


`protocol`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Git URL](giturl-properties-protocol.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/protocol")

### protocol Type

`string`

### protocol Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value     | Explanation |
| :-------- | ----------- |
| `"https"` |             |
| `"http"`  |             |
| `"ssh"`   |             |

## hostname

The hostname without port


`hostname`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Git URL](giturl-properties-hostname.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/hostname")

### hostname Type

`string`

### hostname Constraints

**hostname**: the string must be a hostname, according to [RFC 1123, section 2.1](https://tools.ietf.org/html/rfc1123 "check the specification")

## host

The hostname with port


`host`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Git URL](giturl-properties-host.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/host")

### host Type

`string`

## port

The port to access the Git Repository


`port`

-   is optional
-   Type: any of the folllowing: `integer` or `string` ([Details](giturl-properties-port.md))
-   cannot be null
-   defined in: [Git URL](giturl-properties-port.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/port")

### port Type

any of the folllowing: `integer` or `string` ([Details](giturl-properties-port.md))

## owner

The owner or username that the repository belongs to


`owner`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [Git URL](giturl-properties-owner.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/owner")

### owner Type

`string`

## path

The path within the repository


`path`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Git URL](giturl-properties-path.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/path")

### path Type

`string`

## repo

The repository name


`repo`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [Git URL](giturl-properties-repo.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/repo")

### repo Type

`string`

## ref

The branch, tag, or sha of the tree in the repository to use


`ref`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [Git URL](giturl-properties-ref.md "https&#x3A;//ns.adobe.com/helix/shared/giturl#/properties/ref")

### ref Type

`string`

### ref Default Value

The default value is:

```json
"master"
```
