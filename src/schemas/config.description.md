The `helix-config.yaml` file contains the list of Strains that have been configured for a Helix site. 

Each strain represents a variant of the site. It is required to have a default strain for each website. A strain is either a [Runtime strain](runtimestrain.md), if it's powered by the Helix pipeline on Adobe I/O Runtime, or a [Proxy strain](proxystrain.md), if it's serving content from another host.

All strains can have [Conditions](conditions.md) that determine if a visitor is eligible to see a certain strain. If a request fulfills the conditions of multiple strains, the first eligible strain will be served. This is why order of the strains in `helix-config.yaml` is important.