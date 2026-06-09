# Folders Schema

```txt
https://ns.adobe.com/helix/shared/fstab#/properties/folders
```

Mapping from subtrees to single sources for catch-all folder support.

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                      |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [fstab.schema.json\*](fstab.schema.json "open original schema") |

## folders Type

`object` ([Folders](fstab-properties-folders.md))

## folders Default Value

The default value is:

```json
{}
```

# folders Properties

| Property    | Type     | Required | Nullable       | Defined by                                                                                                                                                        |
| :---------- | :------- | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `^/.*[^/]$` | `string` | Optional | cannot be null | [FSTab (Mount Points)](fstab-properties-folders-patternproperties-.md "https://ns.adobe.com/helix/shared/fstab#/properties/folders/patternProperties/^/.*\[^/]$") |

## Pattern: `^/.*[^/]$`



`^/.*[^/]$`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [FSTab (Mount Points)](fstab-properties-folders-patternproperties-.md "https://ns.adobe.com/helix/shared/fstab#/properties/folders/patternProperties/^/.*\[^/]$")

### ]$ Type

`string`
