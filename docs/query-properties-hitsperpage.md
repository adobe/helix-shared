# Untitled integer in Query Schema

```txt
https://ns.adobe.com/helix/shared/query#/properties/hitsPerPage
```

How many hits each page of search results should contain

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                     |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [query.schema.json*](query.schema.json "open original schema") |

## hitsPerPage Type

`integer`

## hitsPerPage Constraints

**minimum**: the value of this number must greater than or equal to: `1`

## hitsPerPage Default Value

The default value is:

```json
25
```
