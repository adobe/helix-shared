A markup mapping defines how Helix should generate markup for certain Markdown or DOM patterns.

A configuration consits of a mandatory `match` expression, which is a CSS selector that operates either on the Markdown or DOM.

Furthermore, a configuration can have any number of actions (including none at all), for example:

- `wrap`: adds more HTML elements around the generated HTML
- `inject` adds `class` attribute values into the generated HTML element
- `add` adds other attributes and values into the generated HTML element