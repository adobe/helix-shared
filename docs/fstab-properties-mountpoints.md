# Untitled object in FSTab (Mount Points) Schema

```txt
https://ns.adobe.com/helix/shared/fstab#/properties/mountpoints
```



| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                      |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [fstab.schema.json\*](fstab.schema.json "open original schema") |

## mountpoints Type

`object` ([Details](fstab-properties-mountpoints.md))

## mountpoints Default Value

The default value is:

```json
{}
```

# mountpoints Properties

| Property    | Type   | Required | Nullable       | Defined by                                                                                                                                                                                |
| :---------- | :----- | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `^/.*[^/]$` | Merged | Optional | cannot be null | [FSTab (Mount Points)](fstab-properties-mountpoints-patternproperties-mount-point.md "https://ns.adobe.com/helix/shared/mountpoint#/properties/mountpoints/patternProperties/^/.*\[^/]$") |

## Pattern: `^/.*[^/]$`

Defines the target URL where content should be retrieved from.

`^/.*[^/]$`

*   is optional

*   Type: merged type ([Mount Point](fstab-properties-mountpoints-patternproperties-mount-point.md))

*   cannot be null

*   defined in: [FSTab (Mount Points)](fstab-properties-mountpoints-patternproperties-mount-point.md "https://ns.adobe.com/helix/shared/mountpoint#/properties/mountpoints/patternProperties/^/.*\[^/]$")

### ]$ Type

merged type ([Mount Point](fstab-properties-mountpoints-patternproperties-mount-point.md))

one (and only one) of

*   [Untitled string in Mount Point](mountpoint-oneof-0.md "check type definition")

*   [Untitled object in Mount Point](mountpoint-oneof-1.md "check type definition")
