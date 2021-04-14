# Queries Schema

```txt
https://ns.adobe.com/helix/shared/index#/properties/queries
```

Named queries that can be executed against this index

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                     |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [index.schema.json*](index.schema.json "open original schema") |

## queries Type

`object` ([Queries](index-properties-queries.md))

# queries Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                                    |
| :-------------------- | :------- | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| Additional Properties | `object` | Optional | cannot be null | [Index](index-properties-queries-query.md "https://ns.adobe.com/helix/shared/query#/properties/queries/additionalProperties") |

## Additional Properties

Additional properties are allowed, as long as they follow this schema:

A named query that can be run against an index

*   is optional

*   Type: `object` ([Query](index-properties-queries-query.md))

*   cannot be null

*   defined in: [Index](index-properties-queries-query.md "https://ns.adobe.com/helix/shared/query#/properties/queries/additionalProperties")

### additionalProperties Type

`object` ([Query](index-properties-queries-query.md))
