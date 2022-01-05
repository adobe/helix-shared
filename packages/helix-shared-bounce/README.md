# Helix Shared - bounce

 The bounce middleware can be used to get fast pro-forma responses from a slow running function.
 To use it, wrap the slower function with the bounce middleware and provide a faster `responder`
 function. Upon first invocation, both the fast responder and the slow function will be invoked,
 and the faster of the two responses returned. As the invocation of the slow function happens via
 a fetch request, it won't be aborted, even when the fast responder returns.
 
 ```js
 const { wrap, bounce } = require('@adobe/helix-shared');
 const { Response } = require('@adobe/helix-fetch')
 
 async function fast(req, context) {
   return new Response(`I am working on it. Use ${context.invocation.bounceId} to track the status.`);
 }
 
 async function main(req, context) {
   // do something slow
 }
 
 module.exports.main = wrap(main)
   .with(bounce, { responder: fast });
 ```

## Disabling Bouncing for Tests

If you are testing a function that is using `bounce` locally, you might want to disable the bouncing for the duration of the test, because you would otherwise have
to mock a larger part of the runtime.

To disable bouncing for tests, set the `HELIX_DEBOUNCE` environment variable to any value.