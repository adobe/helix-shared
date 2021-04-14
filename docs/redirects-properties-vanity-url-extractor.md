# Vanity URL extractor Schema

```txt
https://ns.adobe.com/helix/shared/redirects#/properties/vanity
```

Configure one or multiple vanity URL extractors, each extractor is a property of this object

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                             |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :--------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [redirects.schema.json*](redirects.schema.json "open original schema") |

## vanity Type

`object` ([Vanity URL extractor](redirects-properties-vanity-url-extractor.md))

## vanity Default Value

The default value is:

```json
{}
```

# vanity Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                                                                                    |
| :-------------------- | :------- | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Additional Properties | `object` | Optional | cannot be null | [Redirects Configuration](redirects-properties-vanity-url-extractor-vanity-url-mapping.md "https://ns.adobe.com/helix/shared/vanity#/properties/vanity/additionalProperties") |

## Additional Properties

Additional properties are allowed, as long as they follow this schema:



*   is optional

*   Type: `object` ([Vanity URL mapping](redirects-properties-vanity-url-extractor-vanity-url-mapping.md))

*   cannot be null

*   defined in: [Redirects Configuration](redirects-properties-vanity-url-extractor-vanity-url-mapping.md "https://ns.adobe.com/helix/shared/vanity#/properties/vanity/additionalProperties")

### additionalProperties Type

`object` ([Vanity URL mapping](redirects-properties-vanity-url-extractor-vanity-url-mapping.md))
