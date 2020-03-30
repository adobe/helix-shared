A markup mapping defines how Helix should generate markup for certain Markdown or DOM patterns.

A configuration consits of a mandatory `match` expression, which is a CSS selector that operates either on the Markdown or DOM.

Furthermore, a configuration can have any number of actions (including none at all), for example:

- `wrap`: adds more HTML elements around the generated HTML
- `classnames` adds `class` attribute values into the generated HTML element
- `attribute` adds other attributes and values into the generated HTML element

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

As an alternatie, it is also possible to directly operate on the Markdown abstract tree before it is converted to HTML. This is especially useful if you are heavily modifying the markup via the `*.pre.js` and need to already annotate your tree before processing. The `match` property takes a CSS like selector, but instead of DOM elements, you are targeting [MDAST nodes](https://github.com/syntax-tree/mdast#nodes).

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