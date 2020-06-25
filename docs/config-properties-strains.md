# Strains Schema

```txt
https://ns.adobe.com/helix/shared/strains#/properties/strains
```




| Abstract               | Extensible | Status      | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                        |
| :--------------------- | ---------- | ----------- | ----------------------- | :---------------- | --------------------- | ------------------- | ----------------------------------------------------------------- |
| Cannot be instantiated | Yes        | Stabilizing | Unknown identifiability | Forbidden         | Allowed               | none                | [config.schema.json\*](config.schema.json "open original schema") |

## strains Type

merged type ([Strains](config-properties-strains.md))

one (and only one) of

-   [Untitled array in Strains](strains-oneof-0.md "check type definition")

# Strains Definitions

## Definitions group anystrain

Reference this group by using

```json
{"$ref":"https://ns.adobe.com/helix/shared/strains#/definitions/anystrain"}
```




`anystrain`

-   is optional
-   Type: merged type ([Details](strains-definitions-anystrain.md))
-   cannot be null
-   defined in: [Strains](strains-definitions-anystrain.md "https&#x3A;//ns.adobe.com/helix/shared/strains#/definitions/anystrain")

### anystrain Type

merged type ([Details](strains-definitions-anystrain.md))

one (and only one) of

-   [Proxy Strain](strains-definitions-anystrain-oneof-proxy-strain.md "check type definition")
-   [Runtime Strain](strains-definitions-anystrain-oneof-runtime-strain.md "check type definition")
