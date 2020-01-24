# Property Schema

```txt
https://ns.adobe.com/helix/shared/property
```

Each property in the search index is made up of two parts:
1\. a `select` expression that selects nodes in the DOM or MDAST of the document to be indexed
2\. a `value` or `values` expression that specifies how to extract values from the selected nodes.

When using `value`, a single cardinal value will be stored in the index, when using `values`, an array of values will be stored.

For example:

```yaml
properties:
  title:
    select: main > .title
    value: textContent(el)
  topics:
    select: main > .topic
    values: textContent(el)
```

The `value` or `values` epression is now a proper javascript-like
expression, using [jesp](http://jsep.from.so) to parse the tree it supports functions, literals and variables so far.

Following variables and functions can be used in these expressions:

-   `el` – the list of all matching DOM elements
-   `logger` – a Helix Log instance
-   `parseTimestamp` – helper function to parse timestamps from a string
-   `attribute` – retrieves the value of an attribute from an element
-   `textContent` – retrieves the plain text content of an element
-   `match` 
-   `words`


| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                          |
| :------------------ | ---------- | -------------- | ----------------------- | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [property.schema.json](property.schema.json "open original schema") |

## Property Type

`object` ([Property](property.md))

one (and only one) of

-   [Single-Value Property](property-oneof-single-value-property.md "check type definition")
-   [Multi-Value Property](property-oneof-multi-value-property.md "check type definition")
