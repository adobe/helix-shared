A proxy strain is a strain that serves content from another web server, acting as a pure proxy.

## How are Proxy Strains configured?

Add an `origin` property to your strain object in the `helix-config.yaml`. The `origin` property can be either the base URL of the web server that you want to serve content from
or a more complex configuration object, described in the [Origin schema](origin.schema.md).

Most of the other properties that can be used to describe other strains (i.e. [Runtime strains](runtimestrain.schema.md)) do not work for Proxy strains and are not just irrelevant, but also forbidden.

## What are useful scenarios for Proxy Strains?

You can use Proxy Strains in a number of scenarios:

- in order to integrate non-Helix web applications that should run on the same hostname
- in order to serve legacy content from an old website as a fallback
- in order to enable a gradual migration of an existing site to Helix

A good pattern for migrating to Project Helix is to define one proxy strain as the `default` that serves the old site from the current backend.

Over time, add more and more runtime strains that are powered by Helix and adjust the `url` and `conditions` so that they receive more traffic.