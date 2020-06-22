# Untitled string in Markup Mapping Schema

```txt
https://ns.adobe.com/helix/shared/markupmapping#/properties/type
```




| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                      |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [markupmapping.schema.json\*](markupmapping.schema.json "open original schema") |

## type Type

`string`

## type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value        | Explanation                                    |
| :----------- | ---------------------------------------------- |
| `"html"`     | Match against the generated DOM tree           |
| `"markdown"` | Match against the source MDAST tree            |
| `"url"`      | Match against the request URL                  |
| `"content"`  | Use content intelligence matching for sections |

## type Default Value

The default value is:

```json
"html"
```
