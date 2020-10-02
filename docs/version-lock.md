# Version Lock Schema

```txt
https://ns.adobe.com/helix/shared/version-lock
```

The `version-lock` property allows pinning of specific services to a particular version number.

Each property is the name of the service, the value is either the version number or (when starting with `v`) or the CI build number (when starting with `ci`) or any other version string.


| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                  |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | --------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [version-lock.schema.json](version-lock.schema.json "open original schema") |

## Version Lock Type

`object` ([Version Lock](version-lock.md))

## Version Lock Examples

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
