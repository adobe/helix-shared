# Untitled string in Mount Point Schema

```txt
https://ns.adobe.com/helix/shared/mountpoint#/oneOf/1/properties/fallbackPath
```

Specifies the fallback path if the requested item cannot be found. The fallback path is relative to the basepath of the item originally requested, so if the requested item is `/foo/bar.md` and the `fallbackPath` is `baz.md`, then `/foo/baz.md` will be the fallback item. 


| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [mountpoint.schema.json\*](mountpoint.schema.json "open original schema") |

## fallbackPath Type

`string`
