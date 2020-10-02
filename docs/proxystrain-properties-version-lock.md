# Version Lock Schema

```txt
https://ns.adobe.com/helix/shared/version-lock#/properties/version-lock
```




| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                  |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | --------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [proxystrain.schema.json\*](proxystrain.schema.json "open original schema") |

## version-lock Type

`object` ([Version Lock](proxystrain-properties-version-lock.md))

## version-lock Examples

```yaml
helix-embed: v3
helix-data-embed: ci999

```

# Version Lock Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                                  |
| :-------------------- | -------- | -------- | -------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| Additional Properties | `string` | Optional | cannot be null | [Version Lock](version-lock-service-version.md "https&#x3A;//ns.adobe.com/helix/shared/version-lock#/additionalProperties") |

## Additional Properties

Additional properties are allowed, as long as they follow this schema:

A version number string


-   is optional
-   Type: `string` ([Service Version](version-lock-service-version.md))
-   cannot be null
-   defined in: [Version Lock](version-lock-service-version.md "https&#x3A;//ns.adobe.com/helix/shared/version-lock#/additionalProperties")

### additionalProperties Type

`string` ([Service Version](version-lock-service-version.md))

### additionalProperties Examples

```yaml
1.0.0

```

```yaml
v1.0

```

```yaml
v1

```

```yaml
ci999

```
