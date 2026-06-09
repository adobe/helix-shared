Each property in the search index is made up of two parts:
1. a `select` expression that selects nodes in the DOM or MDAST of the document to be indexed
2. a `value` or `values` expression that specifies how to extract values from the selected nodes.

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

- `el` – the list of all matching DOM elements
- `logger` – a Helix Log instance
- `parseTimestamp` – helper function to parse timestamps from a string
- `attribute` – retrieves the value of an attribute from an element
- `textContent` – retrieves the plain text content of an element
- `match` 
- `words`