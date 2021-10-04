# Languages Schema

```txt
https://ns.adobe.com/helix/shared/sitemap#/properties/languages
```

The languages to add to the sitemap

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                         |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :----------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [sitemap.schema.json*](sitemap.schema.json "open original schema") |

## languages Type

`object` ([Languages](sitemap-properties-languages.md))

# languages Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                                                  |
| :-------------------- | :------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| Additional Properties | `object` | Optional | cannot be null | [Sitemap](sitemap-properties-languages-language.md "https://ns.adobe.com/helix/shared/language#/properties/languages/additionalProperties") |

## Additional Properties

Additional properties are allowed, as long as they follow this schema:



*   is optional

*   Type: `object` ([Language](sitemap-properties-languages-language.md))

*   cannot be null

*   defined in: [Sitemap](sitemap-properties-languages-language.md "https://ns.adobe.com/helix/shared/language#/properties/languages/additionalProperties")

### additionalProperties Type

`object` ([Language](sitemap-properties-languages-language.md))
