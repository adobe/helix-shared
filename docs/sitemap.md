# Sitemap Schema

```txt
https://ns.adobe.com/helix/shared/sitemap
```



| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                        |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :---------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [sitemap.schema.json](sitemap.schema.json "open original schema") |

## Sitemap Type

`object` ([Sitemap](sitemap.md))

# Sitemap Properties

| Property                    | Type     | Required | Nullable       | Defined by                                                                                                   |
| :-------------------------- | :------- | :------- | :------------- | :----------------------------------------------------------------------------------------------------------- |
| [source](#source)           | `string` | Optional | cannot be null | [Sitemap](sitemap-properties-source.md "https://ns.adobe.com/helix/shared/sitemap#/properties/source")       |
| [origin](#origin)           | `string` | Optional | cannot be null | [Sitemap](sitemap-properties-origin.md "https://ns.adobe.com/helix/shared/sitemap#/properties/origin")       |
| [destination](#destination) | `string` | Optional | cannot be null | [Sitemap](sitemap-properties-path.md "https://ns.adobe.com/helix/shared/sitemap#/properties/destination")    |
| [lastmod](#lastmod)         | `string` | Optional | cannot be null | [Sitemap](sitemap-properties-lastmod.md "https://ns.adobe.com/helix/shared/sitemap#/properties/lastmod")     |
| [languages](#languages)     | `object` | Optional | cannot be null | [Sitemap](sitemap-properties-languages.md "https://ns.adobe.com/helix/shared/sitemap#/properties/languages") |

## source

The source contentbus path to get records from. These records should at least contain a path property.

`source`

*   is optional

*   Type: `string` ([Source](sitemap-properties-source.md))

*   cannot be null

*   defined in: [Sitemap](sitemap-properties-source.md "https://ns.adobe.com/helix/shared/sitemap#/properties/source")

### source Type

`string` ([Source](sitemap-properties-source.md))

## origin

The origin to prepend to paths found in the source.

`origin`

*   is optional

*   Type: `string` ([Origin](sitemap-properties-origin.md))

*   cannot be null

*   defined in: [Sitemap](sitemap-properties-origin.md "https://ns.adobe.com/helix/shared/sitemap#/properties/origin")

### origin Type

`string` ([Origin](sitemap-properties-origin.md))

## destination

The destination contentbus path to store sitemap to.

`destination`

*   is optional

*   Type: `string` ([Path](sitemap-properties-path.md))

*   cannot be null

*   defined in: [Sitemap](sitemap-properties-path.md "https://ns.adobe.com/helix/shared/sitemap#/properties/destination")

### destination Type

`string` ([Path](sitemap-properties-path.md))

## lastmod

The format to use for last modification of a location. If not present, no last modification is added.

`lastmod`

*   is optional

*   Type: `string` ([Lastmod](sitemap-properties-lastmod.md))

*   cannot be null

*   defined in: [Sitemap](sitemap-properties-lastmod.md "https://ns.adobe.com/helix/shared/sitemap#/properties/lastmod")

### lastmod Type

`string` ([Lastmod](sitemap-properties-lastmod.md))

## languages

The languages to add to the sitemap

`languages`

*   is optional

*   Type: `object` ([Languages](sitemap-properties-languages.md))

*   cannot be null

*   defined in: [Sitemap](sitemap-properties-languages.md "https://ns.adobe.com/helix/shared/sitemap#/properties/languages")

### languages Type

`object` ([Languages](sitemap-properties-languages.md))
