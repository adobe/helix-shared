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

| Property              | Type   | Required | Nullable       | Defined by                                                                                                                       |
| :-------------------- | ------ | -------- | -------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| Additional Properties | Merged | Optional | cannot be null | [Version Lock](version-lock-additionalproperties.md "https&#x3A;//ns.adobe.com/helix/shared/version-lock#/additionalProperties") |

## Additional Properties

Additional properties are allowed, as long as they follow this schema:




-   is optional
-   Type: merged type ([Details](version-lock-additionalproperties.md))
-   cannot be null
-   defined in: [Version Lock](version-lock-additionalproperties.md "https&#x3A;//ns.adobe.com/helix/shared/version-lock#/additionalProperties")

### additionalProperties Type

merged type ([Details](version-lock-additionalproperties.md))

one (and only one) of

-   [Release Version](version-lock-additionalproperties-oneof-release-version.md "check type definition")
-   [CI Build Number](version-lock-additionalproperties-oneof-ci-build-number.md "check type definition")
