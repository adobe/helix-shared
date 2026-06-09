# Helix Shared - Indexer

## Reference

In your `helix-query.yaml` <sup>[1](#footnote1)</sup>, you can define one or more index definitions. A sample index definition looks as follows:

```
indices:
  mysite:
    source: html
    fetch: https://{ref}--{repo}--{owner}.project-helix.page/{path}
    properties:
      author:
        select: main > div:nth-of-type(3) > p:nth-of-type(1)
        value: |
          match(el, 'by (.*)')
```

The `select` property is a CSS selector that grabs HTML elements out of your document. To verify that a CSS selector entered
is selecting what you expect, you can test it in your browser's Javascript console, e.g. for the `author` selector shown above,
enter the following expression:
```
document.querySelectorAll('main > div:nth-of-type(3) > p:nth-of-type(1)');
```

The `value` or `values` property contains an expression to apply to all HTML elements selected. The property name `value` is preferred
when you need a string, `values` on the other hand provides you with an array of all the matches found. The expression can contain
a combination of functions and variables:

### innerHTML(el)

Returns the HTML content of an element.

### textContent(el)

Returns the text content of the selected element, and all its descendents.

### attribute(el, name)

Returns the value of the attribute with the specified name of an element.

### match(el, re)

Matches a regular expression containing parentheses to capture items in the passed element.
In the `author` example above, the actual contents of the `<p>` element selected might
contain `by James Brown`, so it would capture everything following `by `.

### words(el, start, end)

Useful for teasers, this selects a range of words out of an HTML element.

### replace(el, substr, newSubstr)

Replaces all occurrences of a substring in a text with a replacement.

### parseTimestamp(el, format)

Parses a timestamp given as string, and returns its value as number of seconds since 1 Jan 1970.

### el

Returns the HTML elements selected by the `select` property.

### path

Returns the path of the HTML document being indexed.

### headers[name]

Returns the value of the HTTP response header with the specified name, at the time the HTML document was fetched.


<a name="footnote1">[1]</a>: The full definition of the `helix-query.yaml` is available here: https://github.com/adobe/helix-shared/blob/main/docs/indexconfig.md
