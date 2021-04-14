# Git URL Schema

```txt
https://ns.adobe.com/helix/shared/staticgiturl
```

Representation of the fragments of a Git URL

| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                  |
| :------------------ | :--------- | :---------- | :----------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [staticgiturl.schema.json](staticgiturl.schema.json "open original schema") |

## Git URL Type

`object` ([Git URL](staticgiturl.md))

# Git URL Properties

| Property              | Type      | Required | Nullable       | Defined by                                                                                                           |
| :-------------------- | :-------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------- |
| [protocol](#protocol) | `string`  | Optional | cannot be null | [Git URL](staticgiturl-properties-protocol.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/protocol") |
| [hostname](#hostname) | `string`  | Optional | cannot be null | [Git URL](staticgiturl-properties-hostname.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/hostname") |
| [host](#host)         | `string`  | Optional | cannot be null | [Git URL](staticgiturl-properties-host.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/host")         |
| [port](#port)         | Multiple  | Optional | cannot be null | [Git URL](staticgiturl-properties-port.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/port")         |
| [owner](#owner)       | `string`  | Required | cannot be null | [Git URL](staticgiturl-properties-owner.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/owner")       |
| [path](#path)         | `string`  | Optional | cannot be null | [Git URL](staticgiturl-properties-path.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/path")         |
| [repo](#repo)         | `string`  | Required | cannot be null | [Git URL](staticgiturl-properties-repo.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/repo")         |
| [ref](#ref)           | `string`  | Required | cannot be null | [Git URL](staticgiturl-properties-ref.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/ref")           |
| [allow](#allow)       | `array`   | Optional | cannot be null | [Git URL](staticgiturl-properties-allow.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/allow")       |
| [deny](#deny)         | `array`   | Optional | cannot be null | [Git URL](staticgiturl-properties-deny.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/deny")         |
| [magic](#magic)       | `boolean` | Optional | cannot be null | [Git URL](staticgiturl-properties-magic.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/magic")       |

## protocol

The protocol to access the Git repository

`protocol`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Git URL](staticgiturl-properties-protocol.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/protocol")

### protocol Type

`string`

### protocol Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value     | Explanation |
| :-------- | :---------- |
| `"https"` |             |
| `"http"`  |             |
| `"ssh"`   |             |

## hostname

The hostname without port

`hostname`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Git URL](staticgiturl-properties-hostname.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/hostname")

### hostname Type

`string`

### hostname Constraints

**hostname**: the string must be a hostname, according to [RFC 1123, section 2.1](https://tools.ietf.org/html/rfc1123 "check the specification")

## host

The hostname with port

`host`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Git URL](staticgiturl-properties-host.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/host")

### host Type

`string`

## port

The port to access the Git Repository

`port`

*   is optional

*   Type: any of the folllowing: `integer` or `string` ([Details](staticgiturl-properties-port.md))

*   cannot be null

*   defined in: [Git URL](staticgiturl-properties-port.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/port")

### port Type

any of the folllowing: `integer` or `string` ([Details](staticgiturl-properties-port.md))

## owner

The owner or username that the repository belongs to

`owner`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Git URL](staticgiturl-properties-owner.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/owner")

### owner Type

`string`

## path

The path within the repository

`path`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Git URL](staticgiturl-properties-path.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/path")

### path Type

`string`

## repo

The repository name

`repo`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Git URL](staticgiturl-properties-repo.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/repo")

### repo Type

`string`

## ref

The branch, tag, or sha of the tree in the repository to use

`ref`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Git URL](staticgiturl-properties-ref.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/ref")

### ref Type

`string`

### ref Default Value

The default value is:

```json
"master"
```

## allow

List of white listed paths

`allow`

*   is optional

*   Type: `string[]`

*   cannot be null

*   defined in: [Git URL](staticgiturl-properties-allow.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/allow")

### allow Type

`string[]`

## deny

List of white listed paths

`deny`

*   is optional

*   Type: `string[]`

*   cannot be null

*   defined in: [Git URL](staticgiturl-properties-deny.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/deny")

### deny Type

`string[]`

## magic

Deprecated: Enable server-side asset processing.

`magic`

*   is optional

*   Type: `boolean`

*   cannot be null

*   defined in: [Git URL](staticgiturl-properties-magic.md "https://ns.adobe.com/helix/shared/staticgiturl#/properties/magic")

### magic Type

`boolean`
