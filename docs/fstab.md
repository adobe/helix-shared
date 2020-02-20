# FSTab (Mount Points) Schema

```txt
https://ns.adobe.com/helix/shared/fstab
```

Defines a mapping between mount points and source URLs. Mount points **must** start with a slash (`/`) but may not end with one.


| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                    |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [fstab.schema.json](fstab.schema.json "open original schema") |

## FSTab (Mount Points) Type

`object` ([FSTab (Mount Points)](fstab.md))

# FSTab (Mount Points) Properties

| Property                    | Type    | Required | Nullable       | Defined by                                                                                                                     |
| :-------------------------- | ------- | -------- | -------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| [mountpoints](#mountpoints) | `array` | Required | cannot be null | [FSTab (Mount Points)](fstab-properties-mountpoints.md "https&#x3A;//ns.adobe.com/helix/shared/fstab#/properties/mountpoints") |

## mountpoints

A list of mount points.


`mountpoints`

-   is required
-   Type: `object[]` ([Mount Point](fstab-properties-mountpoints-mount-point.md))
-   cannot be null
-   defined in: [FSTab (Mount Points)](fstab-properties-mountpoints.md "https&#x3A;//ns.adobe.com/helix/shared/fstab#/properties/mountpoints")

### mountpoints Type

`object[]` ([Mount Point](fstab-properties-mountpoints-mount-point.md))

### mountpoints Constraints

**minimum number of items**: the minimum number of items for this array is: `1`
