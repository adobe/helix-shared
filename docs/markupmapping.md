# Markup Mapping Schema

```txt
https://ns.adobe.com/helix/shared/markupmapping
```

A markup mapping defines how Helix should generate markup for certain Markdown or DOM patterns.

A configuration consits of a mandatory `match` expression, which is a CSS selector that operates either on the Markdown or DOM.

Furthermore, a configuration can have any number of actions (including none at all), for example:

-   `wrap`: adds more HTML elements around the generated HTML
-   `classnames` adds `class` attribute values into the generated HTML element
-   `attribute` adds other attributes and values into the generated HTML element

## Examples

### On the DOM tree

The most intuitive usage for most developers will be directly operating on the resulting DOM tree.
The `match` method just takes a regular CSS selector and then applies the desired markup on the resulting element.

#### Adding a class

`index.md`

```markdown
# Lorem ipsum dolor sit amet

consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua

![Lorem ipsum](http://dolor.sit/amet.jpeg)
```

`helix-markup.yaml`

```yaml
version: 1
markup:
  foo:
    match: p
    classnames:
      - foo
    type: html
```

`index.html`

```html
<h1>Lorem ipsum dolor sit amet</h1>
<p class="foo">consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</p>
<img src="http://dolor.sit/amet.jpeg" alt="Lorem ipsum"/>
```

#### Adding an attribute

`index.md`

```markdown
# Lorem ipsum dolor sit amet

consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua

![Lorem ipsum](http://dolor.sit/amet.jpeg)
```

`helix-markup.yaml`

```yaml
version: 1
markup:
  foo:
    match: p
    attribute:
      bar: baz
    type: html
```

`index.html`

```html
<h1>Lorem ipsum dolor sit amet</h1>
<p bar="baz">consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</p>
<img src="http://dolor.sit/amet.jpeg" alt="Lorem ipsum"/>
```

#### Wrapping with another element

`index.md`

```markdown
# Lorem ipsum dolor sit amet

consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua

![Lorem ipsum](http://dolor.sit/amet.jpeg)
```

`helix-markup.yaml`

```yaml
version: 1
markup:
  foo:
    match: p
    wrap: section.qux
    type: html
```

`index.html`

```html
<h1>Lorem ipsum dolor sit amet</h1>
<section class="qux">
  <p>consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</p>
</section>
<img src="http://dolor.sit/amet.jpeg" alt="Lorem ipsum"/>
```

### On the Markdown abstract tree

As an alternative, it is also possible to directly operate on the Markdown abstract syntax tree before it is converted to HTML. This is especially useful if you are heavily modifying the markup via the `*.pre.js` and need to already annotate your tree before processing. The `match` property takes a CSS like selector, but instead of DOM elements, you are targeting [MDAST nodes](https://github.com/syntax-tree/mdast#nodes).

#### Adding a class

`index.md`

```markdown
# Lorem ipsum dolor sit amet

consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua

![Lorem ipsum](http://dolor.sit/amet.jpeg)
```

`helix-markup.yaml`

```yaml
version: 1
markup:
  foo:
    match: paragraph
    classnames:
      - foo
    type: markdown
```

`index.html`

```html
<h1>Lorem ipsum dolor sit amet</h1>
<p class="foo">consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</p>
<img src="http://dolor.sit/amet.jpeg" alt="Lorem ipsum"/>
```

#### Adding an attribute

`index.md`

```markdown
# Lorem ipsum dolor sit amet

consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua

![Lorem ipsum](http://dolor.sit/amet.jpeg)
```

`helix-markup.yaml`

```yaml
version: 1
markup:
  foo:
    match: paragraph
    attribute:
      bar: baz
    type: markdown
```

`index.html`

```html
<h1>Lorem ipsum dolor sit amet</h1>
<p bar="baz">consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</p>
<img src="http://dolor.sit/amet.jpeg" alt="Lorem ipsum"/>
```

#### Wrapping with another element

`index.md`

```markdown
# Lorem ipsum dolor sit amet

consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua

![Lorem ipsum](http://dolor.sit/amet.jpeg)
```

`helix-markup.yaml`

```yaml
version: 1
markup:
  foo:
    match: paragraph
    wrap: section.qux
    type: markdown
```

`index.html`

```html
<h1>Lorem ipsum dolor sit amet</h1>
<section class="qux">
  <p>consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</p>
</section>
<img src="http://dolor.sit/amet.jpeg" alt="Lorem ipsum"/>
```

### Mixed

For the sake of completeness, we provide here an example of mixed rules

`index.md`

```markdown
# Lorem ipsum dolor sit amet

consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua

![Lorem ipsum](http://dolor.sit/amet.jpeg)
```

`helix-markup.yaml`

```yaml
version: 1
markup:
  foo:
    match: paragraph
    classnames:
      - foo
    type: markdown
  bar:
    match: p
    attribute:
      bar: baz
    type: html
```

`index.html`

```html
<h1>Lorem ipsum dolor sit amet</h1>
<p class="foo" bar="baz">consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</p>
<img src="http://dolor.sit/amet.jpeg" alt="Lorem ipsum"/>
```


| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                    |
| :------------------ | ---------- | ----------- | ------------ | :---------------- | --------------------- | ------------------- | ----------------------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [markupmapping.schema.json](markupmapping.schema.json "open original schema") |

## Markup Mapping Type

`object` ([Markup Mapping](markupmapping.md))

# Markup Mapping Properties

| Property                  | Type     | Required | Nullable       | Defined by                                                                                                                             |
| :------------------------ | -------- | -------- | -------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| [name](#name)             | `string` | Optional | cannot be null | [Markup Mapping](markupmapping-properties-name.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/name")             |
| [match](#match)           | Merged   | Required | cannot be null | [Markup Mapping](markupmapping-properties-match.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/match")           |
| [type](#type)             | `string` | Optional | cannot be null | [Markup Mapping](markupmapping-properties-type.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/type")             |
| [wrap](#wrap)             | `string` | Optional | cannot be null | [Markup Mapping](markupmapping-properties-wrap.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/wrap")             |
| [classnames](#classnames) | `array`  | Optional | cannot be null | [Markup Mapping](markupmapping-properties-classnames.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/classnames") |
| [attribute](#attribute)   | `object` | Optional | cannot be null | [Markup Mapping](markupmapping-properties-attribute.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/attribute")   |

## name

The (optional) name of the mapping. The name is normative only, and can be used for debugging purposes. It does not affect either matching nor the markup output.


`name`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Markup Mapping](markupmapping-properties-name.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/name")

### name Type

`string`

## match




`match`

-   is required
-   Type: `string` ([Details](markupmapping-properties-match.md))
-   cannot be null
-   defined in: [Markup Mapping](markupmapping-properties-match.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/match")

### match Type

`string` ([Details](markupmapping-properties-match.md))

one (and only one) of

-   [DOM Match Expression](markupmapping-properties-match-oneof-dom-match-expression.md "check type definition")
-   [MDAST Match Expression](markupmapping-properties-match-oneof-mdast-match-expression.md "check type definition")
-   [URL Pattern Match Expression](markupmapping-properties-match-oneof-url-pattern-match-expression.md "check type definition")

## type




`type`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Markup Mapping](markupmapping-properties-type.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/type")

### type Type

`string`

### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value        | Explanation                          |
| :----------- | ------------------------------------ |
| `"html"`     | Match against the generated DOM tree |
| `"markdown"` | Match against the source MDAST tree  |
| `"url"`      | Match against the request URL        |

### type Default Value

The default value is:

```json
"html"
```

## wrap

Add the following HTML tags before the generated HTML. This attribute is using [Emmet](https://emmet.io) notation.


`wrap`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Markup Mapping](markupmapping-properties-wrap.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/wrap")

### wrap Type

`string`

### wrap Examples

```yaml
div>ul>li

```

```yaml
div+p+bq

```

```yaml
div+div>p>span+em

```

## classnames

Add the following class names to the `class` attribute of the generated HTML


`classnames`

-   is optional
-   Type: `string[]`
-   cannot be null
-   defined in: [Markup Mapping](markupmapping-properties-classnames.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/classnames")

### classnames Type

`string[]`

## attribute

create new attributes for each key value pair below this property


`attribute`

-   is optional
-   Type: `object` ([Details](markupmapping-properties-attribute.md))
-   cannot be null
-   defined in: [Markup Mapping](markupmapping-properties-attribute.md "https&#x3A;//ns.adobe.com/helix/shared/markupmapping#/properties/attribute")

### attribute Type

`object` ([Details](markupmapping-properties-attribute.md))
