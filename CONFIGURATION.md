# Configuration Design Guide

## Current Status

It looks like we need to have another discussion about our configuration format and how configuration behaves. What we have at the moment, looks like this:

- users create a `helix-config.yaml` which will be loaded and denormalized into `.hlx/strains.json`
- the `helix-config.yaml` contains a number of top-level (global) definitions and a map of `strains`
- each defined strain takes default values from:
  - the global definitions
  - the command line options
  - the "default" strain
  - application defaults
  - (the exact precedence rules differ from property to property)

Our developer needs include:
- the ability to start developing without any configuration file at all
- the ability to quickly generate testable strains for code or content branches that are under development
- the ability to quickly and conveniently switch between strains in simulator and production
- the assurance that none of the above will break a published site
- the ability to do all of the above in a fully automated fashion on a CI system (e.g. generate and deploy a new strain for a new branch)

Site administration needs also include:
- the ability to define content mount points
- the ability to pass through traffic to another CMS (proxy strains)

Furthermore, we should establish:
- automated validation of configuration files that is independent from loading them
- detailed and generated documentation for all configuration properties

## Proposal: We keep YAML as the configuration format

While I have a good collection of scars from dealing with YAML (especially in CircleCI), I think the format is moderately more readable than JSON and almost as widely accepted, which makes it worthwhile suffering through it instead of picking something that will feel uncommon or out of the time.

## Proposal: We introduce a JSON Schema for configuration files

This way you can see errors in configuration files while editing them, and we have a formal way of describing and documenting the configuration format. 

> Notes:
> - The validation is done during `HelixConfig.parse()`. 
> - Using a IDE plugin, the yaml can also be validated during input.

## Proposal: Strains are the only top-level concept

This means that there are no concepts that are orthogonal to strains, but that every other configuration object can be assigned to one or more strains, and that every request can be assigned to one specific strain.

There will be no reconciliation of strains and some other concept at runtime. Every .hlx/strains.json will contain a fully deterministic, fully resolved and denormalized representation of all strains.

## Proposal: Other complex configuration objects can be defined in a definitions container and re-used

In order to make writing configurations easier and to enable re-use of configuration settings, we introduce a definitions container at the top level of the `helix-config.yaml` that can hold re-usable definitions like this:

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

## Proposal: Configuration objects can be referenced using YAML references

In order to re-use a complex configuration object (like an origin, a mount mapping, or even a strain), use YAML references (`*publish`) or YAML extensions (`<< *basestrain`). This allows us to rely on the behavior of the YAML parser instead of using home-grown inheritance and referencing logic that is likely less robust and certainly less well documented.

A strain re-using the `*basestrain` above would look like this:

```yaml
  client:
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
  proxy-detailed:
    sticky: true
    origin: *publish
```

## Proposal: The `default` strain serves all traffic in production when no other strain is selected, therefore a `default` strain is mandatory

We need one strain that is serving traffic that no other strain claims. This could be one by:

1. requiring the existence of a `default` strain
2. requiring the existence of one and only one strain that has the `default: true` property set

Option (1) is easier to validate than option (2) and less error prone (every YAML editor will tell you if you have two keys called `default`), so I'd opt for (1)

`hlx publish` should fail when no `default` strain exists.
`hlx up` can continue without a `default` strain, but should issue a warning

> Notes:
> - Option (1) is favoured.
> - selecting a predefined strain is simple with yaml references, eg: `default: *strains.master`

## Proposal: There is no implicit inheritance from `default`

All inheritance becomes explicit, using the mechanism laid out in 
https://github.com/adobe/helix-shared/issues/11#issuecomment-443122026. This means the `default` strain is special only in regards to serving traffic, but does not alter the behavior of any other strain.

## Proposal: Strains can have a `mount` configuration that maps URL paths to content paths

**DECLINED**

> Notes:
> We decided during the 4/2018 hackathon not to introduce mount points, so that it will be X strains for X mount points.

<del>
Right now, strains can have only one `content` node. With support for `mount`, a strain can have either a `content` or a `mount` property. Each `mount` object is a map between the URL path (key) and a `content` property (either git URL or object).

```yaml
strains:
  default:
    mount:
      /: https://github.com/adobe/project-helix.io.git
      /pipeline: https://github.com/adobe/helix-pipeline.git
      /cli: https://github.com/adobe/helix-cli.git
```
</del>

## Proposal: `mount` points can take Git URLs, `content` objects/references, Backend URLs, `origin` objects/references

> Notes:
> We decided during the 4/2018 hackathon not to introduce mount points, so that it will be X strains for X mount points.

<del>
That way you can have a consistent traffic mapping without having to switch strains.
</del>

## Proposal: `hlx deploy` lists all strains that are affected by the deployment and suggests the creation of a new strain if none are affected

> Notes:
> - `hlx deploy` would generate a finite amount of deployment packages, and we can find out if there are referenced in the YAML.

In order to increase the visibility of changes happening during deployment, `hlx deploy` will list all strain names that will be affected by the deployment.

If no strains are affected, `hlx deploy` will print a new strain config to `stdout` that points to the new `code` location, copies all other values from `default` except for `url` or `condition`. The new strain will have an auto-generated, hard-to-guess name, so that it cannot unwittingly be accessed.

> Notes:
> - Q: why is it important to have a random name? why not using the branch-name ?
> - A: Two reasons:
>      - to avoid conflicts
>      - to prevent people from forging the X-Strain cookie and getting access to development- or staging-only strains.

A deployment that does not affect any strains will have a non-zero exit code, so that it can fail in CI.

When running `hlx deploy --add=foo` the new strain will be added to the configuration file automatically and `hlx deploy` will instead show instructions on accessing the strain.


## Discussion: files

> Notes from the 4/2018 hackathon:

- we will have **one** config helix-config.yaml
- it will create a canonical `effective-helix-config.yaml` which contains comments for the source of all values
- the effective file will/must not be checked into git


## Discussion: No implicit defaults

I have a hard time reconciling the requirement 

> - the ability to start developing without any configuration file at all

which points at defaults and "magic" values with the kind of predictability and rigidity we need for requirements like

> - the assurance that none of the above will break a published site
> - the ability to do all of the above in a fully automated fashion on a CI system (e.g. generate and deploy a new strain for a new branch)

### Proposal: No implicit defaults

Therefore, a radical proposal: **we won't have any implicit defaults**. 
At all. Strains won't magically inherit configuration values from:
- the global properties in the `helix-config.yaml`
- the command line
- application (CLI) provided defaults
- runtime (Fastly) provided defaults

Unless you configure or reference a configuration value directly, it won't be effective. 
Unless all required configuration values are set, you won't be able to deploy or publish.

### Proposal: Generate a usable default configuration

The flipside of this is that in order to enable development without any upfront configuration, we need to generate a usable default configuration taking the current context into consideration.

A default configuration should be suggested when:
- running `hlx deploy`
- running `hlx publish`
- running `hlx perf`
- running `hlx demo`
- outside of a CI environment

A default configuartion should be saved when:
- running `hlx * --save`
- running `hlx up`

The default configuration should have two strains:
- `default` pointing to the git remote
- `dev` pointing to localhost


## Proposal: Move `url` under `condition`

The `url` property for a strain is currently used as a shorthand for a strain matching condition (it also sets the base URL), so it would make sense to move it below `conditions`, especially considering that additional conditions may be added later.

## Discussion: Parallel Deployments in a CI environment

Concurrent deployments from a CI environment pose a hard problem at the moment:

1. if the strain configuration cannot be modified by the deployment action, a new strain must be introduced for every new branch, prior to the creation of the branch, so that the branch can be deployed and tested
2. if the strain configuration can be modified by the deployment action, a new strain can be introduced, but as the `helix-config.yaml` is the single point of synchronization, deployment in one branch will automatically deactivate all strains that refer to concurrent deployments made in different branches. In active development, this will lead to race conditions and intermittent test failures because the strain you just deployed got "undeployed" by a build triggered in another branch.
3. even within one branch, making two committs in short succession will lead to the second commit tainting the deployment of the first build, with potentially misleading results. For instance a bug fix might get attributed to the first commit because this is where testing first succeeds, although the fix was deployed in the second commit


### Proposal: Temporary Strains

We introduce a new option for `hlx deploy --temp <tag[]?>` that takes zero or more tags for temporary deployments. By default, it uses `CIRCLE_SHA1` as the tag, i.e. the SHA1 hash of the last commit of the current build. This ties the deployment to the individual commit and avoids accidential overwriting.

When running `hlx deploy --temp`, all strains that refer a code repository that differs from the current repository will be ignored to avoid unccessary deploys.
All strains that refer to the current code repository will be deployed with a `code` prefix that ends with the value of `tag`, e.g. `/acapt/default/https---github-com-adobe-project-helix-io-git--master--` would become `/acapt/default/https---github-com-adobe-project-helix-io-git--35ef52a772a7656be3d31527f8e595e4e286a0d4--`. 
Each strain that is thus modified will be transformed into a temporary strain where the name includes the old strain name and the new `tag`, e.g. `default/35ef52a772a7656be3d31527f8e595e4e286a0d4`, `client/35ef52a772a7656be3d31527f8e595e4e286a0d4`, `pipeline/35ef52a772a7656be3d31527f8e595e4e286a0d4`. 
These modified strains will not be written into `.hlx/strains.json` or persisted in any other way.
Instead, the strain resolution logic in VCL will be modified so that when an `X-Strain` cookie or header is present and the value of the header contains a `/`, both the `X-Strain` (name) and `X-Tag` (tag) will be parsed. 
For the most part, the default logic of the current `X-Strain` will be applied, so that the strain's directory index, static repo, etc. will be used. The only exception is the resolution of the OpenWhisk action to execute.
Here, the `-git--([\w]+)--` pattern will be replaced with the `X-Tag` value, effectively pinning the used action to the tagged deployment. 

As this will lead to a large number of temporary actions in OpenWhisk, we also introduce a `hlx undeploy` command that clears a temporary deployment made earlier. This can be run at the end of every CI job.

`hlx test` and `hlx perf` should use the new temporary strains when running in CI.

## Discussion: layout

During the 4/2018 hackathon we also discussed the layout of the project. it was decided that:

- templates and pre functions will be in `./src`
- client side javascript **must not** go into `./src`. 
- we will provide a react example, and put the sources in `./react`
- all static files will go to `htdocs`
- all additional openwhisk actions will go to `htdocs/cgi-bin`

## Discussion: the `code` property

- the `code` property of a strain is either a giturl string or giturl object (but not an action name).

## Discussion: action names

The deployment mechanism changes so that the **sha of the code repository** at deployment time will become the package name. the action name will simply be the script name without any extensions.
 
for example: 

legacy name:
```
/helix/https---github-com-trieloff-helix-demo-git--master--html
```

new name:

```
/helix/dcfee99d45c6a2baed86c8e4921623c48b902522/html
```

The `--dirty` suffix will move to the package name.
 
for example:

```
/helix/dcfee99d45c6a2baed86c8e4921623c48b902522-dirty/html
```
