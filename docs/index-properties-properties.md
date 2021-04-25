# Properties Schema

```txt
https://ns.adobe.com/helix/shared/index#/properties/properties
```

The properties to add to the index

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                     |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [index.schema.json*](index.schema.json "open original schema") |

## properties Type

`object` ([Properties](index-properties-properties.md))

# properties Properties

| Property              | Type   | Required | Nullable       | Defined by                                                                                                                                |
| :-------------------- | :----- | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| Additional Properties | Merged | Optional | cannot be null | [Index](index-properties-properties-property.md "https://ns.adobe.com/helix/shared/property#/properties/properties/additionalProperties") |

## Additional Properties

Additional properties are allowed, as long as they follow this schema:



*   is optional

*   Type: `object` ([Property](index-properties-properties-property.md))

*   cannot be null

*   defined in: [Index](index-properties-properties-property.md "https://ns.adobe.com/helix/shared/property#/properties/properties/additionalProperties")

### additionalProperties Type

`object` ([Property](index-properties-properties-property.md))

one (and only one) of

*   [Single-Value Property](property-oneof-single-value-property.md "check type definition")

*   [Multi-Value Property](property-oneof-multi-value-property.md "check type definition")
