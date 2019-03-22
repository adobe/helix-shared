
# Runtime Strain Schema

```
https://ns.adobe.com/helix/shared/performance
```

Performance testing details.

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [performance.schema.json](performance.schema.json) |

# Runtime Strain Properties

| Property | Type | Required | Defined by |
|----------|------|----------|------------|
| [asset_count](#asset_count) | `number` | Optional | Runtime Strain (this schema) |
| [connection](#connection) | `enum` | Optional | Runtime Strain (this schema) |
| [consistently-interactive](#consistently-interactive) | `number` | Optional | Runtime Strain (this schema) |
| [css_body_size_in_bytes](#css_body_size_in_bytes) | `number` | Optional | Runtime Strain (this schema) |
| [css_size_in_bytes](#css_size_in_bytes) | `number` | Optional | Runtime Strain (this schema) |
| [device](#device) | `enum` | Optional | Runtime Strain (this schema) |
| [dom-size](#dom-size) | `number` | Optional | Runtime Strain (this schema) |
| [estimated-input-latency](#estimated-input-latency) | `number` | Optional | Runtime Strain (this schema) |
| [first-contentful-paint](#first-contentful-paint) | `number` | Optional | Runtime Strain (this schema) |
| [first-interactive](#first-interactive) | `number` | Optional | Runtime Strain (this schema) |
| [first-meaningful-paint](#first-meaningful-paint) | `number` | Optional | Runtime Strain (this schema) |
| [firstRender](#firstrender) | `number` | Optional | Runtime Strain (this schema) |
| [font_body_size_in_bytes](#font_body_size_in_bytes) | `number` | Optional | Runtime Strain (this schema) |
| [font_size_in_bytes](#font_size_in_bytes) | `number` | Optional | Runtime Strain (this schema) |
| [html_body_size_in_bytes](#html_body_size_in_bytes) | `number` | Optional | Runtime Strain (this schema) |
| [html_size_in_bytes](#html_size_in_bytes) | `number` | Optional | Runtime Strain (this schema) |
| [image_body_size_in_bytes](#image_body_size_in_bytes) | `number` | Optional | Runtime Strain (this schema) |
| [image_size_in_bytes](#image_size_in_bytes) | `number` | Optional | Runtime Strain (this schema) |
| [js-parse-compile](#js-parse-compile) | `number` | Optional | Runtime Strain (this schema) |
| [js_body_size_in_bytes](#js_body_size_in_bytes) | `number` | Optional | Runtime Strain (this schema) |
| [js_size_in_bytes](#js_size_in_bytes) | `number` | Optional | Runtime Strain (this schema) |
| [lighthouse-accessibility-score](#lighthouse-accessibility-score) | `number` | Optional | Runtime Strain (this schema) |
| [lighthouse-best-practices-score](#lighthouse-best-practices-score) | `number` | Optional | Runtime Strain (this schema) |
| [lighthouse-performance-score](#lighthouse-performance-score) | `number` | Optional | Runtime Strain (this schema) |
| [lighthouse-pwa-score](#lighthouse-pwa-score) | `number` | Optional | Runtime Strain (this schema) |
| [lighthouse-seo-score](#lighthouse-seo-score) | `number` | Optional | Runtime Strain (this schema) |
| [location](#location) | `enum` | Optional | Runtime Strain (this schema) |
| [oncontentload](#oncontentload) | `number` | Optional | Runtime Strain (this schema) |
| [onload](#onload) | `number` | Optional | Runtime Strain (this schema) |
| [page_body_size_in_bytes](#page_body_size_in_bytes) | `number` | Optional | Runtime Strain (this schema) |
| [page_size_in_bytes](#page_size_in_bytes) | `number` | Optional | Runtime Strain (this schema) |
| [page_wait_timing](#page_wait_timing) | `number` | Optional | Runtime Strain (this schema) |
| [speed_index](#speed_index) | `number` | Optional | Runtime Strain (this schema) |
| [time-to-first-byte](#time-to-first-byte) | `number` | Optional | Runtime Strain (this schema) |
| [visually_complete](#visually_complete) | `number` | Optional | Runtime Strain (this schema) |
| [visually_complete_85](#visually_complete_85) | `number` | Optional | Runtime Strain (this schema) |

## asset_count

Number of requests

`asset_count`

* is optional
* type: `number`
* defined in this schema

### asset_count Type


`number`







## connection

Testing connection

`connection`

* is optional
* type: `enum`
* defined in this schema

The value of this property **must** be equal to one of the [known values below](#connection-known-values).

### connection Known Values
| Value | Description |
|-------|-------------|
| `` |  |
| `regular2G` |  |
| `good2G` |  |
| `slow3G` |  |
| `regular3G` |  |
| `good3G` |  |
| `emergingMarkets` |  |
| `regular4G` |  |
| `LTE` |  |
| `dsl` |  |
| `wifi` |  |
| `cable` |  |




## consistently-interactive

Time to Interactive

`consistently-interactive`

* is optional
* type: `number`
* defined in this schema

### consistently-interactive Type


`number`







## css_body_size_in_bytes

Total CSS size in bytes

`css_body_size_in_bytes`

* is optional
* type: `number`
* defined in this schema

### css_body_size_in_bytes Type


`number`







## css_size_in_bytes

Total CSS transferred

`css_size_in_bytes`

* is optional
* type: `number`
* defined in this schema

### css_size_in_bytes Type


`number`







## device

Testing device

`device`

* is optional
* type: `enum`
* defined in this schema

The value of this property **must** be equal to one of the [known values below](#device-known-values).

### device Known Values
| Value | Description |
|-------|-------------|
| `` |  |
| `MotorolaMotoG4` |  |
| `iPhone5` |  |
| `iPhone6` |  |
| `iPhone6Plus` |  |
| `iPhone7` |  |
| `iPhone8` |  |
| `Nexus5X` |  |
| `Nexus6P` |  |
| `GalaxyS5` |  |
| `iPad` |  |
| `iPadPro` |  |




## dom-size

DOM Element Count

`dom-size`

* is optional
* type: `number`
* defined in this schema

### dom-size Type


`number`







## estimated-input-latency

Estimated input latency

`estimated-input-latency`

* is optional
* type: `number`
* defined in this schema

### estimated-input-latency Type


`number`







## first-contentful-paint

First Contentful Paint

`first-contentful-paint`

* is optional
* type: `number`
* defined in this schema

### first-contentful-paint Type


`number`







## first-interactive

First CPU Idle

`first-interactive`

* is optional
* type: `number`
* defined in this schema

### first-interactive Type


`number`







## first-meaningful-paint

First Meaningful Paint

`first-meaningful-paint`

* is optional
* type: `number`
* defined in this schema

### first-meaningful-paint Type


`number`







## firstRender

First Paint

`firstRender`

* is optional
* type: `number`
* defined in this schema

### firstRender Type


`number`







## font_body_size_in_bytes

Total Webfont size in bytes

`font_body_size_in_bytes`

* is optional
* type: `number`
* defined in this schema

### font_body_size_in_bytes Type


`number`







## font_size_in_bytes

Total Webfont transferred

`font_size_in_bytes`

* is optional
* type: `number`
* defined in this schema

### font_size_in_bytes Type


`number`







## html_body_size_in_bytes

Total HTML size in bytes

`html_body_size_in_bytes`

* is optional
* type: `number`
* defined in this schema

### html_body_size_in_bytes Type


`number`







## html_size_in_bytes

Total HTML transferred

`html_size_in_bytes`

* is optional
* type: `number`
* defined in this schema

### html_size_in_bytes Type


`number`







## image_body_size_in_bytes

Total Image size in bytes

`image_body_size_in_bytes`

* is optional
* type: `number`
* defined in this schema

### image_body_size_in_bytes Type


`number`







## image_size_in_bytes

Total Image transferred

`image_size_in_bytes`

* is optional
* type: `number`
* defined in this schema

### image_size_in_bytes Type


`number`







## js-parse-compile

JS Parse & Compile

`js-parse-compile`

* is optional
* type: `number`
* defined in this schema

### js-parse-compile Type


`number`







## js_body_size_in_bytes

Total JavaScript size in bytes

`js_body_size_in_bytes`

* is optional
* type: `number`
* defined in this schema

### js_body_size_in_bytes Type


`number`







## js_size_in_bytes

Total JavaScript Transferred

`js_size_in_bytes`

* is optional
* type: `number`
* defined in this schema

### js_size_in_bytes Type


`number`







## lighthouse-accessibility-score

Lighthouse Accessibility Score

`lighthouse-accessibility-score`

* is optional
* type: `number`
* defined in this schema

### lighthouse-accessibility-score Type


`number`







## lighthouse-best-practices-score

Lighthouse Best Practices Score

`lighthouse-best-practices-score`

* is optional
* type: `number`
* defined in this schema

### lighthouse-best-practices-score Type


`number`







## lighthouse-performance-score

Lighthouse Performance Score

`lighthouse-performance-score`

* is optional
* type: `number`
* defined in this schema

### lighthouse-performance-score Type


`number`







## lighthouse-pwa-score

Lighthouse Progressive Web App Score

`lighthouse-pwa-score`

* is optional
* type: `number`
* defined in this schema

### lighthouse-pwa-score Type


`number`







## lighthouse-seo-score

Lighthouse SEO Score

`lighthouse-seo-score`

* is optional
* type: `number`
* defined in this schema

### lighthouse-seo-score Type


`number`







## location

Testing location

`location`

* is optional
* type: `enum`
* defined in this schema

The value of this property **must** be equal to one of the [known values below](#location-known-values).

### location Known Values
| Value | Description |
|-------|-------------|
| `` |  |
| `NorthVirginia` |  |
| `Frankfurt` |  |
| `Sydney` |  |
| `Ohio` |  |
| `California` |  |
| `Oregon` |  |
| `Canada` |  |
| `Ireland` |  |
| `Tokyo` |  |
| `Seoul` |  |
| `Singapore` |  |
| `Mumbai` |  |
| `SaoPaulo` |  |
| `London` |  |




## oncontentload

onContentLoad

`oncontentload`

* is optional
* type: `number`
* defined in this schema

### oncontentload Type


`number`







## onload

onLoad

`onload`

* is optional
* type: `number`
* defined in this schema

### onload Type


`number`







## page_body_size_in_bytes

Total Page size in bytes

`page_body_size_in_bytes`

* is optional
* type: `number`
* defined in this schema

### page_body_size_in_bytes Type


`number`







## page_size_in_bytes

Total Page transferred

`page_size_in_bytes`

* is optional
* type: `number`
* defined in this schema

### page_size_in_bytes Type


`number`







## page_wait_timing

Response time

`page_wait_timing`

* is optional
* type: `number`
* defined in this schema

### page_wait_timing Type


`number`







## speed_index

Speed Index

`speed_index`

* is optional
* type: `number`
* defined in this schema

### speed_index Type


`number`







## time-to-first-byte

Time to First Byte

`time-to-first-byte`

* is optional
* type: `number`
* defined in this schema

### time-to-first-byte Type


`number`







## visually_complete

Visually Complete

`visually_complete`

* is optional
* type: `number`
* defined in this schema

### visually_complete Type


`number`







## visually_complete_85

85% Visually Complete

`visually_complete_85`

* is optional
* type: `number`
* defined in this schema

### visually_complete_85 Type


`number`






