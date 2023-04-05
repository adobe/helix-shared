## Modules

<dl>
<dt><a href="#module_ims">ims</a></dt>
<dd><p>Wrapper function to easily perform adobe IMS authentication</p>
<p><strong>Usage:</strong></p>
<pre><code class="language-js">const wrap = require(&#39;@adobe/helix-shared-wrap&#39;);
const bodyData = require(&#39;@adobe/helix-shared-body-data&#39;);
const ims = require(&#39;@adobe/helix-shared-ims&#39;);

async main(req, context) {
  // …my action code…
  if (context.ims.profile) {
    // do authenticated stuff
  }
}

module.exports.main = wrap(main)
  .with(ims, { clientId: &#39;my-client&#39; })
  .with(bodyData)
  .with(logger);
</code></pre>
</dd>
<dt><a href="#module_wrap">wrap</a></dt>
<dd><p>Helper function to easily chain functions.</p>
<p><strong>Usage:</strong></p>
<pre><code class="language-js">const { wrap } = require(&#39;@adobe/helix-shared&#39;);

async main(params) {
  // …my action code…
}

module.exports.main = wrap(main)
  .with(epsagon)
  .with(status)
  .with(logger);
</code></pre>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#ModifiersConfig">ModifiersConfig</a></dt>
<dd><p>The modifiers class help manage the metadata and headers modifiers.</p>
</dd>
<dt><a href="#SchemaDerivedConfig">SchemaDerivedConfig</a></dt>
<dd><p>A Helix Config that is based on a (number of) JSON Schema(s).</p>
</dd>
<dt><a href="#GitUrl">GitUrl</a></dt>
<dd><p>Represents a GIT url.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#nextTick">nextTick</a> ⇒ <code>promise</code></dt>
<dd><p>Await the next tick;</p>
<p>NOTE: Internally this uses setImmediate, not process.nextTick.
This is because process.nextTick and setImmediate are horribly named
and their <a href="https://github.com/nodejs/node/blob/v6.x/doc/topics/event-loop-timers-and-nexttick.md">names should be swapped</a>.</p>
<pre><code class="language-js">const mAsyncFn = () =&gt; {
  const page1 = await request(&#39;https://example.com/1&#39;);
  await nextTick();
  const page2 = await request(&#39;https://example.com/2&#39;);
  ...
};
</code></pre>
</dd>
<dt><a href="#isNodeType">isNodeType</a></dt>
<dd><p>Check whether the given type is the type of a dom node.  Note that, in
order to support various dom implementations, this function uses a heuristic
and there might be some false positives.</p>
</dd>
<dt><a href="#assertNode">assertNode</a></dt>
<dd><p>Ensure that the given node is a domNode. Checks with isNode()</p>
</dd>
<dt><a href="#nodeName">nodeName</a></dt>
<dd><p>Determine the name of a node.
The result is always in lower case.</p>
</dd>
<dt><a href="#ancestryNodes">ancestryNodes</a> ⇒ <code>Array.&lt;DomNode&gt;</code></dt>
<dd><p>Retrieve all the parent nodes of a dom node.</p>
</dd>
<dt><a href="#equalizeNode">equalizeNode</a> ⇒ <code>DomNode</code></dt>
<dd><p>Removes comments and redundant whitespace from dom trees
and moves meaningful white space to a standardized location.</p>
<p>Adjacent text nodes are also merged, as <a href="https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize">https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize</a> does.</p>
<p>This function predominantly serves as a way to preprocess nodes
given to <code>nodeIsEquivalent</code>, so these nodes can be compared
using <code>isEqualNode</code> without insignificant whitespace changes standing
in the way of equivalence.</p>
<p><code>normalizeDomWhitespace</code> is supposed to turn equivalent dom treesturn equivalent dom trees
into equal dom trees.</p>
<h1 id="motivation">Motivation</h1>
<p>The concept of equivalence is a bit fuzzy unfortunately. Some html
minifiers like kangax&#39;s html-minifier even leave whitespace alone
by default, because what transformations are permitted is so unclear.
Going by isEqualNode, any two dom trees just differentiated by their
whitespace content are unequal.</p>
<p>This function&#39;s ultimate goal is to introduce an equivalence concept
which</p>
<ol>
<li>closely matches the mental model developers would have</li>
<li>does not affect rendering</li>
</ol>
<p>For instance, indenting dom nodes for improved readability should
usually not affect equivalence, neither should inserting newline
characters/replacing spaces with newlines because a line is growing
too long or because dom elements should be one per line.</p>
<p>Whitespace in <pre> elements however should affect equivalence.</p>
<p>The given examples also adhere to the 'do not affect rendering'
rules unless exotic javascript or CSS is added after the fact.</p>
<h1 id="precise-semantics">Precise semantics</h1>
<p>The following rules are used by this function:</p>
<ol>
<li>Whitespace in <pre> tags and contained tags is left alone.
  In more precise terms, whitespace in any elements whose computed
  <code>white-space</code> style property starts with <code>pre</code> is left alone.</li>
<li>Whitespace in other elements is compacted, meaning any combination
of whitespace characters (newlines, spaces, tabs, etc) is replaced
by a single space.</li>
<li>Any whitespace before/after closing/opening tags is removed, unless
the tag in question is inline. A tag is inline if it's computed
style property <code>display</code> starts with <code>inline</code> or is set to <code>content</code>.
This is the default behaviour for <span>.</li>
<li>Whitespace next to opening/closing tags is also collapsed; all
space between text nodes across a tree of purely inline elements are
collapsed into a single space character. The space character is placed
in the closest common ancestor, between the ancestors of both text nodes.</li>
</ol>
<p>Rule 3 and 4 are a bit verbose. Please take a look at the examples below.</p>
<p>See also:
<a href="https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace_in_the_DOM">https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace_in_the_DOM</a>
<a href="https://drafts.csswg.org/css-text-3/#propdef-white-space">https://drafts.csswg.org/css-text-3/#propdef-white-space</a></p>
<h1 id="examples">Examples</h1>
<p><code>&lt;div&gt; &lt;/div&gt;</code> -> <code>&lt;div&gt;&lt;/div&gt;</code></p>
<p>Rule 3 - div is not inline:</p>
<p><code>Hello &lt;div&gt; world &lt;/div&gt; friend</code> -> <code>Hello&lt;div&gt;world&lt;/div&gt;friend</code></p>
<p>Rule 4 - span is inline:</p>
<p><code>Hello &lt;span&gt; world &lt;/span&gt; friend</code> -> <code>Hello &lt;span&gt;world&lt;/span&gt; friend</code></p>
<p>Rule 4 – the whitespace between multiple inline elements is placed
int the lowest common ancestor.</p>
<p><code>&lt;a&gt;Hello   &lt;/a&gt; \n  &lt;a&gt;   World&lt;/a&gt;</code> -> <code>&lt;a&gt;Hello&lt;/a&gt; &lt;a&gt;World&lt;/a&gt;</code>
<code>&lt;a&gt;Hello&lt;/a&gt;&lt;a&gt;   World&lt;/a&gt;</code> -> <code>&lt;a&gt;Hello&lt;/a&gt; &lt;a&gt;World&lt;/a&gt;</code>
<code>&lt;span&gt;&lt;a&gt;Hello&lt;/a&gt;&lt;/span&gt;&lt;a&gt;   World&lt;/a&gt;</code> -> <code>&lt;span&gt;&lt;a&gt;Hello&lt;/a&gt;&lt;/span&gt; &lt;a&gt;World&lt;/a&gt;</code></p>
<h1 id="css-handling">CSS Handling</h1>
<p>Note that this function does not manually check for dom nodes like</p>
<pre> or differentiate between <span> and <div>. Instead the `display`
and `white-space` computed css properties are used to determine how
space should be compacted.

Since the computedStyle is used to determine how space compaction
should be applied, the function can deal with css affecting rendering
of white space: e.g. if `white-space` is set to `pre`, this will be
detected by this function just as if a <pre> element had been used.
The same is true for the `display` property.

The only requirement for this to work is that the CSS in question is
present in the dom tree.

So when JSDOM is used to provide the DOM, then the entire html document
should be loaded (not just fragments) and loading external stylesheets
should be enabled...</dd>
<dt><a href="#nodeIsEquivalent">nodeIsEquivalent</a> ⇒ <code>Boolean</code></dt>
<dd><p>Test whether two nodes are equivalent.</p>
<p><code>equals()</code> over two dom nodes is an alias for this.</p>
<p>Invokes equalizeNode() on both given elements before
invoking .isEqualNode.
This means the equivalence model described in <code>equalizeNode()</code>
is employed. Please refer to it&#39;s documentation to learn more</p>
</dd>
<dt><a href="#nodeMatches">nodeMatches</a> ⇒ <code>Boolean</code></dt>
<dd><p>Node equivalence testing with wildcard support.</p>
<p>This is mostly like nodeIsEquivalent, except that the
pattern may contain wildcard nodes. Wildcard nodes are nodes
with the name <code>match:any</code>.</p>
<p>Wildcards in the pattern will lazily (meaning non greedily)
match zero, one or many dom nodes in the given node to test.</p>
<p><code>&lt;match:any&gt;&lt;/match:any&gt;</code> matches anything
  ``
  <code>foo</code>
  <code>&lt;div&gt;&lt;/div&gt;</code></p>
<p><code>&lt;match:any&gt;&lt;/match:any&gt;Hello&lt;match:any&gt;&lt;/match:any&gt;</code>
  matches any node that contains <code>Hello</code> as a child:
    <code>HelloHello</code>
    <code>Foo Hello Foo</code>
    <code>&lt;div&gt;&lt;/div&gt; Foo Hello</code>
  but not this example, because here hello is in a subnode.
    <code>&lt;div&gt;Hello&lt;/div&gt;</code></p>
<p> <code>&lt;div class=&#39;xxx&#39; id=&#39;Borg&#39;&gt;&lt;matches:any&gt;&lt;/matches:any&gt;Foo&lt;/div&gt;</code>
   matches:
     <code>&lt;div class=&#39;xxx&#39; id=&#39;Borg&#39;&gt;Foo&lt;/div&gt;</code>
     <code>&lt;div class=&#39;xxx&#39; id=&#39;Borg&#39;&gt;Hello Foo&lt;/div&gt;</code>
     <code>&lt;div id=&#39;Borg&#39; class=&#39;xxx&#39;&gt;borg Foo&lt;/div&gt;</code>
   but not
     <code>Foo</code>
     <code>&lt;div id=&#39;Borg&#39; class=&#39;xxx&#39;&gt;&lt;/div&gt;</code></p>
</dd>
<dt><a href="#assertEquivalentNode">assertEquivalentNode</a></dt>
<dd><p>Assert that two dom nodes are equivalent.
The implementation mostly defers to .isEqualNode,
but provides better error messages.</p>
</dd>
<dt><a href="#dumpDOM">dumpDOM</a></dt>
<dd><p>prints dom in order for changes to be more discernible.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#getData">getData(request, [opts])</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Extracts the <em>data</em> from the given request. The data can be provided either as request
parameters, url-encoded form data body, or a json body.</p>
<p>Note that for post body requests, the body is consumed from the request and is no longer
available.</p>
</dd>
<dt><a href="#toMetaName">toMetaName(text)</a> ⇒ <code>string</code></dt>
<dd><p>Converts all non-valid characters to <code>-</code>.</p>
</dd>
<dt><a href="#stripQuery">stripQuery(m, ...specialparams)</a> ⇒ <code>object</code></dt>
<dd><p>Cleans up the URL by removing parameters that are deemed special. These
special parameters will be returned in the return object instead.</p>
</dd>
<dt><a href="#getData">getData(request, ...names)</a> ⇒ <code>object</code></dt>
<dd><p>Exported only for testisg</p>
</dd>
<dt><a href="#match">match(globs, path, defaultValue)</a> ⇒ <code>boolean</code></dt>
<dd><p>Return a flag indicating whether a particular path is matches all given glob patterns.</p>
</dd>
<dt><a href="#contains">contains(cfg, path)</a> ⇒ <code>boolean</code></dt>
<dd><p>Return a flag indicating whether a particular path is contained
in the indexing configuration (include or exclude element). This
is true if a path is included and <em>not</em> excluded.</p>
</dd>
<dt><a href="#getDOMValue">getDOMValue(elements, expression, log, vars)</a></dt>
<dd><p>Return a value in the DOM by evaluating an expression</p>
</dd>
<dt><a href="#indexResource">indexResource(path, response, config, log)</a> ⇒ <code>object</code></dt>
<dd><p>Given a response, extract a value and evaluate an expression
on it. The index contains the CSS selector that will select the
value(s) to process. If we get multiple values, we return an
array.</p>
</dd>
<dt><a href="#dequeue">dequeue(queue)</a> ⇒ <code>Generator.&lt;*, void, *&gt;</code></dt>
<dd><p>Simple dequeing iterator.</p>
</dd>
<dt><a href="#_request">_request(target, input)</a> ⇒ <code>any</code></dt>
<dd><p>Pass a request to the AWS secrets manager</p>
</dd>
<dt><a href="#reset">reset()</a></dt>
<dd><p>reset the cache - for testing only</p>
</dd>
<dt><a href="#loadSecrets">loadSecrets(ctx, [opts])</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Loads the secrets from the respective secrets manager.</p>
</dd>
<dt><a href="#multiline">multiline()</a></dt>
<dd><p>This is a helper for declaring multiline strings.</p>
<pre><code>const s = multiline(`
    Foo
    Bar
    Baz

       Hello

    Bang
`);
</code></pre>
<p>The function basically just takes a string and then
strips the first &amp; last lines if they are empty.</p>
<p>In order to remove indentation, we determine the common
whitespace prefix length (number of space 0x20 characters
at the start of the line). This prefix is simply removed
from each line...</p>
</dd>
<dt><a href="#lookupBackendResponses">lookupBackendResponses(status)</a> ⇒ <code>Object</code></dt>
<dd><p>A glorified lookup table that translates backend errors into the appropriate
HTTP status codes and log levels for your service.</p>
</dd>
<dt><a href="#computeSurrogateKey">computeSurrogateKey(url)</a> ⇒ <code>Promise.&lt;string&gt;</code></dt>
<dd><p>Computes the caching Surrogate-Key for the given url. The computation uses a hmac_sha256
with a fixed key: {@code &quot;helix&quot;}. the result is base64 encoded and truncated to 16 characters.
This algorithm is chosen, because similar functionality exists in Fastly&#39;s VCL api:</p>
<pre><code>declare local var.key STRING;
set var.key = digest.hmac_sha256_base64(&quot;helix&quot;, &quot;input&quot;);
set var.key = regsub(var.key, &quot;(.{16}).*&quot;, &quot;\1&quot;);
</code></pre>
</dd>
<dt><a href="#propagateStatusCode">propagateStatusCode(status)</a> ⇒ <code>int</code></dt>
<dd><p>What is the appropriate status code to use in your service when your backend
responds with <code>status</code>? This function provides a standardized lookup function
to map backend responses to gateway responses, assuming you are implementing
the gateway.</p>
</dd>
<dt><a href="#logLevelForStatusCode">logLevelForStatusCode(status)</a> ⇒ <code>string</code></dt>
<dd><p>What is the appropriate log level for logging HTTP responses you are getting
from a backend when the backend responds with <code>status</code>? This function provides
a standardized lookup function of backend status codes to log levels.</p>
<p>You can use it like this:</p>
<pre><code class="language-javascript">logger[logLevelForStatusCode(response.status)](response.message);
</code></pre>
</dd>
<dt><a href="#cleanupHeaderValue">cleanupHeaderValue(value)</a> ⇒</dt>
<dd><p>Cleans up a header value by stripping invalid characters and truncating to 1024 chars</p>
</dd>
<dt><a href="#hashContentBusId">hashContentBusId(value)</a> ⇒</dt>
<dd><p>Compute an SHA digest from some string value.</p>
</dd>
</dl>

<a name="module_ims"></a>

## ims
Wrapper function to easily perform adobe IMS authentication

**Usage:**

```js
const wrap = require('@adobe/helix-shared-wrap');
const bodyData = require('@adobe/helix-shared-body-data');
const ims = require('@adobe/helix-shared-ims');

async main(req, context) {
  // …my action code…
  if (context.ims.profile) {
    // do authenticated stuff
  }
}

module.exports.main = wrap(main)
  .with(ims, { clientId: 'my-client' })
  .with(bodyData)
  .with(logger);
```


* [ims](#module_ims)
    * [module.exports(func, [options])](#exp_module_ims--module.exports) ⇒ <code>UniversalFunction</code> ⏏
        * [~redirectToLogin(ctx, noPrompt)](#module_ims--module.exports..redirectToLogin) ⇒ <code>Response</code>
        * [~fetchProfile(ctx)](#module_ims--module.exports..fetchProfile) ⇒ <code>Promise.&lt;(IMSProfile\|null)&gt;</code>
        * [~logout(ctx)](#module_ims--module.exports..logout) ⇒ <code>Promise.&lt;Response&gt;</code>

<a name="exp_module_ims--module.exports"></a>

### module.exports(func, [options]) ⇒ <code>UniversalFunction</code> ⏏
Wraps a function with an ims authorization middle ware. If the request is authenticated, the
`context.ims` will contain a `profile` object, representing the authenticated user profile.

The wrapper claims several routes:

The `IMSConfig.routeLogin` (default '/login') is used
to respond with a redirect to the IMS login page in 'no-prompt' mode. i.e. the IMS page will
not provide username/password fields to login the user, but tries instead to silently login.
After authentication the IMS login page redirects back to `IMSConfig.routeLoginRedirect`.

The `IMSConfig.routeLoginRedirect` (default '/login/ack') route handles the response from the
first, silent login attempt. The the login was successful, it will respond with a redirect to
the root `/`.
if not successful, it will respond with a redirect again to the IMS login page in
normal mode, i.e. where the IMS page provides means to login. After login, the IMS login
page redirects back to `IMSConfig.routeLoginRedirectPrompt`.

The `IMSConfig.routeLoginRedirectPrompt` (default '/login/ack2') route handles the response from
the second login attempt.
The login was successful, it will respond with a redirect to the root `/`,
otherwise the request remains unauthenticated.

After a successful login, a `ims_access_token` cookie is set on the response, which is
then used for subsequent requests.

The `IMSConfig.routeLogout` (default '/logout') is used to logout the user. It sends a
request to the IMS logout endpoint and subsequently clears the `ims_access_token` cookie.
The response is always be a 200.

The IMS access token can either be provided via the `ims_access_token` cookie, or a
request parameter with the same name.

**Kind**: Exported function  
**Returns**: <code>UniversalFunction</code> - an universal function with the added middleware.  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>UniversalFunction</code> | the universal function |
| [options] | <code>IMSConfig</code> | Options |

<a name="module_ims--module.exports..redirectToLogin"></a>

#### module.exports~redirectToLogin(ctx, noPrompt) ⇒ <code>Response</code>
Calculates the login redirect response

**Kind**: inner method of [<code>module.exports</code>](#exp_module_ims--module.exports)  
**Returns**: <code>Response</code> - redirect response  

| Param | Type | Description |
| --- | --- | --- |
| ctx | <code>UniversalContextWithIMS</code> | universal context |
| noPrompt | <code>boolean</code> | flag indicating if the login should be silent |

<a name="module_ims--module.exports..fetchProfile"></a>

#### module.exports~fetchProfile(ctx) ⇒ <code>Promise.&lt;(IMSProfile\|null)&gt;</code>
Fetches the ims profile

**Kind**: inner method of [<code>module.exports</code>](#exp_module_ims--module.exports)  

| Param | Type | Description |
| --- | --- | --- |
| ctx | <code>UniversalContextWithIMS</code> | the context of the universal serverless function |

<a name="module_ims--module.exports..logout"></a>

#### module.exports~logout(ctx) ⇒ <code>Promise.&lt;Response&gt;</code>
Sends the logout request to IMS and clears the access token cookie.

**Kind**: inner method of [<code>module.exports</code>](#exp_module_ims--module.exports)  

| Param | Type | Description |
| --- | --- | --- |
| ctx | <code>UniversalContextWithIMS</code> | the context of the universal serverless function |

<a name="module_wrap"></a>

## wrap
Helper function to easily chain functions.

**Usage:**

```js
const { wrap } = require('@adobe/helix-shared');

async main(params) {
  // …my action code…
}

module.exports.main = wrap(main)
  .with(epsagon)
  .with(status)
  .with(logger);
```

<a name="exp_module_wrap--module.exports"></a>

### module.exports(fn) ⇒ <code>WrappableFunction</code> ⏏
A function that makes your function (i.e. `main`) wrappable,
so that using `with` a number of wrappers can be applied. This allows
you to export the result as a new function.

Usage:

```js
async main(req, context) {
  //…my action code…
}

module.exports.main = wrap(main)
.with(epsagon)
.with(status)
.with(logger);
```
Note: the execution order is that the last wrapper added will be executed first.

**Kind**: Exported function  
**Returns**: <code>WrappableFunction</code> - the same main function, now including a `with` method  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | the function to prepare for wrapping |

<a name="nextTick"></a>

## nextTick ⇒ <code>promise</code>
Await the next tick;

NOTE: Internally this uses setImmediate, not process.nextTick.
This is because process.nextTick and setImmediate are horribly named
and their [names should be swapped](https://github.com/nodejs/node/blob/v6.x/doc/topics/event-loop-timers-and-nexttick.md).



```js
const mAsyncFn = () => {
  const page1 = await request('https://example.com/1');
  await nextTick();
  const page2 = await request('https://example.com/2');
  ...
};
```

**Kind**: global constant  
**Returns**: <code>promise</code> - A promise that will resolve during the next tick.  
<a name="isNodeType"></a>

## isNodeType
Check whether the given type is the type of a dom node.  Note that, in
order to support various dom implementations, this function uses a heuristic
and there might be some false positives.

**Kind**: global constant  
<a name="assertNode"></a>

## assertNode
Ensure that the given node is a domNode. Checks with isNode()

**Kind**: global constant  
<a name="nodeName"></a>

## nodeName
Determine the name of a node.
The result is always in lower case.

**Kind**: global constant  
<a name="ancestryNodes"></a>

## ancestryNodes ⇒ <code>Array.&lt;DomNode&gt;</code>
Retrieve all the parent nodes of a dom node.

**Kind**: global constant  
**Returns**: <code>Array.&lt;DomNode&gt;</code> - All the ancestor dom nodes to the given
  dom node, starting with the most distant dom node.  

| Param | Type |
| --- | --- |
| node | <code>DomNode</code> | 

<a name="equalizeNode"></a>

## equalizeNode ⇒ <code>DomNode</code>
Removes comments and redundant whitespace from dom trees
and moves meaningful white space to a standardized location.

Adjacent text nodes are also merged, as https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize does.

This function predominantly serves as a way to preprocess nodes
given to `nodeIsEquivalent`, so these nodes can be compared
using `isEqualNode` without insignificant whitespace changes standing
in the way of equivalence.

`normalizeDomWhitespace` is supposed to turn equivalent dom treesturn equivalent dom trees
into equal dom trees.

# Motivation

The concept of equivalence is a bit fuzzy unfortunately. Some html
minifiers like kangax's html-minifier even leave whitespace alone
by default, because what transformations are permitted is so unclear.
Going by isEqualNode, any two dom trees just differentiated by their
whitespace content are unequal.

This function's ultimate goal is to introduce an equivalence concept
which

1) closely matches the mental model developers would have
2) does not affect rendering

For instance, indenting dom nodes for improved readability should
usually not affect equivalence, neither should inserting newline
characters/replacing spaces with newlines because a line is growing
too long or because dom elements should be one per line.

Whitespace in <pre> elements however should affect equivalence.

The given examples also adhere to the 'do not affect rendering'
rules unless exotic javascript or CSS is added after the fact.

# Precise semantics

The following rules are used by this function:

1) Whitespace in <pre> tags and contained tags is left alone.
  In more precise terms, whitespace in any elements whose computed
  `white-space` style property starts with `pre` is left alone.
2) Whitespace in other elements is compacted, meaning any combination
   of whitespace characters (newlines, spaces, tabs, etc) is replaced
   by a single space.
3) Any whitespace before/after closing/opening tags is removed, unless
   the tag in question is inline. A tag is inline if it's computed
   style property `display` starts with `inline` or is set to `content`.
   This is the default behaviour for <span>.
4) Whitespace next to opening/closing tags is also collapsed; all
   space between text nodes across a tree of purely inline elements are
   collapsed into a single space character. The space character is placed
   in the closest common ancestor, between the ancestors of both text nodes.

Rule 3 and 4 are a bit verbose. Please take a look at the examples below.

See also:
https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace_in_the_DOM
https://drafts.csswg.org/css-text-3/#propdef-white-space

# Examples

` <div> </div> ` -> `<div></div>`

Rule 3 - div is not inline:

` Hello <div> world </div> friend ` -> `Hello<div>world</div>friend`

Rule 4 - span is inline:

` Hello <span> world </span> friend ` -> `Hello <span>world</span> friend`

Rule 4 – the whitespace between multiple inline elements is placed
int the lowest common ancestor.

`<a>Hello   </a> \n  <a>   World</a>` -> `<a>Hello</a> <a>World</a>`
`<a>Hello</a><a>   World</a>` -> `<a>Hello</a> <a>World</a>`
`<span><a>Hello</a></span><a>   World</a>` -> `<span><a>Hello</a></span> <a>World</a>`

# CSS Handling

Note that this function does not manually check for dom nodes like
<pre> or differentiate between <span> and <div>. Instead the `display`
and `white-space` computed css properties are used to determine how
space should be compacted.

Since the computedStyle is used to determine how space compaction
should be applied, the function can deal with css affecting rendering
of white space: e.g. if `white-space` is set to `pre`, this will be
detected by this function just as if a <pre> element had been used.
The same is true for the `display` property.

The only requirement for this to work is that the CSS in question is
present in the dom tree.

So when JSDOM is used to provide the DOM, then the entire html document
should be loaded (not just fragments) and loading external stylesheets
should be enabled...

**Kind**: global constant  
**Returns**: <code>DomNode</code> - The node parameter; the node parameter was mutated by this
  function; a reference to it is returned in order to facilitate function chaining.  

| Param | Type | Description |
| --- | --- | --- |
| node | <code>DomNode</code> | The node to equalize; this value will be mutated! |

<a name="nodeIsEquivalent"></a>

## nodeIsEquivalent ⇒ <code>Boolean</code>
Test whether two nodes are equivalent.

`equals()` over two dom nodes is an alias for this.

Invokes equalizeNode() on both given elements before
invoking .isEqualNode.
This means the equivalence model described in `equalizeNode()`
is employed. Please refer to it's documentation to learn more

**Kind**: global constant  

| Param | Type |
| --- | --- |
| a | <code>DomNode</code> | 
| b | <code>DomNode</code> | 

<a name="nodeMatches"></a>

## nodeMatches ⇒ <code>Boolean</code>
Node equivalence testing with wildcard support.

This is mostly like nodeIsEquivalent, except that the
pattern may contain wildcard nodes. Wildcard nodes are nodes
with the name `match:any`.

Wildcards in the pattern will lazily (meaning non greedily)
match zero, one or many dom nodes in the given node to test.

`<match:any></match:any>` matches anything
  ``
  `foo`
  `<div></div>`

`<match:any></match:any>Hello<match:any></match:any>`
  matches any node that contains `Hello` as a child:
    `HelloHello`
    `Foo Hello Foo`
    `<div></div> Foo Hello`
  but not this example, because here hello is in a subnode.
    `<div>Hello</div>`

 `<div class='xxx' id='Borg'><matches:any></matches:any>Foo</div>`
   matches:
     `<div class='xxx' id='Borg'>Foo</div>`
     `<div class='xxx' id='Borg'>Hello Foo</div>`
     `<div id='Borg' class='xxx'>borg Foo</div>`
   but not
     `Foo`
     `<div id='Borg' class='xxx'></div>`

**Kind**: global constant  

| Param | Type |
| --- | --- |
| node | <code>DomNode</code> | 
| pattern | <code>DomNode</code> | 

<a name="assertEquivalentNode"></a>

## assertEquivalentNode
Assert that two dom nodes are equivalent.
The implementation mostly defers to .isEqualNode,
but provides better error messages.

**Kind**: global constant  
<a name="dumpDOM"></a>

## dumpDOM
prints dom in order for changes to be more discernible.

**Kind**: global constant  

| Param | Type | Description |
| --- | --- | --- |
| actual | <code>object</code> | node from original page |
| expected | <code>object</code> | node from test domain page |
| level | <code>number</code> | current level in recursion tree return dump of dom that is indented at every level by level*2 spaces |

<a name="getData"></a>

## getData(request, [opts]) ⇒ <code>Promise.&lt;object&gt;</code>
Extracts the _data_ from the given request. The data can be provided either as request
parameters, url-encoded form data body, or a json body.

Note that for post body requests, the body is consumed from the request and is no longer
available.

**Kind**: global function  
**Returns**: <code>Promise.&lt;object&gt;</code> - the parsed data object.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Request</code> | The universal request |
| [opts] | <code>BodyDataOptions</code> | Options |

<a name="toMetaName"></a>

## toMetaName(text) ⇒ <code>string</code>
Converts all non-valid characters to `-`.

**Kind**: global function  
**Returns**: <code>string</code> - the meta name  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | input text |

<a name="stripQuery"></a>

## stripQuery(m, ...specialparams) ⇒ <code>object</code>
Cleans up the URL by removing parameters that are deemed special. These
special parameters will be returned in the return object instead.

**Kind**: global function  
**Returns**: <code>object</code> - an object with a clean URL and extracted parameters  

| Param | Type | Description |
| --- | --- | --- |
| m | <code>object</code> | the mount point |
| m.url | <code>string</code> | mount point URL |
| ...specialparams | <code>string</code> | list of special parameters that should be removed from the URL and returned in the object |

<a name="getData"></a>

## getData(request, ...names) ⇒ <code>object</code>
Exported only for testisg

**Kind**: global function  
**Returns**: <code>object</code> - an object with the provided parameter names as keys  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Request</code> | a fetch-API Request |
| ...names | <code>string</code> | the parameter names to extract |

<a name="match"></a>

## match(globs, path, defaultValue) ⇒ <code>boolean</code>
Return a flag indicating whether a particular path is matches all given glob patterns.

**Kind**: global function  
**Returns**: <code>boolean</code> - whether path matches the globs  

| Param | Type | Description |
| --- | --- | --- |
| globs | <code>Array.&lt;string&gt;</code> | globbing patterns |
| path | <code>string</code> | path to check |
| defaultValue | <code>boolean</code> | what to return if `globs` is undefined |

<a name="contains"></a>

## contains(cfg, path) ⇒ <code>boolean</code>
Return a flag indicating whether a particular path is contained
in the indexing configuration (include or exclude element). This
is true if a path is included and *not* excluded.

**Kind**: global function  
**Returns**: <code>boolean</code> - whether path is included in configuration  

| Param | Type | Description |
| --- | --- | --- |
| cfg | <code>Index</code> | indexing configuration's |
| path | <code>string</code> | path to check |

<a name="getDOMValue"></a>

## getDOMValue(elements, expression, log, vars)
Return a value in the DOM by evaluating an expression

**Kind**: global function  

| Param | Type |
| --- | --- |
| elements | <code>Array.&lt;HTMLElement&gt;</code> | 
| expression | <code>string</code> | 
| log | <code>Logger</code> | 
| vars | <code>object</code> | 

<a name="indexResource"></a>

## indexResource(path, response, config, log) ⇒ <code>object</code>
Given a response, extract a value and evaluate an expression
on it. The index contains the CSS selector that will select the
value(s) to process. If we get multiple values, we return an
array.

**Kind**: global function  
**Returns**: <code>object</code> - extracted properties  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | Path of document retrieved |
| response | <code>object</code> | response containing body and headers |
| config | <code>Index</code> | indexing configuration |
| log | <code>Logger</code> | logger |

<a name="dequeue"></a>

## dequeue(queue) ⇒ <code>Generator.&lt;\*, void, \*&gt;</code>
Simple dequeing iterator.

**Kind**: global function  

| Param |
| --- |
| queue | 

<a name="_request"></a>

## \_request(target, input) ⇒ <code>any</code>
Pass a request to the AWS secrets manager

**Kind**: global function  
**Returns**: <code>any</code> - response object  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>string</code> | target method to invoke |
| input | <code>any</code> | input that will be passed as JSON |

<a name="reset"></a>

## reset()
reset the cache - for testing only

**Kind**: global function  
<a name="loadSecrets"></a>

## loadSecrets(ctx, [opts]) ⇒ <code>Promise.&lt;object&gt;</code>
Loads the secrets from the respective secrets manager.

**Kind**: global function  
**Returns**: <code>Promise.&lt;object&gt;</code> - the secrets or {@code null}.  

| Param | Type | Description |
| --- | --- | --- |
| ctx | <code>UniversalContext</code> | the context |
| [opts] | <code>SecretsOptions</code> | Options |

<a name="multiline"></a>

## multiline()
This is a helper for declaring multiline strings.

```
const s = multiline(`
    Foo
    Bar
    Baz

       Hello

    Bang
`);
```

The function basically just takes a string and then
strips the first & last lines if they are empty.

In order to remove indentation, we determine the common
whitespace prefix length (number of space 0x20 characters
at the start of the line). This prefix is simply removed
from each line...

**Kind**: global function  
<a name="lookupBackendResponses"></a>

## lookupBackendResponses(status) ⇒ <code>Object</code>
A glorified lookup table that translates backend errors into the appropriate
HTTP status codes and log levels for your service.

**Kind**: global function  
**Returns**: <code>Object</code> - a pair of status code to return and log level to use in your code  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>int</code> | the HTTP status code you've been getting from the backend |

<a name="computeSurrogateKey"></a>

## computeSurrogateKey(url) ⇒ <code>Promise.&lt;string&gt;</code>
Computes the caching Surrogate-Key for the given url. The computation uses a hmac_sha256
with a fixed key: {@code "helix"}. the result is base64 encoded and truncated to 16 characters.
This algorithm is chosen, because similar functionality exists in Fastly's VCL api:

```
declare local var.key STRING;
set var.key = digest.hmac_sha256_base64("helix", "input");
set var.key = regsub(var.key, "(.{16}).*", "\1");
```

**Kind**: global function  
**Returns**: <code>Promise.&lt;string&gt;</code> - A promise with the computed key.  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>\*</code> | The input url. |

<a name="propagateStatusCode"></a>

## propagateStatusCode(status) ⇒ <code>int</code>
What is the appropriate status code to use in your service when your backend
responds with `status`? This function provides a standardized lookup function
to map backend responses to gateway responses, assuming you are implementing
the gateway.

**Kind**: global function  
**Returns**: <code>int</code> - the appropriate HTTP status code for your app  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>int</code> | the backend HTTP status code |

<a name="logLevelForStatusCode"></a>

## logLevelForStatusCode(status) ⇒ <code>string</code>
What is the appropriate log level for logging HTTP responses you are getting
from a backend when the backend responds with `status`? This function provides
a standardized lookup function of backend status codes to log levels.

You can use it like this:

```javascript
logger[logLevelForStatusCode(response.status)](response.message);
```

**Kind**: global function  
**Returns**: <code>string</code> - the correct log level  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>int</code> | the HTTP status code from your backend |

<a name="cleanupHeaderValue"></a>

## cleanupHeaderValue(value) ⇒
Cleans up a header value by stripping invalid characters and truncating to 1024 chars

**Kind**: global function  
**Returns**: a valid header value  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | a header value |

<a name="hashContentBusId"></a>

## hashContentBusId(value) ⇒
Compute an SHA digest from some string value.

**Kind**: global function  
**Returns**: SHA256 digest of value, shortened to 59 characters  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | value to create digest for |

