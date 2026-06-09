# Untitled object in Index Configuration Schema

```txt
https://ns.adobe.com/helix/shared/indexconfig#/properties/indices
```



| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                  |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [indexconfig.schema.json\*](indexconfig.schema.json "open original schema") |

## indices Type

`object` ([Details](indexconfig-properties-indices.md))

## indices Default Value

The default value is:

```json
{}
```

# indices Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                                                        |
| :-------------------- | :------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| Additional Properties | `object` | Optional | cannot be null | [Index Configuration](indexconfig-properties-indices-index.md "https://ns.adobe.com/helix/shared/index#/properties/indices/additionalProperties") |

## Additional Properties

Additional properties are allowed, as long as they follow this schema:



*   is optional

*   Type: `object` ([Index](indexconfig-properties-indices-index.md))

*   cannot be null

*   defined in: [Index Configuration](indexconfig-properties-indices-index.md "https://ns.adobe.com/helix/shared/index#/properties/indices/additionalProperties")

### additionalProperties Type

`object` ([Index](indexconfig-properties-indices-index.md))
