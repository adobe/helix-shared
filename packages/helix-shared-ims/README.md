# Helix Shared - IMS

The IMS middleware provides Adobe Identity Management System (IMS) authentication for Helix Universal functions. It handles the complete OAuth2 authentication flow, including login redirects, token management, and profile retrieval, allowing you to easily protect your functions with Adobe authentication.

## Installation

```bash
npm install @adobe/helix-shared-ims
```

## Usage

Wrap your function with the IMS middleware to add authentication support:

```js
import { wrap } from '@adobe/helix-shared-wrap';
import ims from '@adobe/helix-shared-ims';

async function main(req, context) {
  if (context.ims.profile) {
    // User is authenticated
    const { name, email, userId } = context.ims.profile;
    return new Response(`Hello ${name}!`);
  }
  return new Response('Not authenticated', { status: 401 });
}

export const main = wrap(main)
  .with(ims, { clientId: 'my-client-id' });
```

## Configuration Options

The IMS middleware accepts the following configuration options:

- `clientId` (required): Your Adobe IMS client ID
- `env` (optional): IMS environment, either `'stage'` or `'prod'` (default: `'stage'`)
- `scope` (optional): OAuth scope (default: `'AdobeID,openid'`)
- `forceAuth` (optional): If `true`, returns 401 for unauthenticated requests (default: `false`)
- `host` (optional): Host name for redirects (automatically set from request headers)
- `rootPath` (optional): Root path prefix for your application (default: `''`)
- `routeLogin` (optional): Login route path (default: `'/login'`)
- `routeLoginRedirect` (optional): First redirect handler route (default: `'/login/ack'`)
- `routeLoginRedirectPrompt` (optional): Second redirect handler route (default: `'/login/ack2'`)
- `routeLogout` (optional): Logout route path (default: `'/logout'`)
- `routeLoginSuccess` (optional): Success redirect path (default: `'/'`)

### Dynamic Configuration

Configuration options can be functions that are evaluated at runtime:

```js
export const main = wrap(main)
  .with(ims, {
    clientId: (req, ctx) => ctx.env.IMS_CLIENT_ID,
    env: (req, ctx) => ctx.env.IMS_ENV || 'stage',
  });
```

## Authentication Flow

The middleware handles several routes automatically:

### 1. Login Route (`/login`)

Initiates the authentication flow by redirecting to Adobe IMS in silent mode (no prompt):

```
GET /login
→ Redirects to IMS authorization endpoint
→ After IMS authentication, redirects back to /login/ack
```

### 2. First Redirect Route (`/login/ack`)

Handles the response from the silent login attempt:
- If successful: Sets the `ims_access_token` cookie and redirects to success route
- If unsuccessful: Redirects to IMS again with prompt enabled

### 3. Second Redirect Route (`/login/ack2`)

Handles the response from the login attempt with prompt:
- If successful: Sets the `ims_access_token` cookie and redirects to success route
- If unsuccessful: Returns 401 Unauthorized

### 4. Logout Route (`/logout`)

Logs out the user by calling the IMS logout endpoint and clearing the access token cookie:

```
GET /logout
→ Calls IMS logout endpoint
→ Clears ims_access_token cookie
→ Returns 200 OK
```

## Access Token

The IMS access token can be provided in two ways:

1. Via the `ims_access_token` HTTP-only cookie (automatically set during login)
2. Via a request parameter named `ims_access_token`

## Context Properties

After wrapping your function with IMS middleware, the context object will include:

### `context.ims.config`

The resolved IMS configuration object.

### `context.ims.accessToken`

The current access token, if available.

### `context.ims.profile`

The authenticated user profile object, or `null` if not authenticated. When authenticated, contains:
- `name`: User's display name
- `email`: User's email address
- `userId`: User's unique identifier

## Enforcing Authentication

To require authentication for all requests, set `forceAuth: true`:

```js
export const main = wrap(main)
  .with(ims, {
    clientId: 'my-client-id',
    forceAuth: true,
  });
```

With this option enabled:
- Unauthenticated requests return 401 Unauthorized
- Invalid tokens return 401 Unauthorized
- Only requests with valid tokens and profiles proceed to your function

## Using Production IMS

For production deployments, configure the middleware to use the production IMS environment:

```js
export const main = wrap(main)
  .with(ims, {
    clientId: 'my-client-id',
    env: 'prod',
  });
```

## Example: Protected Admin Function

```js
import { wrap } from '@adobe/helix-shared-wrap';
import bodyData from '@adobe/helix-shared-body-data';
import ims from '@adobe/helix-shared-ims';

async function adminFunction(req, context) {
  const { ims } = context;

  // Check if user is authenticated
  if (!ims.profile) {
    return new Response('Authentication required', { status: 401 });
  }

  // Check if user has admin privileges
  if (!ims.profile.email.endsWith('@adobe.com')) {
    return new Response('Forbidden', { status: 403 });
  }

  // Perform admin operations
  return new Response(`Admin access granted to ${ims.profile.name}`);
}

export const main = wrap(adminFunction)
  .with(ims, {
    clientId: 'my-client-id',
    env: 'prod',
    forceAuth: true,
  })
  .with(bodyData);
```