# Content Intelligence Match Expression Schema

```txt
https://ns.adobe.com/helix/shared/markupmapping#/properties/match/anyOf/3
```

Use a [Content Intelligence](https://github.com/adobe/helix-pipeline/blob/master/README.md#infer-content-types-with-utilstypes) expression for selecting sections in MDAST that have the specified order of children.

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                     |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :----------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [markupmapping.schema.json*](markupmapping.schema.json "open original schema") |

## 3 Type

`string` ([Content Intelligence Match Expression](markupmapping-properties-match-anyof-content-intelligence-match-expression.md))

## 3 Examples

```yaml
^heading

```

```yaml
paragraph$

```

```yaml
heading image+

```

```yaml
heading? image

```

```yaml
heading paragraph* image

```

```yaml
(paragraph|list)

```

```yaml
^heading (image paragraph)+$

```
