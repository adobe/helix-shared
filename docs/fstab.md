# FSTab (Mount Points) Schema

```txt
https://ns.adobe.com/helix/shared/fstab
```

Defines a mapping between mount points and source URLs. Mount points **must** start with a slash (`/`) but may not end with one.

This configuration can typically be found in the `helix-fstab.yaml` file.

The name and format are inspired by the [UNIX file system table](https://en.wikipedia.org/wiki/Fstab).


| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                    |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [fstab.schema.json](fstab.schema.json "open original schema") |

## FSTab (Mount Points) Type

`object` ([FSTab (Mount Points)](fstab.md))

## FSTab (Mount Points) Examples

```yaml
mountpoints:
  /ms/docs: 'https://adobe.sharepoint.com/sites/docs'
  /ms: 'https://adobe.sharepoint.com/sites/TheBlog/Shared%20Documents/theblog'
  /gd: 'https://drive.google.com/drive/u/0/folders/123456789'
  /foo: 'https://localhost:4502'

```

# FSTab (Mount Points) Properties

| Property                    | Type     | Required | Nullable       | Defined by                                                                                                                     |
| :-------------------------- | -------- | -------- | -------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| [mountpoints](#mountpoints) | `object` | Required | cannot be null | [FSTab (Mount Points)](fstab-properties-mountpoints.md "https&#x3A;//ns.adobe.com/helix/shared/fstab#/properties/mountpoints") |

## mountpoints




`mountpoints`

-   is required
-   Type: `object` ([Details](fstab-properties-mountpoints.md))
-   cannot be null
-   defined in: [FSTab (Mount Points)](fstab-properties-mountpoints.md "https&#x3A;//ns.adobe.com/helix/shared/fstab#/properties/mountpoints")

### mountpoints Type

`object` ([Details](fstab-properties-mountpoints.md))

### mountpoints Default Value

The default value is:

```json
{}
```
