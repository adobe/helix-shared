# Language Schema

```txt
https://ns.adobe.com/helix/shared/language
```



| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                          |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------------ |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [language.schema.json](language.schema.json "open original schema") |

## Language Type

`object` ([Language](language.md))

# Language Properties

| Property                    | Type     | Required | Nullable       | Defined by                                                                                                         |
| :-------------------------- | :------- | :------- | :------------- | :----------------------------------------------------------------------------------------------------------------- |
| [source](#source)           | `string` | Optional | cannot be null | [Language](language-properties-source.md "https://ns.adobe.com/helix/shared/language#/properties/source")          |
| [destination](#destination) | `string` | Required | cannot be null | [Language](language-properties-path.md "https://ns.adobe.com/helix/shared/language#/properties/destination")       |
| [hreflang](#hreflang)       | `string` | Required | cannot be null | [Language](language-properties-href-language.md "https://ns.adobe.com/helix/shared/language#/properties/hreflang") |
| [alternate](#alternate)     | `string` | Optional | cannot be null | [Language](language-properties-alternate.md "https://ns.adobe.com/helix/shared/language#/properties/alternate")    |

## source

The source contentbus path to get records from. These records should at least contain a path property.

`source`

*   is optional

*   Type: `string` ([Source](language-properties-source.md))

*   cannot be null

*   defined in: [Language](language-properties-source.md "https://ns.adobe.com/helix/shared/language#/properties/source")

### source Type

`string` ([Source](language-properties-source.md))

## destination

The destination contentbus path to store sitemap to.

`destination`

*   is required

*   Type: `string` ([Path](language-properties-path.md))

*   cannot be null

*   defined in: [Language](language-properties-path.md "https://ns.adobe.com/helix/shared/language#/properties/destination")

### destination Type

`string` ([Path](language-properties-path.md))

## hreflang

The HREF language to use when listing alternates.

`hreflang`

*   is required

*   Type: `string` ([HREF Language](language-properties-href-language.md))

*   cannot be null

*   defined in: [Language](language-properties-href-language.md "https://ns.adobe.com/helix/shared/language#/properties/hreflang")

### hreflang Type

`string` ([HREF Language](language-properties-href-language.md))

## alternate

How to compute the respective path in that language. If not present, paths do not contain a language specific part.

`alternate`

*   is optional

*   Type: `string` ([Alternate](language-properties-alternate.md))

*   cannot be null

*   defined in: [Language](language-properties-alternate.md "https://ns.adobe.com/helix/shared/language#/properties/alternate")

### alternate Type

`string` ([Alternate](language-properties-alternate.md))
