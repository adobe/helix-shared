# Markup Configuration Schema

```txt
https://ns.adobe.com/helix/shared/markup
```

A container for markup mappings. Each markup mapping is a named key.


| Abstract            | Extensible | Status      | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                      |
| :------------------ | ---------- | ----------- | ----------------------- | :---------------- | --------------------- | ------------------- | --------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | Unknown identifiability | Forbidden         | Allowed               | none                | [markup.schema.json](markup.schema.json "open original schema") |

## Markup Configuration Type

`object` ([Markup Configuration](markup.md))

# Markup Configuration Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                                    |
| :-------------------- | -------- | -------- | -------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| Additional Properties | `object` | Optional | cannot be null | [Markup Configuration](markup-markup-mapping.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/additionalProperties") |

## Additional Properties

Additional properties are allowed, as long as they follow this schema:




-   is optional
-   Type: `object` ([Markup Mapping](markup-markup-mapping.md))
-   cannot be null
-   defined in: [Markup Configuration](markup-markup-mapping.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/additionalProperties")

### additionalProperties Type

`object` ([Markup Mapping](markup-markup-mapping.md))
