The sitemap language configuration for a sitemap. This is required when your sitemap has more than one language.

If you have small sitemaps that you want to aggregate, you can use the *same* resource path in the `destination` property.

The `alternate` property will be used to extract the _canonical path_ given a language specific path, e.g. if:
- your `alternate` is `/de/{path}`
- the language specific path is `/de/my-path`

then the canonical path is `my-path`.

This canonical path will then be used to calculate all possible alternates in the other languages.