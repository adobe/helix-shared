# Redirect Rule Schema

```txt
https://ns.adobe.com/helix/shared/redirectrule#/properties/redirects/items
```

A strain is a combination of code and content that enables the creation of a digital experience. Strains can be used to create language variants of websites, A/B tests, personalization, or to aggregate content from multiple sources

| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                 |
| :------------------ | :--------- | :---------- | :----------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [proxystrain.schema.json*](proxystrain.schema.json "open original schema") |

## items Type

`object` ([Redirect Rule](proxystrain-properties-redirects-redirect-rule.md))

# items Properties

| Property      | Type          | Required | Nullable       | Defined by                                                                                                         |
| :------------ | :------------ | :------- | :------------- | :----------------------------------------------------------------------------------------------------------------- |
| [from](#from) | `string`      | Optional | cannot be null | [Redirect Rule](redirectrule-properties-from.md "https://ns.adobe.com/helix/shared/redirectrule#/properties/from") |
| [to](#to)     | `string`      | Optional | cannot be null | [Redirect Rule](redirectrule-properties-to.md "https://ns.adobe.com/helix/shared/redirectrule#/properties/to")     |
| [type](#type) | Not specified | Optional | cannot be null | [Redirect Rule](redirectrule-properties-type.md "https://ns.adobe.com/helix/shared/redirectrule#/properties/type") |

## from

A URL path or regular expression to match the path of a URL. It can contain capture groups that can be used in `to`.

`from`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Redirect Rule](redirectrule-properties-from.md "https://ns.adobe.com/helix/shared/redirectrule#/properties/from")

### from Type

`string`

### from Examples

```yaml
/old

```

```yaml
/old/(.*)\.php$

```

## to

A replacement string that replaces matched URLs found in `from`.

`to`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Redirect Rule](redirectrule-properties-to.md "https://ns.adobe.com/helix/shared/redirectrule#/properties/to")

### to Type

`string`

### to Examples

```yaml
/new

```

```yaml
/new/$1.html

```

## type

What kind of redirect is this?

`type`

*   is optional

*   Type: unknown

*   cannot be null

*   defined in: [Redirect Rule](redirectrule-properties-type.md "https://ns.adobe.com/helix/shared/redirectrule#/properties/type")

### type Type

unknown

### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value         | Explanation |
| :------------ | :---------- |
| `"permanent"` |             |
| `"temporary"` |             |
| `"internal"`  |             |
