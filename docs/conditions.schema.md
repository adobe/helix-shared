
# Conditions Schema

```
https://ns.adobe.com/helix/shared/conditions
```

A condition expression

| Abstract | Extensible | Status | Identifiable | Custom Properties | Additional Properties | Defined In |
|----------|------------|--------|--------------|-------------------|-----------------------|------------|
| Can be instantiated | No | Stabilizing | No | Forbidden | Forbidden | [conditions.schema.json](conditions.schema.json) |
## Schema Hierarchy

* Conditions `https://ns.adobe.com/helix/shared/conditions`
  * [Conditions](conditions.schema.md) `https://ns.adobe.com/helix/shared/conditions`


# Conditions Properties

| Property | Type | Required | Nullable | Defined by |
|----------|------|----------|----------|------------|
| [and](#and) | complex | Optional  | No | Conditions (this schema) |
| [not](#not) | Conditions | Optional  | No | Conditions (this schema) |
| [or](#or) | complex | Optional  | No | Conditions (this schema) |
| `^url[=~]?$` | `string` | Pattern | No | Conditions (this schema) |
| `^url\.hostname[=~]?$` | `string` | Pattern | No | Conditions (this schema) |
| `^url\.path[=~]?$` | `string` | Pattern | No | Conditions (this schema) |
| `^referer[=~]?$` | `string` | Pattern | No | Conditions (this schema) |
| `^client_name[=~]?$` | `string` | Pattern | No | Conditions (this schema) |
| `^client_city[=~]?$` | `string` | Pattern | No | Conditions (this schema) |
| `^client_country_code[=~]?$` | `string` | Pattern | No | Conditions (this schema) |
| `^user_agent[=~]?$` | `string` | Pattern | No | Conditions (this schema) |
| `^accept_language[=~]?$` | `string` | Pattern | No | Conditions (this schema) |
| `^client_lat[&lt;=&gt;]?$` | `number` | Pattern | No | Conditions (this schema) |
| `^client_lon[&lt;=&gt;]?$` | `number` | Pattern | No | Conditions (this schema) |
| `^client_gmt_offset[&lt;=&gt;]?$` | `number` | Pattern | No | Conditions (this schema) |
| `^time[&lt;=&gt;]?$` | `string` | Pattern | No | Conditions (this schema) |
| `^time_day[&lt;=&gt;]?$` | `number` | Pattern | No | Conditions (this schema) |
| `^time_date[&lt;=&gt;]?$` | `number` | Pattern | No | Conditions (this schema) |
| `^time_hours[&lt;=&gt;]?$` | `number` | Pattern | No | Conditions (this schema) |
| `^time_minutes[&lt;=&gt;]?$` | `number` | Pattern | No | Conditions (this schema) |
| `^time_month[&lt;=&gt;]?$` | `number` | Pattern | No | Conditions (this schema) |
| `^time_year[&lt;=&gt;]?$` | `number` | Pattern | No | Conditions (this schema) |
| `^url_param\..+[~]?$` | `string` | Pattern | No | Conditions (this schema) |
| `^url_param\..+[&lt;&gt;]$` | `number` | Pattern | No | Conditions (this schema) |
| `^url_param\..+[=]$` | multiple | Pattern | No | Conditions (this schema) |

## and

All conditions in this list must be met

`and`

* is optional
* type: complex
* defined in this schema

### and Type


**One** of the following *conditions* need to be fulfilled.


#### Condition 1


Array type: 

All items must be of the type:
* []() – `https://ns.adobe.com/helix/shared/conditions`





#### Condition 2


* []() – `https://ns.adobe.com/helix/shared/conditions`






## not


`not`

* is optional
* type: Conditions
* defined in this schema

### not Type


* [Conditions](conditions.schema.md) – `https://ns.adobe.com/helix/shared/conditions`





## or

Any conditions in this list must be met

`or`

* is optional
* type: complex
* defined in this schema

### or Type


**One** of the following *conditions* need to be fulfilled.


#### Condition 1


Array type: 

All items must be of the type:
* []() – `https://ns.adobe.com/helix/shared/conditions`





#### Condition 2


* []() – `https://ns.adobe.com/helix/shared/conditions`






## Pattern: `^url[=~]?$`
Applies to all properties that match the regular expression `^url[=~]?$`


Matches the full URL, including request parameters

`^url[=~]?$`

* is a property pattern
* type: `string`
* defined in this schema

### Pattern ^url[=~]?$ Type


`string`







## Pattern: `^url\.hostname[=~]?$`
Applies to all properties that match the regular expression `^url\.hostname[=~]?$`


Matches the hostname only

`^url\.hostname[=~]?$`

* is a property pattern
* type: `string`
* defined in this schema

### Pattern ^url\.hostname[=~]?$ Type


`string`







## Pattern: `^url\.path[=~]?$`
Applies to all properties that match the regular expression `^url\.path[=~]?$`


Matches the path only. Path does not include the query string.

`^url\.path[=~]?$`

* is a property pattern
* type: `string`
* defined in this schema

### Pattern ^url\.path[=~]?$ Type


`string`







## Pattern: `^referer[=~]?$`
Applies to all properties that match the regular expression `^referer[=~]?$`


Matches the Referrer (note the spelling)

`^referer[=~]?$`

* is a property pattern
* type: `string`
* defined in this schema

### Pattern ^referer[=~]?$ Type


`string`







## Pattern: `^client_name[=~]?$`
Applies to all properties that match the regular expression `^client_name[=~]?$`


Matches the client's company or ISP name

`^client_name[=~]?$`

* is a property pattern
* type: `string`
* defined in this schema

### Pattern ^client_name[=~]?$ Type


`string`







## Pattern: `^client_city[=~]?$`
Applies to all properties that match the regular expression `^client_city[=~]?$`


Matches the client's city

`^client_city[=~]?$`

* is a property pattern
* type: `string`
* defined in this schema

### Pattern ^client_city[=~]?$ Type


`string`







## Pattern: `^client_country_code[=~]?$`
Applies to all properties that match the regular expression `^client_country_code[=~]?$`


Matches the ISO 3166-1 country code (two letters)

`^client_country_code[=~]?$`

* is a property pattern
* type: `string`
* defined in this schema

### Pattern ^client_country_code[=~]?$ Type


`string`







## Pattern: `^user_agent[=~]?$`
Applies to all properties that match the regular expression `^user_agent[=~]?$`


Matches the User Agent

`^user_agent[=~]?$`

* is a property pattern
* type: `string`
* defined in this schema

### Pattern ^user_agent[=~]?$ Type


`string`







## Pattern: `^accept_language[=~]?$`
Applies to all properties that match the regular expression `^accept_language[=~]?$`


Matches the Accept-Language header

`^accept_language[=~]?$`

* is a property pattern
* type: `string`
* defined in this schema

### Pattern ^accept_language[=~]?$ Type


`string`







## Pattern: `^client_lat[&lt;=&gt;]?$`
Applies to all properties that match the regular expression `^client_lat[&lt;=&gt;]?$`


Compares the latitude

`^client_lat[&lt;=&gt;]?$`

* is a property pattern
* type: `number`
* defined in this schema

### Pattern ^client_lat[&lt;=&gt;]?$ Type


`number`







## Pattern: `^client_lon[&lt;=&gt;]?$`
Applies to all properties that match the regular expression `^client_lon[&lt;=&gt;]?$`


Compares the longitude

`^client_lon[&lt;=&gt;]?$`

* is a property pattern
* type: `number`
* defined in this schema

### Pattern ^client_lon[&lt;=&gt;]?$ Type


`number`







## Pattern: `^client_gmt_offset[&lt;=&gt;]?$`
Applies to all properties that match the regular expression `^client_gmt_offset[&lt;=&gt;]?$`


UTC offset for the client's time zone. Values look like -100 or 300.

`^client_gmt_offset[&lt;=&gt;]?$`

* is a property pattern
* type: `number`
* defined in this schema

### Pattern ^client_gmt_offset[&lt;=&gt;]?$ Type


`number`







## Pattern: `^time[&lt;=&gt;]?$`
Applies to all properties that match the regular expression `^time[&lt;=&gt;]?$`


Absolute time of the request, evaluated against UTC

`^time[&lt;=&gt;]?$`

* is a property pattern
* type: `string`
* defined in this schema

### Pattern ^time[&lt;=&gt;]?$ Type


`string`

* format: `date-time` – date and time (according to [RFC 3339, section 5.6](http://tools.ietf.org/html/rfc3339))






## Pattern: `^time_day[&lt;=&gt;]?$`
Applies to all properties that match the regular expression `^time_day[&lt;=&gt;]?$`


Day of the week, same as Date.getDay() – adjusted for GMT offset

`^time_day[&lt;=&gt;]?$`

* is a property pattern
* type: `number`
* defined in this schema

### Pattern ^time_day[&lt;=&gt;]?$ Type


`number`







## Pattern: `^time_date[&lt;=&gt;]?$`
Applies to all properties that match the regular expression `^time_date[&lt;=&gt;]?$`


Day of the month, same as Date.getDate() – adjusted for GMT offset

`^time_date[&lt;=&gt;]?$`

* is a property pattern
* type: `number`
* defined in this schema

### Pattern ^time_date[&lt;=&gt;]?$ Type


`number`







## Pattern: `^time_hours[&lt;=&gt;]?$`
Applies to all properties that match the regular expression `^time_hours[&lt;=&gt;]?$`


Hour of the day, same as Date.getHours() – adjusted for GMT offset

`^time_hours[&lt;=&gt;]?$`

* is a property pattern
* type: `number`
* defined in this schema

### Pattern ^time_hours[&lt;=&gt;]?$ Type


`number`







## Pattern: `^time_minutes[&lt;=&gt;]?$`
Applies to all properties that match the regular expression `^time_minutes[&lt;=&gt;]?$`


Minute of the hour, same as Date.getMinutes() – adjusted for GMT offset

`^time_minutes[&lt;=&gt;]?$`

* is a property pattern
* type: `number`
* defined in this schema

### Pattern ^time_minutes[&lt;=&gt;]?$ Type


`number`







## Pattern: `^time_month[&lt;=&gt;]?$`
Applies to all properties that match the regular expression `^time_month[&lt;=&gt;]?$`


Month of the year, same as Date.getMonth() – adjusted for GMT offset

`^time_month[&lt;=&gt;]?$`

* is a property pattern
* type: `number`
* defined in this schema

### Pattern ^time_month[&lt;=&gt;]?$ Type


`number`







## Pattern: `^time_year[&lt;=&gt;]?$`
Applies to all properties that match the regular expression `^time_year[&lt;=&gt;]?$`


Year, same as Date.getFullYear() – adjusted for GMT offset

`^time_year[&lt;=&gt;]?$`

* is a property pattern
* type: `number`
* defined in this schema

### Pattern ^time_year[&lt;=&gt;]?$ Type


`number`







## Pattern: `^url_param\..+[~]?$`
Applies to all properties that match the regular expression `^url_param\..+[~]?$`


Matches a URL parameter's value as a string

`^url_param\..+[~]?$`

* is a property pattern
* type: `string`
* defined in this schema

### Pattern ^url_param\..+[~]?$ Type


`string`







## Pattern: `^url_param\..+[&lt;&gt;]$`
Applies to all properties that match the regular expression `^url_param\..+[&lt;&gt;]$`


Matches a URL parameter's value as a number

`^url_param\..+[&lt;&gt;]$`

* is a property pattern
* type: `number`
* defined in this schema

### Pattern ^url_param\..+[&lt;&gt;]$ Type


`number`







## Pattern: `^url_param\..+[=]$`
Applies to all properties that match the regular expression `^url_param\..+[=]$`


Matches a URL parameter's value as a number or string

`^url_param\..+[=]$`

* is a property pattern
* type: multiple
* defined in this schema

### Pattern ^url_param\..+[=]$ Type

Unknown type `number,string`.

```json
{
  "type": [
    "number",
    "string"
  ],
  "description": "Matches a URL parameter's value as a number or string",
  "simpletype": "multiple"
}
```




