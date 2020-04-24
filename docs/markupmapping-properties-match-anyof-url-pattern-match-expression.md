# URL Pattern Match Expression Schema

```txt
https://ns.adobe.com/helix/shared/markupmapping#/properties/match/anyOf/2
```

An [Express-like](https://expressjs.com/en/guide/routing.html) path expression for selecting URL patterns that will apply the changes to the `body` element.


| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                      |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [markupmapping.schema.json\*](markupmapping.schema.json "open original schema") |

## 2 Type

`string` ([URL Pattern Match Expression](markupmapping-properties-match-anyof-url-pattern-match-expression.md))

## 2 Examples

```yaml
/about

```

```yaml
'/authors/:name'

```

```yaml
'/posts/(\d\d\d\d)/(\d\d)/:title'

```
