# Conditions Schema

```txt
https://ns.adobe.com/helix/shared/conditions
```

A condition expression


| Abstract            | Extensible | Status      | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                              |
| :------------------ | ---------- | ----------- | ------------ | :---------------- | --------------------- | ------------------- | ----------------------------------------------------------------------- |
| Can be instantiated | No         | Stabilizing | No           | Forbidden         | Forbidden             | none                | [conditions.schema.json](conditions.schema.json "open original schema") |

## Conditions Type

`object` ([Conditions](conditions.md))

## Conditions Constraints

**maximum number of properties**: the maximum number of properties for this object is: `1`

**minimum number of properties**: the minimum number of properties for this object is: `1`

# Conditions Properties

| Property                     | Type     | Required | Nullable       | Defined by                                                                                                                                                           |
| :--------------------------- | -------- | -------- | -------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [and](#and)                  | `array`  | Optional | cannot be null | [Conditions](conditions-properties-and.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/properties/and")                                                       |
| [or](#or)                    | `array`  | Optional | cannot be null | [Conditions](conditions-properties-or.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/properties/or")                                                         |
| [not](#not)                  | `object` | Optional | cannot be null | [Conditions](conditions-properties-conditions.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/properties/not")                                                |
| `^url[=~]?$`                 | `string` | Optional | cannot be null | [Conditions](conditions-patternproperties-url.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^url\[=~]?$")                                 |
| `^url\.hostname[=~]?$`       | `string` | Optional | cannot be null | [Conditions](conditions-patternproperties-urlhostname.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^url\\.hostname\[=~]?$")              |
| `^url\.path[=~]?$`           | `string` | Optional | cannot be null | [Conditions](conditions-patternproperties-urlpath.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^url\\.path\[=~]?$")                      |
| `^referer[=~]?$`             | `string` | Optional | cannot be null | [Conditions](conditions-patternproperties-referer.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^referer\[=~]?$")                         |
| `^client_name[=~]?$`         | `string` | Optional | cannot be null | [Conditions](conditions-patternproperties-client_name.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^client_name\[=~]?$")                 |
| `^client_city[=~]?$`         | `string` | Optional | cannot be null | [Conditions](conditions-patternproperties-client_city.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^client_city\[=~]?$")                 |
| `^client_country_code[=~]?$` | `string` | Optional | cannot be null | [Conditions](conditions-patternproperties-client_country_code.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^client_country_code\[=~]?$") |
| `^user_agent[=~]?$`          | `string` | Optional | cannot be null | [Conditions](conditions-patternproperties-user_agent.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^user_agent\[=~]?$")                   |
| `^accept_language[=~]?$`     | `string` | Optional | cannot be null | [Conditions](conditions-patternproperties-accept_language.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^accept_language\[=~]?$")         |
| `^client_lat[<=>]?$`         | `number` | Optional | cannot be null | [Conditions](conditions-patternproperties-client_lat.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^client_lat\[&lt;=>]?$")               |
| `^client_lon[<=>]?$`         | `number` | Optional | cannot be null | [Conditions](conditions-patternproperties-client_lon.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^client_lon\[&lt;=>]?$")               |
| `^client_gmt_offset[<=>]?$`  | `number` | Optional | cannot be null | [Conditions](conditions-patternproperties-client_gmt_offset.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^client_gmt_offset\[&lt;=>]?$") |
| `^time[<=>]?$`               | `string` | Optional | cannot be null | [Conditions](conditions-patternproperties-time.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time\[&lt;=>]?$")                           |
| `^time_day[<=>]?$`           | `number` | Optional | cannot be null | [Conditions](conditions-patternproperties-time_day.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time_day\[&lt;=>]?$")                   |
| `^time_date[<=>]?$`          | `number` | Optional | cannot be null | [Conditions](conditions-patternproperties-time_date.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time_date\[&lt;=>]?$")                 |
| `^time_hours[<=>]?$`         | `number` | Optional | cannot be null | [Conditions](conditions-patternproperties-time_hours.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time_hours\[&lt;=>]?$")               |
| `^time_minutes[<=>]?$`       | `number` | Optional | cannot be null | [Conditions](conditions-patternproperties-time_minutes.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time_minutes\[&lt;=>]?$")           |
| `^time_month[<=>]?$`         | `number` | Optional | cannot be null | [Conditions](conditions-patternproperties-time_month.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time_month\[&lt;=>]?$")               |
| `^time_year[<=>]?$`          | `number` | Optional | cannot be null | [Conditions](conditions-patternproperties-time_year.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time_year\[&lt;=>]?$")                 |
| `^url_param\..+[~]?$`        | `string` | Optional | cannot be null | [Conditions](conditions-patternproperties-url_param.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^url_param\\..+\[~]?$")                 |
| `^url_param\..+[<>]$`        | `number` | Optional | cannot be null | [Conditions](conditions-patternproperties-url_param-1.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^url_param\\..+\[&lt;>]$")            |
| `^url_param\..+[=]$`         | Multiple | Optional | cannot be null | [Conditions](conditions-patternproperties-url_param-2.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^url_param\\..+\[=]$")                |
| `^preflight\..+[~]?$`        | `string` | Optional | cannot be null | [Conditions](conditions-patternproperties-preflight.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^preflight\\..+\[~]?$")                 |
| `^preflight\..+[<>]$`        | `number` | Optional | cannot be null | [Conditions](conditions-patternproperties-preflight-1.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^preflight\\..+\[&lt;>]$")            |
| `^preflight\..+[=]$`         | Multiple | Optional | cannot be null | [Conditions](conditions-patternproperties-preflight-2.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^preflight\\..+\[=]$")                |

## and

All conditions in this list must be met


`and`

-   is optional
-   Type: `object[]` ([Conditions](conditions-properties-conditions.md))
-   cannot be null
-   defined in: [Conditions](conditions-properties-and.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/properties/and")

### and Type

`object[]` ([Conditions](conditions-properties-conditions.md))

## or

Any conditions in this list must be met


`or`

-   is optional
-   Type: `object[]` ([Conditions](conditions-properties-conditions.md))
-   cannot be null
-   defined in: [Conditions](conditions-properties-or.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/properties/or")

### or Type

`object[]` ([Conditions](conditions-properties-conditions.md))

## not

A condition expression


`not`

-   is optional
-   Type: `object` ([Conditions](conditions-properties-conditions.md))
-   cannot be null
-   defined in: [Conditions](conditions-properties-conditions.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/properties/not")

### not Type

`object` ([Conditions](conditions-properties-conditions.md))

### not Constraints

**maximum number of properties**: the maximum number of properties for this object is: `1`

**minimum number of properties**: the minimum number of properties for this object is: `1`

## Pattern: `^url[=~]?$`

Matches the full URL, including request parameters


`^url[=~]?$`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-url.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^url\[=~]?$")

### ^url\[=~]?$ Type

`string`

## Pattern: `^url\.hostname[=~]?$`

Matches the hostname only


`^url\.hostname[=~]?$`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-urlhostname.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^url\\.hostname\[=~]?$")

### ^url\\.hostname\[=~]?$ Type

`string`

## Pattern: `^url\.path[=~]?$`

Matches the path only. Path does not include the query string.


`^url\.path[=~]?$`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-urlpath.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^url\\.path\[=~]?$")

### ^url\\.path\[=~]?$ Type

`string`

## Pattern: `^referer[=~]?$`

Matches the Referrer (note the spelling)


`^referer[=~]?$`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-referer.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^referer\[=~]?$")

### ^referer\[=~]?$ Type

`string`

## Pattern: `^client_name[=~]?$`

Matches the client's company or ISP name


`^client_name[=~]?$`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-client_name.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^client_name\[=~]?$")

### ^client_name\[=~]?$ Type

`string`

## Pattern: `^client_city[=~]?$`

Matches the client's city


`^client_city[=~]?$`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-client_city.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^client_city\[=~]?$")

### ^client_city\[=~]?$ Type

`string`

## Pattern: `^client_country_code[=~]?$`

Matches the ISO 3166-1 country code (two letters)


`^client_country_code[=~]?$`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-client_country_code.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^client_country_code\[=~]?$")

### ^client_country_code\[=~]?$ Type

`string`

## Pattern: `^user_agent[=~]?$`

Matches the User Agent


`^user_agent[=~]?$`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-user_agent.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^user_agent\[=~]?$")

### ^user_agent\[=~]?$ Type

`string`

## Pattern: `^accept_language[=~]?$`

Matches the Accept-Language header


`^accept_language[=~]?$`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-accept_language.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^accept_language\[=~]?$")

### ^accept_language\[=~]?$ Type

`string`

## Pattern: `^client_lat[<=>]?$`

Compares the latitude


`^client_lat[<=>]?$`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-client_lat.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^client_lat\[&lt;=>]?$")

### ^client_lat\[&lt;=>]?$ Type

`number`

## Pattern: `^client_lon[<=>]?$`

Compares the longitude


`^client_lon[<=>]?$`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-client_lon.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^client_lon\[&lt;=>]?$")

### ^client_lon\[&lt;=>]?$ Type

`number`

## Pattern: `^client_gmt_offset[<=>]?$`

UTC offset for the client's time zone. Values look like -100 or 300.


`^client_gmt_offset[<=>]?$`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-client_gmt_offset.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^client_gmt_offset\[&lt;=>]?$")

### ^client_gmt_offset\[&lt;=>]?$ Type

`number`

## Pattern: `^time[<=>]?$`

Absolute time of the request, evaluated against UTC


`^time[<=>]?$`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-time.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time\[&lt;=>]?$")

### ^time\[&lt;=>]?$ Type

`string`

### ^time\[&lt;=>]?$ Constraints

**date time**: the string must be a date time string, according to [RFC 3339, section 5.6](https://tools.ietf.org/html/rfc3339 "check the specification")

## Pattern: `^time_day[<=>]?$`

Day of the week, same as Date.getDay() – adjusted for GMT offset


`^time_day[<=>]?$`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-time_day.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time_day\[&lt;=>]?$")

### ^time_day\[&lt;=>]?$ Type

`number`

## Pattern: `^time_date[<=>]?$`

Day of the month, same as Date.getDate() – adjusted for GMT offset


`^time_date[<=>]?$`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-time_date.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time_date\[&lt;=>]?$")

### ^time_date\[&lt;=>]?$ Type

`number`

## Pattern: `^time_hours[<=>]?$`

Hour of the day, same as Date.getHours() – adjusted for GMT offset


`^time_hours[<=>]?$`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-time_hours.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time_hours\[&lt;=>]?$")

### ^time_hours\[&lt;=>]?$ Type

`number`

## Pattern: `^time_minutes[<=>]?$`

Minute of the hour, same as Date.getMinutes() – adjusted for GMT offset


`^time_minutes[<=>]?$`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-time_minutes.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time_minutes\[&lt;=>]?$")

### ^time_minutes\[&lt;=>]?$ Type

`number`

## Pattern: `^time_month[<=>]?$`

Month of the year, same as Date.getMonth() – adjusted for GMT offset


`^time_month[<=>]?$`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-time_month.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time_month\[&lt;=>]?$")

### ^time_month\[&lt;=>]?$ Type

`number`

## Pattern: `^time_year[<=>]?$`

Year, same as Date.getFullYear() – adjusted for GMT offset


`^time_year[<=>]?$`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-time_year.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^time_year\[&lt;=>]?$")

### ^time_year\[&lt;=>]?$ Type

`number`

## Pattern: `^url_param\..+[~]?$`

Matches a URL parameter's value as a string


`^url_param\..+[~]?$`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-url_param.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^url_param\\..+\[~]?$")

### ^url_param\\..+\[~]?$ Type

`string`

## Pattern: `^url_param\..+[<>]$`

Matches a URL parameter's value as a number


`^url_param\..+[<>]$`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-url_param-1.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^url_param\\..+\[&lt;>]$")

### ^url_param\\..+\[&lt;>]$ Type

`number`

## Pattern: `^url_param\..+[=]$`

Matches a URL parameter's value as a number or string


`^url_param\..+[=]$`

-   is optional
-   Type: any of the folllowing: `number` or `string` ([Details](conditions-patternproperties-url_param-2.md))
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-url_param-2.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^url_param\\..+\[=]$")

### ^url_param\\..+\[=]$ Type

any of the folllowing: `number` or `string` ([Details](conditions-patternproperties-url_param-2.md))

## Pattern: `^preflight\..+[~]?$`

Matches a preflight response header value as a string


`^preflight\..+[~]?$`

-   is optional
-   Type: `string`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-preflight.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^preflight\\..+\[~]?$")

### ^preflight\\..+\[~]?$ Type

`string`

## Pattern: `^preflight\..+[<>]$`

Matches a preflight response header value as a number


`^preflight\..+[<>]$`

-   is optional
-   Type: `number`
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-preflight-1.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^preflight\\..+\[&lt;>]$")

### ^preflight\\..+\[&lt;>]$ Type

`number`

## Pattern: `^preflight\..+[=]$`

Matches a preflight response header value as a number or string


`^preflight\..+[=]$`

-   is optional
-   Type: any of the folllowing: `number` or `string` ([Details](conditions-patternproperties-preflight-2.md))
-   cannot be null
-   defined in: [Conditions](conditions-patternproperties-preflight-2.md "https&#x3A;//ns.adobe.com/helix/shared/conditions#/patternProperties/^preflight\\..+\[=]$")

### ^preflight\\..+\[=]$ Type

any of the folllowing: `number` or `string` ([Details](conditions-patternproperties-preflight-2.md))
