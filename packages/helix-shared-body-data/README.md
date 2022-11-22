# Helix Shared - Body Data Wrapper

When writing universal serverless functions with Helix Universal, then `helix-shared-body-data` will wrap your function to parse the
request and put body data from form or JSON POSTs or PUTs into `context.data`

## Usage

```javascript
import wrap from '@adobe/helix-shared-wrap';
import bodyData from '@adobe/helix-shared-body-data';

…

export const main = wrap(run)
  .with(bodyData);
```
