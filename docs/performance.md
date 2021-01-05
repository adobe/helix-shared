# Performance Schema

```txt
https://ns.adobe.com/helix/shared/performance
```

Performance testing details.


| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                |
| :------------------ | ---------- | ----------- | ------------ | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [performance.schema.json](performance.schema.json "open original schema") |

## Performance Type

`object` ([Performance](performance.md))

# Performance Properties

| Property                                                            | Type          | Required | Nullable       | Defined by                                                                                                                                                                |
| :------------------------------------------------------------------ | ------------- | -------- | -------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [device](#device)                                                   | Not specified | Optional | cannot be null | [Performance](performance-properties-device.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/device")                                                   |
| [location](#location)                                               | Not specified | Optional | cannot be null | [Performance](performance-properties-location.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/location")                                               |
| [connection](#connection)                                           | Not specified | Optional | cannot be null | [Performance](performance-properties-connection.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/connection")                                           |
| [lighthouse-seo-score](#lighthouse-seo-score)                       | `number`      | Optional | cannot be null | [Performance](performance-properties-lighthouse-seo-score.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/lighthouse-seo-score")                       |
| [lighthouse-best-practices-score](#lighthouse-best-practices-score) | `number`      | Optional | cannot be null | [Performance](performance-properties-lighthouse-best-practices-score.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/lighthouse-best-practices-score") |
| [lighthouse-accessibility-score](#lighthouse-accessibility-score)   | `number`      | Optional | cannot be null | [Performance](performance-properties-lighthouse-accessibility-score.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/lighthouse-accessibility-score")   |
| [lighthouse-performance-score](#lighthouse-performance-score)       | `number`      | Optional | cannot be null | [Performance](performance-properties-lighthouse-performance-score.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/lighthouse-performance-score")       |
| [lighthouse-pwa-score](#lighthouse-pwa-score)                       | `number`      | Optional | cannot be null | [Performance](performance-properties-lighthouse-pwa-score.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/lighthouse-pwa-score")                       |
| [js-parse-compile](#js-parse-compile)                               | `number`      | Optional | cannot be null | [Performance](performance-properties-js-parse-compile.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/js-parse-compile")                               |
| [dom-size](#dom-size)                                               | `number`      | Optional | cannot be null | [Performance](performance-properties-dom-size.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/dom-size")                                               |
| [visually_complete_85](#visually_complete_85)                       | `number`      | Optional | cannot be null | [Performance](performance-properties-visually_complete_85.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/visually_complete_85")                       |
| [visually_complete](#visually_complete)                             | `number`      | Optional | cannot be null | [Performance](performance-properties-visually_complete.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/visually_complete")                             |
| [consistently-interactive](#consistently-interactive)               | `number`      | Optional | cannot be null | [Performance](performance-properties-consistently-interactive.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/consistently-interactive")               |
| [first-interactive](#first-interactive)                             | `number`      | Optional | cannot be null | [Performance](performance-properties-first-interactive.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/first-interactive")                             |
| [time-to-first-byte](#time-to-first-byte)                           | `number`      | Optional | cannot be null | [Performance](performance-properties-time-to-first-byte.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/time-to-first-byte")                           |
| [estimated-input-latency](#estimated-input-latency)                 | `number`      | Optional | cannot be null | [Performance](performance-properties-estimated-input-latency.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/estimated-input-latency")                 |
| [speed_index](#speed_index)                                         | `number`      | Optional | cannot be null | [Performance](performance-properties-speed_index.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/speed_index")                                         |
| [first-meaningful-paint](#first-meaningful-paint)                   | `number`      | Optional | cannot be null | [Performance](performance-properties-first-meaningful-paint.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/first-meaningful-paint")                   |
| [first-contentful-paint](#first-contentful-paint)                   | `number`      | Optional | cannot be null | [Performance](performance-properties-first-contentful-paint.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/first-contentful-paint")                   |
| [firstRender](#firstrender)                                         | `number`      | Optional | cannot be null | [Performance](performance-properties-firstrender.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/firstRender")                                         |
| [image_body_size_in_bytes](#image_body_size_in_bytes)               | `number`      | Optional | cannot be null | [Performance](performance-properties-image_body_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/image_body_size_in_bytes")               |
| [image_size_in_bytes](#image_size_in_bytes)                         | `number`      | Optional | cannot be null | [Performance](performance-properties-image_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/image_size_in_bytes")                         |
| [font_body_size_in_bytes](#font_body_size_in_bytes)                 | `number`      | Optional | cannot be null | [Performance](performance-properties-font_body_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/font_body_size_in_bytes")                 |
| [font_size_in_bytes](#font_size_in_bytes)                           | `number`      | Optional | cannot be null | [Performance](performance-properties-font_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/font_size_in_bytes")                           |
| [js_body_size_in_bytes](#js_body_size_in_bytes)                     | `number`      | Optional | cannot be null | [Performance](performance-properties-js_body_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/js_body_size_in_bytes")                     |
| [js_size_in_bytes](#js_size_in_bytes)                               | `number`      | Optional | cannot be null | [Performance](performance-properties-js_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/js_size_in_bytes")                               |
| [css_body_size_in_bytes](#css_body_size_in_bytes)                   | `number`      | Optional | cannot be null | [Performance](performance-properties-css_body_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/css_body_size_in_bytes")                   |
| [css_size_in_bytes](#css_size_in_bytes)                             | `number`      | Optional | cannot be null | [Performance](performance-properties-css_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/css_size_in_bytes")                             |
| [html_body_size_in_bytes](#html_body_size_in_bytes)                 | `number`      | Optional | cannot be null | [Performance](performance-properties-html_body_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/html_body_size_in_bytes")                 |
| [html_size_in_bytes](#html_size_in_bytes)                           | `number`      | Optional | cannot be null | [Performance](performance-properties-html_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/html_size_in_bytes")                           |
| [page_wait_timing](#page_wait_timing)                               | `number`      | Optional | cannot be null | [Performance](performance-properties-page_wait_timing.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/page_wait_timing")                               |
| [page_size_in_bytes](#page_size_in_bytes)                           | `number`      | Optional | cannot be null | [Performance](performance-properties-page_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/page_size_in_bytes")                           |
| [page_body_size_in_bytes](#page_body_size_in_bytes)                 | `number`      | Optional | cannot be null | [Performance](performance-properties-page_body_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/page_body_size_in_bytes")                 |
| [asset_count](#asset_count)                                         | `number`      | Optional | cannot be null | [Performance](performance-properties-asset_count.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/asset_count")                                         |
| [onload](#onload)                                                   | `number`      | Optional | cannot be null | [Performance](performance-properties-onload.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/onload")                                                   |
| [oncontentload](#oncontentload)                                     | `number`      | Optional | cannot be null | [Performance](performance-properties-oncontentload.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/oncontentload")                                     |

## device

Testing device


`device`

-   is optional
-   Type: unknown
-   cannot be null
-   defined in: [Performance](performance-properties-device.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/device")

### device Type

unknown

### device Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value              | Explanation |
| :----------------- | ----------- |
| `""`               |             |
| `"MotorolaMotoG4"` |             |
| `"iPhone5"`        |             |
| `"iPhone6"`        |             |
| `"iPhone6Plus"`    |             |
| `"iPhone7"`        |             |
| `"iPhone8"`        |             |
| `"Nexus5X"`        |             |
| `"Nexus6P"`        |             |
| `"GalaxyS5"`       |             |
| `"iPad"`           |             |
| `"iPadPro"`        |             |

## location

Testing location


`location`

-   is optional
-   Type: unknown
-   cannot be null
-   defined in: [Performance](performance-properties-location.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/location")

### location Type

unknown

### location Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value             | Explanation |
| :---------------- | ----------- |
| `""`              |             |
| `"NorthVirginia"` |             |
| `"Frankfurt"`     |             |
| `"Sydney"`        |             |
| `"Ohio"`          |             |
| `"California"`    |             |
| `"Oregon"`        |             |
| `"Canada"`        |             |
| `"Ireland"`       |             |
| `"Tokyo"`         |             |
| `"Seoul"`         |             |
| `"Singapore"`     |             |
| `"Mumbai"`        |             |
| `"SaoPaulo"`      |             |
| `"London"`        |             |

## connection

Testing connection


`connection`

-   is optional
-   Type: unknown
-   cannot be null
-   defined in: [Performance](performance-properties-connection.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/connection")

### connection Type

unknown

### connection Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value               | Explanation |
| :------------------ | ----------- |
| `""`                |             |
| `"regular2G"`       |             |
| `"good2G"`          |             |
| `"slow3G"`          |             |
| `"regular3G"`       |             |
| `"good3G"`          |             |
| `"emergingMarkets"` |             |
| `"regular4G"`       |             |
| `"LTE"`             |             |
| `"dsl"`             |             |
| `"wifi"`            |             |
| `"cable"`           |             |

## lighthouse-seo-score

Lighthouse SEO Score


`lighthouse-seo-score`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-lighthouse-seo-score.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/lighthouse-seo-score")

### lighthouse-seo-score Type

`number`

## lighthouse-best-practices-score

Lighthouse Best Practices Score


`lighthouse-best-practices-score`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-lighthouse-best-practices-score.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/lighthouse-best-practices-score")

### lighthouse-best-practices-score Type

`number`

## lighthouse-accessibility-score

Lighthouse Accessibility Score


`lighthouse-accessibility-score`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-lighthouse-accessibility-score.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/lighthouse-accessibility-score")

### lighthouse-accessibility-score Type

`number`

## lighthouse-performance-score

Lighthouse Performance Score


`lighthouse-performance-score`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-lighthouse-performance-score.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/lighthouse-performance-score")

### lighthouse-performance-score Type

`number`

## lighthouse-pwa-score

Lighthouse Progressive Web App Score


`lighthouse-pwa-score`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-lighthouse-pwa-score.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/lighthouse-pwa-score")

### lighthouse-pwa-score Type

`number`

## js-parse-compile

JS Parse & Compile


`js-parse-compile`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-js-parse-compile.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/js-parse-compile")

### js-parse-compile Type

`number`

## dom-size

DOM Element Count


`dom-size`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-dom-size.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/dom-size")

### dom-size Type

`number`

## visually_complete_85

85% Visually Complete


`visually_complete_85`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-visually_complete_85.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/visually_complete_85")

### visually_complete_85 Type

`number`

## visually_complete

Visually Complete


`visually_complete`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-visually_complete.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/visually_complete")

### visually_complete Type

`number`

## consistently-interactive

Time to Interactive


`consistently-interactive`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-consistently-interactive.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/consistently-interactive")

### consistently-interactive Type

`number`

## first-interactive

First CPU Idle


`first-interactive`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-first-interactive.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/first-interactive")

### first-interactive Type

`number`

## time-to-first-byte

Time to First Byte


`time-to-first-byte`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-time-to-first-byte.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/time-to-first-byte")

### time-to-first-byte Type

`number`

## estimated-input-latency

Estimated input latency


`estimated-input-latency`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-estimated-input-latency.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/estimated-input-latency")

### estimated-input-latency Type

`number`

## speed_index

Speed Index


`speed_index`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-speed_index.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/speed_index")

### speed_index Type

`number`

## first-meaningful-paint

First Meaningful Paint


`first-meaningful-paint`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-first-meaningful-paint.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/first-meaningful-paint")

### first-meaningful-paint Type

`number`

## first-contentful-paint

First Contentful Paint


`first-contentful-paint`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-first-contentful-paint.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/first-contentful-paint")

### first-contentful-paint Type

`number`

## firstRender

First Paint


`firstRender`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-firstrender.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/firstRender")

### firstRender Type

`number`

## image_body_size_in_bytes

Total Image size in bytes


`image_body_size_in_bytes`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-image_body_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/image_body_size_in_bytes")

### image_body_size_in_bytes Type

`number`

## image_size_in_bytes

Total Image transferred


`image_size_in_bytes`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-image_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/image_size_in_bytes")

### image_size_in_bytes Type

`number`

## font_body_size_in_bytes

Total Webfont size in bytes


`font_body_size_in_bytes`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-font_body_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/font_body_size_in_bytes")

### font_body_size_in_bytes Type

`number`

## font_size_in_bytes

Total Webfont transferred


`font_size_in_bytes`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-font_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/font_size_in_bytes")

### font_size_in_bytes Type

`number`

## js_body_size_in_bytes

Total JavaScript size in bytes


`js_body_size_in_bytes`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-js_body_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/js_body_size_in_bytes")

### js_body_size_in_bytes Type

`number`

## js_size_in_bytes

Total JavaScript Transferred


`js_size_in_bytes`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-js_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/js_size_in_bytes")

### js_size_in_bytes Type

`number`

## css_body_size_in_bytes

Total CSS size in bytes


`css_body_size_in_bytes`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-css_body_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/css_body_size_in_bytes")

### css_body_size_in_bytes Type

`number`

## css_size_in_bytes

Total CSS transferred


`css_size_in_bytes`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-css_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/css_size_in_bytes")

### css_size_in_bytes Type

`number`

## html_body_size_in_bytes

Total HTML size in bytes


`html_body_size_in_bytes`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-html_body_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/html_body_size_in_bytes")

### html_body_size_in_bytes Type

`number`

## html_size_in_bytes

Total HTML transferred


`html_size_in_bytes`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-html_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/html_size_in_bytes")

### html_size_in_bytes Type

`number`

## page_wait_timing

Response time


`page_wait_timing`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-page_wait_timing.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/page_wait_timing")

### page_wait_timing Type

`number`

## page_size_in_bytes

Total Page transferred


`page_size_in_bytes`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-page_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/page_size_in_bytes")

### page_size_in_bytes Type

`number`

## page_body_size_in_bytes

Total Page size in bytes


`page_body_size_in_bytes`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-page_body_size_in_bytes.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/page_body_size_in_bytes")

### page_body_size_in_bytes Type

`number`

## asset_count

Number of requests


`asset_count`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-asset_count.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/asset_count")

### asset_count Type

`number`

## onload

onLoad


`onload`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-onload.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/onload")

### onload Type

`number`

## oncontentload

onContentLoad


`oncontentload`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Performance](performance-properties-oncontentload.md "https&#x3A;//ns.adobe.com/helix/shared/performance#/properties/oncontentload")

### oncontentload Type

`number`
