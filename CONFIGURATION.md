# Configuration Design Guide

## Overview

All of a helix project configuration is contained in a single `helix-config.yaml` file. The YAML format is moderately more readable than JSON and almost as widely accepted. YAML benefits from features like comments and references, which are missing in JSON, .

For more stability of the config, the canonical structure of is validated with JSON Schema. This way errors are easily detected. The schemas also allow for a formal way of describing and documenting the configuration format. 

> TODO: 
> - tooling creates canonical `effective-helix-config.yaml` which contains comments for the source of all values
> - the effective file will/must not be checked into git

### Project Layout

- templates and pre functions are located in `./src`
- client side javascript **must not** go into `./src`. (TODO: we will provide a react example, and put the sources in `./react`)
- all static files go to `htdocs`
- all additional cgi-like openwhisk actions will go to `htdocs/cgi-bin`

### Strains are the only top-level concept

This means that there are no concepts that are orthogonal to strains, but that every other configuration object can be assigned to one or more strains, and that every request can be assigned to one specific strain.

There will be no reconciliation of strains and some other concept at runtime. Every `.hlx/strains.json` will contain a fully deterministic, fully resolved and denormalized representation of all strains.

### Complex configuration objects can be defined in a definitions container and re-used

In order to make writing configurations easier and to enable re-use of configuration settings, a `definitions` container at the top level of the `helix-config.yaml` is allowed that can hold re-usable definitions like this:

```yaml
definitions:
  strains:
    base: &basestrain
      code: /acapt/default/https---github-com-adobe-project-helix-io-git--master--
      sticky: false
    
  origins:
    publish: &publish
      address: 192.168.0.1
      name: publish
      use_ssl: false
```

Those definitions can the be reused using YAML references (`*publish`) or YAML extensions (`<< *basestrain`). This allows to rely on the behavior of the YAML parser instead of using home-grown inheritance and referencing logic.

A strain re-using the `*basestrain` above would look like this:

```yaml
  - name: client
    <<: *basestrain
    condition: req.http.host == "client.project-helix.io"
    content:
      repo: helix-cli
      ref: master
      owner: adobe
    directoryIndex: readme.html
```

A strain referencing the `*publish` origin would look like this:
```yaml
  - name: proxy-detailed
    sticky: true
    origin: *publish
```

### Mandatory `default` strain. 

The `default` strain serves all traffic in production when no other strain is selected, therefore a `default` strain is mandatory. This is enforced by the JSON schema. Since all inheritance becomes explicit by the use of YAML references, the `default` strain is special only in regards to serving traffic, but does not alter the behavior of any other strain.

### The `code` and `package` properties.

The `code` property of a strain defines which code repository the strain belongs to. This is useful to allocate strains to different environments, eg. testing, staging, production etc.

The `package` properties are usually only modified by the tooling and rarely need to be altered manually. The `package` property records which runtime action package is to be used to handle the requests of this strain.

### The `url` property

The `url` property for a strain is currently used as a shorthand for a strain matching condition. it also sets the base url which is used for path rewriting. 

> TODO: the url property might be replaced by the _condition object_ 
 
 
## Tooling Notes

### `hlx deploy`

- In order to increase the visibility of changes happening during deployment, `hlx deploy` list all strain names that will be affected by the deployment.

- `hlx deploy` gets the current git-remote `git remote get-url origin` as `$CURRENT_CODE_REPO` and checks all strains for a `code` property that matches the `$CURRENT_CODE_REPO`.

- If no strains are affected, `hlx deploy` will print a new strain config to `stdout` that points to the new `code` location (`$CURRENT_CODE_REPO`), copies all other values from `default` except for `url` or `condition`. The new strain will have an auto-generated, hard-to-guess name, so that it cannot unwittingly be accessed.

- When running `hlx deploy --add=foo` the new strain will be added to the configuration file automatically and `hlx deploy` will instead show instructions on accessing the strain.

- When running `hlx deploy --add=default` the default strain will be created or updated.

- `hlx deploy` updates the `package` property of all affected strains with the SHA of the current branch. It will append a `-dirty` accordingly if the current checkout is not clean.

> Notes:
> - Q: why is it important to have a random name? why not using the branch-name ?
> - A: Two reasons:
>      - to avoid conflicts
>      - to prevent people from forging the X-Strain cookie and getting access to development- or staging-only strains.

- A deployment that does not affect any strains will have a non-zero exit code, so that it can fail in CI.

### `hlx publish`

- `hlx publish` will only update the strains that contain a package property.

### `hlx up`

During local development, the simulator behaves similar to the edge, and selects the strain based on the `url` property (later  on the condition).
In order to simulator a specific domain for testing, `hlx up` accepts a `--host` argument, which overrides the `request.host` header in the simulator.

`hlx up` also provides a usable default configuration, in case a `helix-config.yaml` is missing. This config can be persisted using the `--save-config` argument.

## Open Discussions

### Parallel Deployments in a CI environment

Concurrent deployments from a CI environment pose a hard problem at the moment:

1. if the strain configuration cannot be modified by the deployment action, a new strain must be introduced for every new branch, prior to the creation of the branch, so that the branch can be deployed, published and tested
2. if the strain configuration can be modified by the deployment action, a new strain can be introduced, but as the `helix-config.yaml` is the single point of synchronization, publishing in one branch will automatically deactivate all strains that refer to concurrent deployments made in different branches. In active development, this will lead to race conditions and intermittent test failures because the strain you just published got "un-published" by a build triggered in another branch.
3. even within one branch, making two commits in short succession will lead to the second commit tainting the deployment of the first build, with potentially misleading results. For instance a bug fix might get attributed to the first commit because this is where testing first succeeds, although the fix was deployed in the second commit


### Proposal: Temporary Strains

For testing a deployment in a Continuous Integration environment, it can be useful to have strains that are not persisted in the `helix-config.yaml`, but can still be activated for testing.

To enable temporary strains, the strain resolution logic in VCL will be modified so that when an `X-Strain` cookie or header is present and the value of the header contains a `/`, both the `X-Strain` (name) and `X-Tag` (tag) will be parsed. 
For the most part, the default logic of the current `X-Strain` will be applied, so that the strain's directory index, static repo, etc. will be used. The only exception is the resolution of the OpenWhisk action to execute.
Here, the `-git--([\w]+)--` pattern will be replaced with the `X-Tag` value, effectively pinning the used action to the tagged deployment. 

As this will lead to a large number of temporary actions in OpenWhisk, we also introduce a `hlx undeploy` command that clears a temporary deployment made earlier. This can be run at the end of every CI job.

`hlx test` and `hlx perf` should use the new temporary strains when running in CI.
