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
