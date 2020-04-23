# MDAST Match Expression Schema

```txt
https://ns.adobe.com/helix/shared/markupmapping#/properties/match/anyOf/1
```

A CSS selector expression selecting the Markdown nodes that should get processed


| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                      |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [markupmapping.schema.json\*](markupmapping.schema.json "open original schema") |

## 1 Type

`string` ([MDAST Match Expression](markupmapping-properties-match-anyof-mdast-match-expression.md))

## 1 Examples

```yaml
paragraph

```

```yaml
paragraph>image

```

```yaml
heading+paragraph

```
