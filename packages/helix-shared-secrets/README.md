# Helix Shared - Secrets Wrapper

When writing universal serverless functions with Helix Universal, then `helix-shared-secrets` will wrap your function
to load secrets from the respective secrets provider of the cloud function provider.

Note: Currently only AWS secrets manager is supported.

By default, the secrets with the name `<package>/<function name>` (for example `/helix-services/helix-admin`) 
is loaded and added to the `context` and `process.env`, overwriting former secrets.


## Usage

```javascript
import wrap from '@adobe/helix-shared-wrap';
import secrets from '@adobe/helix-shared-secrets';

...

export const main = wrap(run)
  .with(secrets);
```
## Usage of `secrets` Wrapper with Custom `nameFunction`

The `secrets` wrapper can be customized by providing a `nameFunction` within the options. This function can dynamically determine the secrets path based on the context (`ctx`) and options (`opts`), or use a default path. Here are two example usages of the `secrets` wrapper with different types of `nameFunction`.

### Example 1: Using a Simple Custom Path

In this example, the `nameFunction` returns a hardcoded secrets path, ignoring the default path and context.

```javascript
const nameFunction = () => {
  return "/my-custom-secrets-path";
};

...

export const main = wrap(run)
  .with(secrets, { name: nameFunction });
```

In this scenario, regardless of the context or default path, the secrets path will always be `"/my-custom-secrets-path"`.

### Example 2: Extending the Default Path

Here, the `nameFunction` appends `"/ci"` to the default path. This is useful for scenarios where the path needs to be environment-specific.

```javascript
const nameFunction = (opts, ctx, defaultPath) => {
  return ctx.func.version === "ci" ? `${defaultPath}/ci` : defaultPath;
};

export const main = wrap(run)
  .with(secrets, { name: nameFunction });
```
In this case, the secrets path is dynamically constructed based on the default path, which is then extended with `"/ci"`, allowing for environment-specific configurations.
