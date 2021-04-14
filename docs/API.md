## Modules

<dl>
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
<dt><a href="#BaseConfig">BaseConfig</a></dt>
<dd></dd>
<dt><a href="#PropertyCondition">PropertyCondition</a></dt>
<dd><p>PropertyCondition</p>
</dd>
<dt><a href="#URLCondition">URLCondition</a></dt>
<dd><p>URLCondition</p>
</dd>
<dt><a href="#StringCondition">StringCondition</a></dt>
<dd><p>StringCondition class</p>
</dd>
<dt><a href="#Condition">Condition</a></dt>
<dd><p>Condition class</p>
</dd>
<dt><a href="#GitUrl">GitUrl</a></dt>
<dd><p>Represents a GIT url.</p>
</dd>
<dt><a href="#Performance">Performance</a></dt>
<dd><p>Performance Definition</p>
</dd>
<dt><a href="#Redirect">Redirect</a></dt>
<dd><p>Defines a redirect rule</p>
</dd>
<dt><a href="#SchemaDerivedConfig">SchemaDerivedConfig</a></dt>
<dd><p>A Helix Config that is based on a (number of) JSON Schema(s).</p>
</dd>
<dt><a href="#Static">Static</a></dt>
<dd><p>Static content handling</p>
</dd>
<dt><a href="#Strain">Strain</a></dt>
<dd><p>Strain</p>
</dd>
<dt><a href="#Strains">Strains</a></dt>
<dd><p>Strains</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#configMapper">configMapper</a></dt>
<dd><p>Determines how to transform children configuration based on the affix type.</p>
</dd>
<dt><a href="#vclComposer">vclComposer</a></dt>
<dd><p>Determines how to compose VCL based on the affix type.</p>
</dd>
<dt><a href="#jsonGenarator">jsonGenarator</a></dt>
<dd><p>Determines how to output JSON based on the affix type.</p>
</dd>
<dt><a href="#booleanMap">booleanMap</a></dt>
<dd><p>Boolean conditions</p>
</dd>
<dt><a href="#propertyMap">propertyMap</a></dt>
<dd><p>Known properties</p>
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
</dl>

## Functions

<dl>
<dt><a href="#ResolveFn">ResolveFn(left, right)</a></dt>
<dd></dd>
<dt><a href="#stripQuery">stripQuery(m, ...specialparams)</a> ⇒ <code>object</code></dt>
<dd><p>Cleans up the URL by removing parameters that are deemed special. These
special parameters will be returned in the return object instead.</p>
</dd>
<dt><a href="#nextTick">nextTick()</a> ⇒ <code>promise</code></dt>
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
<dt><a href="#isNodeType">isNodeType()</a></dt>
<dd><p>Check whether the given type is the type of a dom node.  Note that, in
order to support various dom implementations, this function uses a heuristic
and there might be some false positives.</p>
</dd>
<dt><a href="#assertNode">assertNode()</a></dt>
<dd><p>Ensure that the given node is a domNode. Checks with isNode()</p>
</dd>
<dt><a href="#nodeName">nodeName()</a></dt>
<dd><p>Determine the name of a node.
The result is always in lower case.</p>
</dd>
<dt><a href="#ancestryNodes">ancestryNodes(node)</a> ⇒ <code>Array.&lt;DomNode&gt;</code></dt>
<dd><p>Retrieve all the parent nodes of a dom node.</p>
</dd>
<dt><a href="#equalizeNode">equalizeNode(node)</a> ⇒ <code>DomNode</code></dt>
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
<p>The given examples also adhere to the &#39;do not affect rendering&#39;
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
the tag in question is inline. A tag is inline if it&#39;s computed
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
<p><code>&lt;div&gt; &lt;/div&gt;</code> -&gt; <code>&lt;div&gt;&lt;/div&gt;</code></p>
<p>Rule 3 - div is not inline:</p>
<p><code>Hello &lt;div&gt; world &lt;/div&gt; friend</code> -&gt; <code>Hello&lt;div&gt;world&lt;/div&gt;friend</code></p>
<p>Rule 4 - span is inline:</p>
<p><code>Hello &lt;span&gt; world &lt;/span&gt; friend</code> -&gt; <code>Hello &lt;span&gt;world&lt;/span&gt; friend</code></p>
<p>Rule 4 – the whitespace between multiple inline elements is placed
int the lowest common ancestor.</p>
<p><code>&lt;a&gt;Hello   &lt;/a&gt; \n  &lt;a&gt;   World&lt;/a&gt;</code> -&gt; <code>&lt;a&gt;Hello&lt;/a&gt; &lt;a&gt;World&lt;/a&gt;</code>
<code>&lt;a&gt;Hello&lt;/a&gt;&lt;a&gt;   World&lt;/a&gt;</code> -&gt; <code>&lt;a&gt;Hello&lt;/a&gt; &lt;a&gt;World&lt;/a&gt;</code>
<code>&lt;span&gt;&lt;a&gt;Hello&lt;/a&gt;&lt;/span&gt;&lt;a&gt;   World&lt;/a&gt;</code> -&gt; <code>&lt;span&gt;&lt;a&gt;Hello&lt;/a&gt;&lt;/span&gt; &lt;a&gt;World&lt;/a&gt;</code></p>
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
<dt><a href="#nodeIsEquivalent">nodeIsEquivalent(a, b)</a> ⇒ <code>Boolean</code></dt>
<dd><p>Test whether two nodes are equivalent.</p>
<p><code>equals()</code> over two dom nodes is an alias for this.</p>
<p>Invokes equalizeNode() on both given elements before
invoking .isEqualNode.
This means the equivalence model described in <code>equalizeNode()</code>
is employed. Please refer to it&#39;s documentation to learn more</p>
</dd>
<dt><a href="#assertEquivalentNode">assertEquivalentNode()</a></dt>
<dd><p>Assert that two dom nodes are equivalent.
The implementation mostly defers to .isEqualNode,
but provides better error messages.</p>
</dd>
<dt><a href="#dumpDOM">dumpDOM(actual, expected, level)</a></dt>
<dd><p>prints dom in order for changes to be more discernible.</p>
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
</dl>

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

<a name="module_wrap..wrap"></a>

### wrap~wrap(fn) ⇒ <code>WrappableFunction</code>
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

**Kind**: inner method of [<code>wrap</code>](#module_wrap)  
**Returns**: <code>WrappableFunction</code> - the same main function, now including a `with` method  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | the function to prepare for wrapping |

<a name="BaseConfig"></a>

## BaseConfig
**Kind**: global class  

* [BaseConfig](#BaseConfig)
    * [new BaseConfig(name)](#new_BaseConfig_new)
    * [.withCache(options)](#BaseConfig+withCache)
    * [.withRepo(owner, repo, ref, options)](#BaseConfig+withRepo)
    * [.withRepoURL(url, options)](#BaseConfig+withRepoURL)
    * [.saveConfig()](#BaseConfig+saveConfig) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_BaseConfig_new"></a>

### new BaseConfig(name)

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the config file, e.g. `helix-config.yaml` |

<a name="BaseConfig+withCache"></a>

### baseConfig.withCache(options)
Reset the cache with a new cache size

**Kind**: instance method of [<code>BaseConfig</code>](#BaseConfig)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | cache options |
| options.maxSize | <code>number</code> |  |

<a name="BaseConfig+withRepo"></a>

### baseConfig.withRepo(owner, repo, ref, options)
Set the base repository to fetch a config from

**Kind**: instance method of [<code>BaseConfig</code>](#BaseConfig)  

| Param | Type | Description |
| --- | --- | --- |
| owner | <code>string</code> | username or org |
| repo | <code>string</code> | repository |
| ref | <code>string</code> | ref name |
| options | <code>object</code> | options |
| options.headers | <code>object</code> | headers to be used for HTTP request |
| options.headers.authorization | <code>string</code> | authorization token to include |

<a name="BaseConfig+withRepoURL"></a>

### baseConfig.withRepoURL(url, options)
Set the base repository to fetch the config from.

**Kind**: instance method of [<code>BaseConfig</code>](#BaseConfig)  

| Param | Type | Description |
| --- | --- | --- |
| url | [<code>GitUrl</code>](#GitUrl) | The git url of the repository |
| options | <code>object</code> | options |
| options.headers | <code>object</code> | headers to be used for HTTP request |
| options.headers.authorization | <code>string</code> | authorization token to include |

<a name="BaseConfig+saveConfig"></a>

### baseConfig.saveConfig() ⇒ <code>Promise.&lt;void&gt;</code>
Saves this config to [#configPath](#configPath)

**Kind**: instance method of [<code>BaseConfig</code>](#BaseConfig)  
<a name="PropertyCondition"></a>

## PropertyCondition
PropertyCondition

**Kind**: global class  
<a name="PropertyCondition+toVCLPath"></a>

### propertyCondition.toVCLPath(param)
Return a VCL conditional clause that will assign the calculated base path
to a request parameter.

**Kind**: instance method of [<code>PropertyCondition</code>](#PropertyCondition)  

| Param | Type | Description |
| --- | --- | --- |
| param | <code>String</code> \| <code>function</code> | request parameter name to insert or function to invoke |

<a name="URLCondition"></a>

## URLCondition
URLCondition

**Kind**: global class  
<a name="StringCondition"></a>

## StringCondition
StringCondition class

**Kind**: global class  
<a name="Condition"></a>

## Condition
Condition class

**Kind**: global class  
<a name="Condition+preflightHeaders"></a>

### condition.preflightHeaders ⇒
Gets a list of all preflight headers used in this condition

**Kind**: instance property of [<code>Condition</code>](#Condition)  
**Returns**: String[]  
<a name="GitUrl"></a>

## GitUrl
Represents a GIT url.

**Kind**: global class  

* [GitUrl](#GitUrl)
    * [new GitUrl(url, defaults)](#new_GitUrl_new)
    * _instance_
        * [.raw](#GitUrl+raw) : <code>String</code>
        * [.rawRoot](#GitUrl+rawRoot) : <code>String</code>
        * [.apiRoot](#GitUrl+apiRoot) : <code>String</code>
        * [.protocol](#GitUrl+protocol) : <code>String</code>
        * [.hostname](#GitUrl+hostname) : <code>String</code>
        * [.host](#GitUrl+host) : <code>String</code>
        * [.port](#GitUrl+port) : <code>String</code>
        * [.owner](#GitUrl+owner) : <code>String</code>
        * [.repo](#GitUrl+repo) : <code>String</code>
        * [.ref](#GitUrl+ref) : <code>String</code>
        * [.path](#GitUrl+path) : <code>String</code>
        * [.isLocal](#GitUrl+isLocal) ⇒ <code>boolean</code>
        * [.equalsIgnoreTransport(other)](#GitUrl+equalsIgnoreTransport) ⇒ <code>boolean</code>
        * [.toString()](#GitUrl+toString) ⇒ <code>String</code>
        * [.toJSON()](#GitUrl+toJSON) ⇒ [<code>JSON</code>](#GitUrl..JSON) \| <code>String</code>
    * _inner_
        * [~JSON](#GitUrl..JSON) : <code>Object</code>

<a name="new_GitUrl_new"></a>

### new GitUrl(url, defaults)
Creates a new GitUrl either from a String URL or from a serialized object. The string must be
of the format "<scheme>://<hostname>[:<port>]/<owner>/<repo>.git[/<path>][#ref>]".

see https://www.git-scm.com/docs/git-clone#_git_urls_a_id_urls_a


| Param | Type | Description |
| --- | --- | --- |
| url | <code>String</code> \| [<code>JSON</code>](#GitUrl..JSON) | URL or object defining the new git url. |
| defaults | [<code>JSON</code>](#GitUrl..JSON) | Defaults for missing properties in the `url` param. |

<a name="GitUrl+raw"></a>

### gitUrl.raw : <code>String</code>
The raw github url in the form 'https://raw.github.com/owner/repo/ref`. In case the
[#host](#host) is an IP, the returned url is of the form 'https://xxx.xxx.xxx.xxx/raw/owner/repo/ref`.

**Kind**: instance property of [<code>GitUrl</code>](#GitUrl)  
<a name="GitUrl+rawRoot"></a>

### gitUrl.rawRoot : <code>String</code>
Root of the raw github url in the form 'https://raw.github.com`. In case the
[#host](#host) is an IP, the returned url is of the form 'https://xxx.xxx.xxx.xxx/raw`.

**Kind**: instance property of [<code>GitUrl</code>](#GitUrl)  
<a name="GitUrl+apiRoot"></a>

### gitUrl.apiRoot : <code>String</code>
Root of the github api in the form 'https://api.github.com`. In case the
[#host](#host) is an IP, the returned url is of the form 'https://xxx.xxx.xxx.xxx/api`.

**Kind**: instance property of [<code>GitUrl</code>](#GitUrl)  
<a name="GitUrl+protocol"></a>

### gitUrl.protocol : <code>String</code>
Protocol of the URL. eg `https`.

**Kind**: instance property of [<code>GitUrl</code>](#GitUrl)  
<a name="GitUrl+hostname"></a>

### gitUrl.hostname : <code>String</code>
Hostname of the repository provider. eg `github.com`

**Kind**: instance property of [<code>GitUrl</code>](#GitUrl)  
<a name="GitUrl+host"></a>

### gitUrl.host : <code>String</code>
Host of the repository provider. eg `localhost:44245`

**Kind**: instance property of [<code>GitUrl</code>](#GitUrl)  
<a name="GitUrl+port"></a>

### gitUrl.port : <code>String</code>
Port of the repository provider.

**Kind**: instance property of [<code>GitUrl</code>](#GitUrl)  
<a name="GitUrl+owner"></a>

### gitUrl.owner : <code>String</code>
Repository owner.

**Kind**: instance property of [<code>GitUrl</code>](#GitUrl)  
<a name="GitUrl+repo"></a>

### gitUrl.repo : <code>String</code>
Repository name (without .git extension).

**Kind**: instance property of [<code>GitUrl</code>](#GitUrl)  
<a name="GitUrl+ref"></a>

### gitUrl.ref : <code>String</code>
Repository ref, such as `master`.

**Kind**: instance property of [<code>GitUrl</code>](#GitUrl)  
<a name="GitUrl+path"></a>

### gitUrl.path : <code>String</code>
Resource path. eg `/README.md`

**Kind**: instance property of [<code>GitUrl</code>](#GitUrl)  
<a name="GitUrl+isLocal"></a>

### gitUrl.isLocal ⇒ <code>boolean</code>
Checks if this git url is _local_. A git-url is considered local if hostname is `localhost` and
the owner is `local` and the repo name is `default`. This is specific to helix.

**Kind**: instance property of [<code>GitUrl</code>](#GitUrl)  
<a name="GitUrl+equalsIgnoreTransport"></a>

### gitUrl.equalsIgnoreTransport(other) ⇒ <code>boolean</code>
Tests if this GitUrl is equal to `other` but ignores transport properties, such as protocol,
user and password.

**Kind**: instance method of [<code>GitUrl</code>](#GitUrl)  

| Param | Type | Description |
| --- | --- | --- |
| other | [<code>GitUrl</code>](#GitUrl) | the url to compare to |

<a name="GitUrl+toString"></a>

### gitUrl.toString() ⇒ <code>String</code>
String representation of the git url.

**Kind**: instance method of [<code>GitUrl</code>](#GitUrl)  
**Returns**: <code>String</code> - url.  
<a name="GitUrl+toJSON"></a>

### gitUrl.toJSON() ⇒ [<code>JSON</code>](#GitUrl..JSON) \| <code>String</code>
Returns a plain object representation.

**Kind**: instance method of [<code>GitUrl</code>](#GitUrl)  
**Returns**: [<code>JSON</code>](#GitUrl..JSON) \| <code>String</code> - A plain object suitable for serialization.  
<a name="GitUrl..JSON"></a>

### GitUrl~JSON : <code>Object</code>
JSON Serialization of GitUrl

**Kind**: inner typedef of [<code>GitUrl</code>](#GitUrl)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| protocol | <code>String</code> | Transport protocol |
| hostname | <code>String</code> | Repository provider host name |
| port | <code>String</code> | Repository provider port |
| host | <code>String</code> | Repository provider hostname and port. |
| owner | <code>String</code> | Repository owner |
| repo | <code>String</code> | Repository name |
| ref | <code>String</code> | Repository reference, such as `master` |
| path | <code>String</code> | Relative path to the resource |

<a name="Performance"></a>

## Performance
Performance Definition

**Kind**: global class  

* [Performance](#Performance)
    * _instance_
        * [.toJSON()](#Performance+toJSON) ⇒ [<code>JSON</code>](#Performance..JSON)
    * _inner_
        * [~JSON](#Performance..JSON)

<a name="Performance+toJSON"></a>

### performance.toJSON() ⇒ [<code>JSON</code>](#Performance..JSON)
Returns a json representation

**Kind**: instance method of [<code>Performance</code>](#Performance)  
<a name="Performance..JSON"></a>

### Performance~JSON
JSON Serialization of Performance

**Kind**: inner typedef of [<code>Performance</code>](#Performance)  
**Properties**

| Name | Type |
| --- | --- |
| device | <code>String</code> | 
| location | <code>String</code> | 
| connection | <code>String</code> | 

<a name="Redirect"></a>

## Redirect
Defines a redirect rule

**Kind**: global class  
<a name="SchemaDerivedConfig"></a>

## SchemaDerivedConfig
A Helix Config that is based on a (number of) JSON Schema(s).

**Kind**: global class  

* [SchemaDerivedConfig](#SchemaDerivedConfig)
    * [new SchemaDerivedConfig(opts)](#new_SchemaDerivedConfig_new)
    * _instance_
        * [.validate()](#SchemaDerivedConfig+validate)
        * [.defaultHandler(root)](#SchemaDerivedConfig+defaultHandler)
        * [.getHandler(propertypath)](#SchemaDerivedConfig+getHandler)
        * [.init()](#SchemaDerivedConfig+init)
    * _static_
        * [.matches(propertypath)](#SchemaDerivedConfig.matches)

<a name="new_SchemaDerivedConfig_new"></a>

### new SchemaDerivedConfig(opts)

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> |  |
| opts.filename | <code>string</code> | the source file when loading the config from disk |
| opts.schemas | <code>object</code> | a mapping between JSON paths (regex) and schema file names |
| opts.handlers | <code>object</code> | a mapping between JSON paths (regex) and proxy handlers |

<a name="SchemaDerivedConfig+validate"></a>

### schemaDerivedConfig.validate()
Validates the loaded configuration and coerces types and sets defaulst

**Kind**: instance method of [<code>SchemaDerivedConfig</code>](#SchemaDerivedConfig)  
<a name="SchemaDerivedConfig+defaultHandler"></a>

### schemaDerivedConfig.defaultHandler(root)
Creates a default proxy handler that looks up the correct handler
for the current property path and then wraps the corresponding
config object with it as a handler.

**Kind**: instance method of [<code>SchemaDerivedConfig</code>](#SchemaDerivedConfig)  

| Param | Type | Description |
| --- | --- | --- |
| root | <code>string</code> | the JSON Pointer path of the root property |

<a name="SchemaDerivedConfig+getHandler"></a>

### schemaDerivedConfig.getHandler(propertypath)
Looks up the handler registered to the current property path (if any)

**Kind**: instance method of [<code>SchemaDerivedConfig</code>](#SchemaDerivedConfig)  

| Param | Type | Description |
| --- | --- | --- |
| propertypath | <code>string</code> | the JSON Pointer path of the current property |

<a name="SchemaDerivedConfig+init"></a>

### schemaDerivedConfig.init()
Initialize the configuration

**Kind**: instance method of [<code>SchemaDerivedConfig</code>](#SchemaDerivedConfig)  
<a name="SchemaDerivedConfig.matches"></a>

### SchemaDerivedConfig.matches(propertypath)
Creates a matcher function that determines if a given property path
pattern matches the provided property path

**Kind**: static method of [<code>SchemaDerivedConfig</code>](#SchemaDerivedConfig)  

| Param | Type | Description |
| --- | --- | --- |
| propertypath | <code>string</code> | the JSON Pointer path of the property |

<a name="Static"></a>

## Static
Static content handling

**Kind**: global class  

* [Static](#Static)
    * _instance_
        * [.toJSON()](#Static+toJSON) ⇒ [<code>JSON</code>](#Static..JSON)
    * _inner_
        * [~JSON](#Static..JSON) ⇐ [<code>JSON</code>](#GitUrl..JSON)

<a name="Static+toJSON"></a>

### static.toJSON() ⇒ [<code>JSON</code>](#Static..JSON)
Returns a json representation

**Kind**: instance method of [<code>Static</code>](#Static)  
<a name="Static..JSON"></a>

### Static~JSON ⇐ [<code>JSON</code>](#GitUrl..JSON)
JSON Serialization of Static

**Kind**: inner typedef of [<code>Static</code>](#Static)  
**Extends**: [<code>JSON</code>](#GitUrl..JSON)  
**Properties**

| Name | Type |
| --- | --- |
| magic | <code>boolean</code> | 
| allow | <code>Array.&lt;String&gt;</code> | 
| deny | <code>Array.&lt;String&gt;</code> | 

<a name="Strain"></a>

## Strain
Strain

**Kind**: global class  

* [Strain](#Strain)
    * _instance_
        * [.name](#Strain+name) ⇒ <code>String</code>
        * [.content](#Strain+content) ⇒ [<code>GitUrl</code>](#GitUrl)
        * [.code](#Strain+code) ⇒ [<code>GitUrl</code>](#GitUrl)
        * [.static](#Strain+static) ⇒ [<code>Static</code>](#Static)
        * [.toJSON()](#Strain+toJSON) ⇒ [<code>JSON</code>](#Strain..JSON)
    * _inner_
        * [~JSON](#Strain..JSON)

<a name="Strain+name"></a>

### strain.name ⇒ <code>String</code>
Name of this strain.

**Kind**: instance property of [<code>Strain</code>](#Strain)  
<a name="Strain+content"></a>

### strain.content ⇒ [<code>GitUrl</code>](#GitUrl)
GitUrl of the content repository

**Kind**: instance property of [<code>Strain</code>](#Strain)  
<a name="Strain+code"></a>

### strain.code ⇒ [<code>GitUrl</code>](#GitUrl)
GitUrl of the code repository

**Kind**: instance property of [<code>Strain</code>](#Strain)  
<a name="Strain+static"></a>

### strain.static ⇒ [<code>Static</code>](#Static)
Static information of this strain

**Kind**: instance property of [<code>Strain</code>](#Strain)  
<a name="Strain+toJSON"></a>

### strain.toJSON() ⇒ [<code>JSON</code>](#Strain..JSON)
Returns a json representation

**Kind**: instance method of [<code>Strain</code>](#Strain)  
<a name="Strain..JSON"></a>

### Strain~JSON
JSON Serialization of a Strain

**Kind**: inner typedef of [<code>Strain</code>](#Strain)  
**Properties**

| Name | Type |
| --- | --- |
| name | <code>String</code> | 
| code | <code>String</code> | 
| content | [<code>JSON</code>](#GitUrl..JSON) | 
| static | [<code>JSON</code>](#Static..JSON) | 
| condition | <code>String</code> | 
| directoryIndex | <code>String</code> | 
| perf | [<code>JSON</code>](#Performance..JSON) | 
| origin | <code>Origin~JSON</code> | 

<a name="Strains"></a>

## Strains
Strains

**Kind**: global class  

* [Strains](#Strains)
    * [.toJSON()](#Strains+toJSON) ⇒ <code>Strains~JSON</code>
    * [.fromYAML(node)](#Strains+fromYAML)

<a name="Strains+toJSON"></a>

### strains.toJSON() ⇒ <code>Strains~JSON</code>
Returns a json representation

**Kind**: instance method of [<code>Strains</code>](#Strains)  
<a name="Strains+fromYAML"></a>

### strains.fromYAML(node)
Creates the strains from a yaml node

**Kind**: instance method of [<code>Strains</code>](#Strains)  

| Param | Type |
| --- | --- |
| node | <code>YAMLSeq</code> | 

<a name="configMapper"></a>

## configMapper
Determines how to transform children configuration based on the affix type.

**Kind**: global constant  
<a name="vclComposer"></a>

## vclComposer
Determines how to compose VCL based on the affix type.

**Kind**: global constant  
<a name="jsonGenarator"></a>

## jsonGenarator
Determines how to output JSON based on the affix type.

**Kind**: global constant  
<a name="booleanMap"></a>

## booleanMap
Boolean conditions

**Kind**: global constant  
<a name="propertyMap"></a>

## propertyMap
Known properties

**Kind**: global constant  
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

<a name="ResolveFn"></a>

## ResolveFn(left, right)
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| left | [<code>Strain</code>](#Strain) | the current candidate strain (can be undefined) |
| right | [<code>Strain</code>](#Strain) | the alternative candidate strain (can be undefined) |

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

<a name="nextTick"></a>

## nextTick() ⇒ <code>promise</code>
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

**Kind**: global function  
**Returns**: <code>promise</code> - A promise that will resolve during the next tick.  
<a name="isNodeType"></a>

## isNodeType()
Check whether the given type is the type of a dom node.  Note that, in
order to support various dom implementations, this function uses a heuristic
and there might be some false positives.

**Kind**: global function  
<a name="assertNode"></a>

## assertNode()
Ensure that the given node is a domNode. Checks with isNode()

**Kind**: global function  
<a name="nodeName"></a>

## nodeName()
Determine the name of a node.
The result is always in lower case.

**Kind**: global function  
<a name="ancestryNodes"></a>

## ancestryNodes(node) ⇒ <code>Array.&lt;DomNode&gt;</code>
Retrieve all the parent nodes of a dom node.

**Kind**: global function  
**Returns**: <code>Array.&lt;DomNode&gt;</code> - All the ancestor dom nodes to the given
  dom node, starting with the most distant dom node.  

| Param | Type |
| --- | --- |
| node | <code>DomNode</code> | 

<a name="equalizeNode"></a>

## equalizeNode(node) ⇒ <code>DomNode</code>
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

**Kind**: global function  
**Returns**: <code>DomNode</code> - The node parameter; the node parameter was mutated by this
  function; a reference to it is returned in order to facilitate function chaining.  

| Param | Type | Description |
| --- | --- | --- |
| node | <code>DomNode</code> | The node to equalize; this value will be mutated! |

<a name="nodeIsEquivalent"></a>

## nodeIsEquivalent(a, b) ⇒ <code>Boolean</code>
Test whether two nodes are equivalent.

`equals()` over two dom nodes is an alias for this.

Invokes equalizeNode() on both given elements before
invoking .isEqualNode.
This means the equivalence model described in `equalizeNode()`
is employed. Please refer to it's documentation to learn more

**Kind**: global function  

| Param | Type |
| --- | --- |
| a | <code>DomNode</code> | 
| b | <code>DomNode</code> | 

<a name="assertEquivalentNode"></a>

## assertEquivalentNode()
Assert that two dom nodes are equivalent.
The implementation mostly defers to .isEqualNode,
but provides better error messages.

**Kind**: global function  
<a name="dumpDOM"></a>

## dumpDOM(actual, expected, level)
prints dom in order for changes to be more discernible.

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| actual | <code>object</code> |  | node from original page |
| expected | <code>object</code> |  | node from test domain page |
| level | <code>number</code> | <code>0</code> | current level in recursion tree return dump of dom that is indented at every level by level*2 spaces |

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

