# Markup Mapping Schema

```txt
https://ns.adobe.com/helix/shared/markupmapping#/additionalProperties
```




| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                        |
| :------------------ | ---------- | ----------- | ------------ | :---------------- | --------------------- | ------------------- | ----------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [markup.schema.json\*](markup.schema.json "open original schema") |

## additionalProperties Type

`object` ([Markup Mapping](markup-markup-mapping.md))

# Markup Mapping Properties

| Property                  | Type     | Required | Nullable       | Defined by                                                                                                                             |
| :------------------------ | -------- | -------- | -------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| [name](#name)             | `string` | Optional | cannot be null | [Markup Mapping](markupmapping-properties-name.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/name")             |
| [match](#match)           | Merged   | Required | cannot be null | [Markup Mapping](markupmapping-properties-match.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/match")           |
| [type](#type)             | `string` | Optional | cannot be null | [Markup Mapping](markupmapping-properties-type.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/type")             |
| [wrap](#wrap)             | `string` | Optional | cannot be null | [Markup Mapping](markupmapping-properties-wrap.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/wrap")             |
| [classnames](#classnames) | `array`  | Optional | cannot be null | [Markup Mapping](markupmapping-properties-classnames.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/classnames") |
| [attribute](#attribute)   | `object` | Optional | cannot be null | [Markup Mapping](markupmapping-properties-attribute.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/attribute")   |

## name

The (optional) name of the mapping. The name is normative only, and can be used for debugging purposes. It does not affect either matching nor the markup output.


`name`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Markup Mapping](markupmapping-properties-name.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/name")

### name Type

`string`

## match




`match`

-   is required
-   Type: `string` ([Details](markupmapping-properties-match.md))
-   cannot be null
-   defined in: [Markup Mapping](markupmapping-properties-match.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/match")

### match Type

`string` ([Details](markupmapping-properties-match.md))

one (and only one) of

-   [DOM Match Expression](markupmapping-properties-match-oneof-dom-match-expression.md "check type definition")
-   [MDAST Match Expression](markupmapping-properties-match-oneof-mdast-match-expression.md "check type definition")
-   [URL Pattern Match Expression](markupmapping-properties-match-oneof-url-pattern-match-expression.md "check type definition")
-   [Content Intelligence Match Expression](markupmapping-properties-match-oneof-content-intelligence-match-expression.md "check type definition")

## type




`type`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Markup Mapping](markupmapping-properties-type.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/type")

### type Type

`string`

### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value        | Explanation                                    |
| :----------- | ---------------------------------------------- |
| `"html"`     | Match against the generated DOM tree           |
| `"markdown"` | Match against the source MDAST tree            |
| `"url"`      | Match against the request URL                  |
| `"content"`  | Use content intelligence matching for sections |

### type Default Value

The default value is:

```json
"html"
```

## wrap

Add the following HTML tags before the generated HTML. This attribute is using [Emmet](https://emmet.io) notation.


`wrap`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Markup Mapping](markupmapping-properties-wrap.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/wrap")

### wrap Type

`string`

### wrap Examples

```yaml
div>ul>li

```

```yaml
div+p+bq

```

```yaml
div+div>p>span+em

```

## classnames

Add the following class names to the `class` attribute of the generated HTML


`classnames`

-   is optional
-   Type: `string[]`
-   cannot be null
-   defined in: [Markup Mapping](markupmapping-properties-classnames.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/classnames")

### classnames Type

`string[]`

## attribute

create new attributes for each key value pair below this property


`attribute`

-   is optional
-   Type: `object` ([Details](markupmapping-properties-attribute.md))
-   cannot be null
-   defined in: [Markup Mapping](markupmapping-properties-attribute.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/attribute")

### attribute Type

`object` ([Details](markupmapping-properties-attribute.md))
