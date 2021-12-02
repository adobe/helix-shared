# Sitemap Language Schema

```txt
https://ns.adobe.com/helix/shared/sitemap-language
```

The sitemap language configuration for a sitemap. This is required when your sitemap has more than one language.

If you have small sitemaps that you want to aggregate, you can use the *same* resource path in the `destination` property.

The `alternate` property will be used to extract the *canonical path* given a language specific path, e.g. if:

*   your `alternate` is `/de/{path}`
*   the language specific path is `/de/my-path`

then the canonical path is `my-path`.

This canonical path will then be used to calculate all possible alternates in the other languages.

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                          |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :---------------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [sitemap-language.schema.json](sitemap-language.schema.json "open original schema") |

## Sitemap Language Type

`object` ([Sitemap Language](sitemap-language.md))

# Sitemap Language Properties

| Property                    | Type     | Required | Nullable       | Defined by                                                                                                                                 |
| :-------------------------- | :------- | :------- | :------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| [source](#source)           | `string` | Optional | cannot be null | [Sitemap Language](sitemap-language-properties-source.md "https://ns.adobe.com/helix/shared/sitemap-language#/properties/source")          |
| [destination](#destination) | `string` | Required | cannot be null | [Sitemap Language](sitemap-language-properties-path.md "https://ns.adobe.com/helix/shared/sitemap-language#/properties/destination")       |
| [hreflang](#hreflang)       | `string` | Required | cannot be null | [Sitemap Language](sitemap-language-properties-href-language.md "https://ns.adobe.com/helix/shared/sitemap-language#/properties/hreflang") |
| [alternate](#alternate)     | `string` | Optional | cannot be null | [Sitemap Language](sitemap-language-properties-alternate.md "https://ns.adobe.com/helix/shared/sitemap-language#/properties/alternate")    |

## source

The source resource path to get records from. These records should at least contain a path property.

`source`

*   is optional

*   Type: `string` ([Source](sitemap-language-properties-source.md))

*   cannot be null

*   defined in: [Sitemap Language](sitemap-language-properties-source.md "https://ns.adobe.com/helix/shared/sitemap-language#/properties/source")

### source Type

`string` ([Source](sitemap-language-properties-source.md))

## destination

The destination resource path to store sitemap to.

`destination`

*   is required

*   Type: `string` ([Path](sitemap-language-properties-path.md))

*   cannot be null

*   defined in: [Sitemap Language](sitemap-language-properties-path.md "https://ns.adobe.com/helix/shared/sitemap-language#/properties/destination")

### destination Type

`string` ([Path](sitemap-language-properties-path.md))

## hreflang

The HREF language to use when listing alternates according to [RFC 5988](https://datatracker.ietf.org/doc/html/rfc5988).

`hreflang`

*   is required

*   Type: `string` ([HREF Language](sitemap-language-properties-href-language.md))

*   cannot be null

*   defined in: [Sitemap Language](sitemap-language-properties-href-language.md "https://ns.adobe.com/helix/shared/sitemap-language#/properties/hreflang")

### hreflang Type

`string` ([HREF Language](sitemap-language-properties-href-language.md))

### hreflang Constraints

**pattern**: the string must match the following regular expression: 

```regexp
^((?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?:([A-Za-z]{2,3}(-(?:[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?)|[A-Za-z]{4}|[A-Za-z]{5,8})(-(?:[A-Za-z]{4}))?(-(?:[A-Za-z]{2}|[0-9]{3}))?(-(?:[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(-(?:[0-9A-WY-Za-wy-z](-[A-Za-z0-9]{2,8})+))*(-(?:x(-[A-Za-z0-9]{1,8})+))?)|(?:x(-[A-Za-z0-9]{1,8})+))$
```

[try pattern](https://regexr.com/?expression=%5E\(\(%3F%3A\(en-GB-oed%7Ci-ami%7Ci-bnn%7Ci-default%7Ci-enochian%7Ci-hak%7Ci-klingon%7Ci-lux%7Ci-mingo%7Ci-navajo%7Ci-pwn%7Ci-tao%7Ci-tay%7Ci-tsu%7Csgn-BE-FR%7Csgn-BE-NL%7Csgn-CH-DE\)%7C\(art-lojban%7Ccel-gaulish%7Cno-bok%7Cno-nyn%7Czh-guoyu%7Czh-hakka%7Czh-min%7Czh-min-nan%7Czh-xiang\)\)%7C\(\(%3F%3A\(%5BA-Za-z%5D%7B2%2C3%7D\(-\(%3F%3A%5BA-Za-z%5D%7B3%7D\(-%5BA-Za-z%5D%7B3%7D\)%7B0%2C2%7D\)\)%3F\)%7C%5BA-Za-z%5D%7B4%7D%7C%5BA-Za-z%5D%7B5%2C8%7D\)\(-\(%3F%3A%5BA-Za-z%5D%7B4%7D\)\)%3F\(-\(%3F%3A%5BA-Za-z%5D%7B2%7D%7C%5B0-9%5D%7B3%7D\)\)%3F\(-\(%3F%3A%5BA-Za-z0-9%5D%7B5%2C8%7D%7C%5B0-9%5D%5BA-Za-z0-9%5D%7B3%7D\)\)\*\(-\(%3F%3A%5B0-9A-WY-Za-wy-z%5D\(-%5BA-Za-z0-9%5D%7B2%2C8%7D\)%2B\)\)\*\(-\(%3F%3Ax\(-%5BA-Za-z0-9%5D%7B1%2C8%7D\)%2B\)\)%3F\)%7C\(%3F%3Ax\(-%5BA-Za-z0-9%5D%7B1%2C8%7D\)%2B\)\)%24 "try regular expression with regexr.com")

## alternate

How to compute the respective path in that language. If not present, paths do not contain a language specific part.

`alternate`

*   is optional

*   Type: `string` ([Alternate](sitemap-language-properties-alternate.md))

*   cannot be null

*   defined in: [Sitemap Language](sitemap-language-properties-alternate.md "https://ns.adobe.com/helix/shared/sitemap-language#/properties/alternate")

### alternate Type

`string` ([Alternate](sitemap-language-properties-alternate.md))

### alternate Examples

```yaml
/{path}

```

```yaml
/en/{path}

```

```yaml
/german/{path}

```
