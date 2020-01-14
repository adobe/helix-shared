## Classes

<dl>
<dt><a href="#BaseConfig">BaseConfig</a></dt>
<dd></dd>
<dt><a href="#PropertyCondition">PropertyCondition</a></dt>
<dd><p>PropertyCondition</p>
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
<dt><a href="#ConsoleLogger">ConsoleLogger</a></dt>
<dd><p>Logger that is especially designed to be used in node.js
Print&#39;s to stderr; Marks errors, warns &amp; debug messages
with a colored <code>[ERROR]</code>/... prefix. Uses <code>inspect</code> to display
all non-strings.</p>
</dd>
<dt><a href="#MultiLogger">MultiLogger</a></dt>
<dd><p>Simple logger that forwards all messages to the underlying loggers.</p>
<p>This maintains an es6 map called loggers. Consumers of this API are
explicitly permitted to mutate this map or replace it all together in
order to add, remove or alter logger.</p>
<pre><code class="language-js">const { rootLogger } = require(&#39;@adobe/helix-shared&#39;).log;

// Changing the log level of the default logger:
rootLogger.loggers.get(&#39;default&#39;).level = &#39;info&#39;;

// Adding a named logger
rootLogger.loggers.set(&#39;logfile&#39;, new FileLogger(&#39;...&#39;));

// Adding an anonymous logger (you can add an arbitrary number of these)
const name = `logfile-${uuidgen()}`;
rootLogger.loggers.set(name, new FileLogger(&#39;...&#39;));

// Deleting a logger
rootLogger.loggers.delete(name);

// Replacing all loggers
rootLogger.loggers = new Map([[&#39;default&#39;, new ConsoleLogger({level: &#39;debug&#39;})]]);</code></pre>
</dd>
<dt><a href="#StreamLogger">StreamLogger</a></dt>
<dd><p>Logs to any writable node.js stream</p>
</dd>
<dt><a href="#FileLogger">FileLogger</a> ⇐ <code><a href="#StreamLogger">StreamLogger</a></code></dt>
<dd><p>Log to a file.</p>
</dd>
<dt><a href="#MemLogger">MemLogger</a></dt>
<dd><p>Logs messages to an in-memory buffer.</p>
</dd>
</dl>

## Members

<dl>
<dt><a href="#urlOverridesCondition">urlOverridesCondition</a></dt>
<dd><p>Flags indicating whether deprecation warning were shown.</p>
</dd>
<dt><a href="#serializeOpts">serializeOpts</a> : <code>object</code></dt>
<dd><p>Options that will be passed to <code>serializeMessage()</code>;
Feel free to mutate or exchange.</p>
</dd>
<dt><a href="#stream">stream</a> : <code>Object</code></dt>
<dd><p>The stream this logs to.</p>
</dd>
<dt><a href="#level">level</a> : <code>string</code></dt>
<dd><p>The minimum log level for messages to be printed.
Feel free to change to one of the levels described in the Logger
interface.</p>
</dd>
<dt><a href="#serializeOpts">serializeOpts</a> : <code>object</code></dt>
<dd><p>Options that will be passed to <code>serializeMessage()</code>;
Feel free to mutate or exchange.</p>
</dd>
<dt><a href="#buf">buf</a> : <code>Array.&lt;String&gt;</code></dt>
<dd><p>The buffer this records to.
Each element is a message, without the newline at the end.</p>
</dd>
<dt><a href="#level">level</a> : <code>string</code></dt>
<dd><p>The minimum log level for messages to be printed.
Feel free to change to one of the levels described in the Logger
interface.</p>
</dd>
<dt><a href="#serializeOpts">serializeOpts</a> : <code>object</code></dt>
<dd><p>Options that will be passed to <code>serializeMessage()</code>;
Feel free to mutate or exchange.</p>
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
<dt><a href="#progressFormat">progressFormat</a></dt>
<dd><p>Winston format that suppresses messages when the <code>info.progress</code> is <code>true</code> and console._stdout
is a TTY. This is used to log steps during a progress meter.</p>
</dd>
<dt><a href="#commandLineFormat">commandLineFormat</a></dt>
<dd><p>Winston format that is used for a command line application where <code>info</code> messages are rendered
without level.</p>
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
<dt><a href="#rootLogger">rootLogger</a></dt>
<dd><p>The logger all other loggers attach to.</p>
<p>Must always contain a logger named &#39;default&#39;; it is very much reccomended
that the default logger always be a console logger; this can serve as a good
fallback in case other loggers fail.</p>
<pre><code class="language-js">// Change the default logger
rootLogger.loggers.set(&#39;default&#39;, new ConsoleLogger({level: &#39;debug&#39;}));</code></pre>
<p>You should not log to the root logger directly; instead use one of the
wrapper functions <code>log, fatal, err, warn, info, verbose, debug</code>; they
perform some additional</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#urlPrefixCompose">urlPrefixCompose()</a></dt>
<dd><p>For URLs and URL paths, a substring match of &#39;/foo&#39; should actually
match &#39;/foo&#39; or &#39;/foo/index.html&#39; but not &#39;/fooby&#39;.</p>
<p>We therefore add extra clauses in VCL or evaluate an extra condition.</p>
</dd>
<dt><a href="#ResolveFn">ResolveFn(left, right)</a></dt>
<dd></dd>
<dt><a href="#getTestLogger">getTestLogger()</a> ⇒ <code>winston.Logger</code></dt>
<dd><p>Creates a test logger that logs to the console but also to an internal buffer. The contents of
the buffer can be retrieved with {@code Logger#getOutput()} which will flush also close the
logger. Each test logger will be registered with a unique category, so that there is no risk of
reusing a logger in between tests.</p>
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
};</code></pre>
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
<p>1) closely matches the mental model developers would have
2) does not affect rendering</p>
<p>For instance, indenting dom nodes for improved readability should
usually not affect equivalence, neither should inserting newline
characters/replacing spaces with newlines because a line is growing
too long or because dom elements should be one per line.</p>
<p>Whitespace in <pre> elements however should affect equivalence.</p>
<p>The given examples also adhere to the 'do not affect rendering'
rules unless exotic javascript or CSS is added after the fact.</p>
<h1 id="precise-semantics">Precise semantics</h1>
<p>The following rules are used by this function:</p>
<p>1) Whitespace in <pre> tags and contained tags is left alone.
  In more precise terms, whitespace in any elements whose computed
  <code>white-space</code> style property starts with <code>pre</code> is left alone.
2) Whitespace in other elements is compacted, meaning any combination
   of whitespace characters (newlines, spaces, tabs, etc) is replaced
   by a single space.
3) Any whitespace before/after closing/opening tags is removed, unless
   the tag in question is inline. A tag is inline if it's computed
   style property <code>display</code> starts with <code>inline</code> or is set to <code>content</code>.
   This is the default behaviour for <span>.
4) Whitespace next to opening/closing tags is also collapsed; all
   space between text nodes across a tree of purely inline elements are
   collapsed into a single space character. The space character is placed
   in the closest common ancestor, between the ancestors of both text nodes.</p>
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
<dt><a href="#numericLogLevel">numericLogLevel(name)</a> ⇒ <code>Number</code></dt>
<dd><p>This can be used to convert a string log level into it&#39;s
numeric equivalent. More pressing log levels have lower numbers.</p>
</dd>
<dt><a href="#tryInspect">tryInspect(what, opts)</a></dt>
<dd><p>Wrapper around inspect that is extremely robust against errors
during inspection.</p>
<p>Specifically designed to handle errors in toString() functions
and custom inspect functions.</p>
<p>If any error is encountered a less informative string than a full
inspect is returned and the error is logged using <code>err()</code>.</p>
</dd>
<dt><a href="#serializeMessage">serializeMessage(msg, opts)</a> ⇒ <code>string</code></dt>
<dd><p>This is a useful helper function that turns a message containing
arbitrary objects (like you would hand to console.log) into a string.</p>
<p>Leaves strings as is; uses <code>require(&#39;util&#39;).inspect(...)</code> on all other
types and joins the parameters using space:</p>
<p>Loggers writing to raw streams or to strings usually use this, however
not all loggers require this; e.g. in a browser environment
console.warn/log/error should be used as these enable the use of the
visual object inspectors, at least in chrome and firefox.</p>
</dd>
<dt><a href="#jsonEncodeMessage">jsonEncodeMessage(msg, opts)</a> ⇒ <code>string</code></dt>
<dd><p>Can be used to encode a message as json.</p>
<p>Uses serializeMessage internally.</p>
<pre><code>jsonEncodeMessage([&quot;Hello World&quot;, 42], { level: &#39;debug&#39; })
// =&gt; {message: &#39;Hello World 42&#39;, level: &#39;debug&#39;}</code></pre></dd>
<dt><a href="#log">log(msg, opts)</a></dt>
<dd><p>Actually print a log message</p>
<p>Implementations of this MUST NOT throw exceptions. Instead implementors
ARE ADVISED to attempt to log the error using err() while employing some
means to avoid recursively triggering the error. Loggers SHOULD fall back
to logging with console.error.</p>
<p>Even though loggers MUST NOT throw exceptions; users of this method SHOULD
still catch any errors and handle them appropriately.</p>
</dd>
<dt><a href="#log">log(msg, opts)</a></dt>
<dd><p>Lot to the root logger; this is a wrapper around <code>rootLogger.log</code>
that handles exceptions thrown by rootLogger.log.</p>
</dd>
<dt><a href="#fatal">fatal()</a></dt>
<dd><p>Uses the currently installed logger to print a fatal error-message</p>
</dd>
<dt><a href="#err">err()</a></dt>
<dd><p>Uses the currently installed logger to print an error-message</p>
</dd>
<dt><a href="#warn">warn()</a></dt>
<dd><p>Uses the currently installed logger to print an warn</p>
</dd>
<dt><a href="#info">info()</a></dt>
<dd><p>Uses the currently installed logger to print an informational message</p>
</dd>
<dt><a href="#verbose">verbose()</a></dt>
<dd><p>Uses the currently installed logger to print a verbose message</p>
</dd>
<dt><a href="#debug">debug()</a></dt>
<dd><p>Uses the currently installed logger to print a message intended for debugging</p>
</dd>
<dt><a href="#recordLogs">recordLogs(opts, fn)</a> ⇒ <code>String</code></dt>
<dd><p>Record the log files with debug granularity while the given function is running.</p>
<p>While the logger is recording, all other loggers are disabled.
If this is not your desired behaviour, you can use the MemLogger
manually.</p>
<pre><code>const { assertEquals } = require(&#39;ferrum&#39;);
const { recordLogs, info, err } = require(&#39;@adobe/helix-shared&#39;).log;

const logs = recordLogs(() =&gt; {
  info(&#39;Hello World\n&#39;);
  err(&#39;Nooo&#39;)
});
assertEquals(logs, &#39;Hello World\n[ERROR] Nooo&#39;);</code></pre></dd>
<dt><a href="#assertLogs">assertLogs(opts, fn, logs)</a></dt>
<dd><p>Assert that a piece of code produces a specific set of log messages.</p>
<pre><code>const { assertLogs, info, err } = require(&#39;@adobe/helix-shared&#39;).log;

assertLogs(() =&gt; {
r
  info(&#39;Hello World\n&#39;);
  err(&#39;Nooo&#39;)
}, multiline(`
  Hello World
  [ERROR] Nooo
`));</code></pre></dd>
<dt><a href="#recordAsyncLogs">recordAsyncLogs(opts, fn)</a> ⇒ <code>String</code></dt>
<dd><p>Async variant of recordLogs.</p>
<p>Note that using this is a bit dangerous;</p>
<pre><code>const { assertEquals } = require(&#39;ferrum&#39;);
const { recordAsyncLogs, info, err } = require(&#39;@adobe/helix-shared&#39;).log;

const logs = await recordLogs(async () =&gt; {
  info(&#39;Hello World\n&#39;);
  await sleep(500);
  err(&#39;Nooo&#39;)
});
assertEquals(logs, &#39;Hello World\n[ERROR] Nooo&#39;);</code></pre></dd>
<dt><a href="#assertAsyncLogs">assertAsyncLogs(opts, fn, logs)</a></dt>
<dd><p>Async variant of assertLogs</p>
<pre><code>const { assertAsyncLogs, info, err } = require(&#39;@adobe/helix-shared&#39;).log;

await assertAsyncLogs(() =&gt; {
  info(&#39;Hello World\n&#39;);
  await sleep(500);
  err(&#39;Nooo&#39;)
}, multiline(`
  Hello World
  [ERROR] Nooo
`));</code></pre></dd>
<dt><a href="#multiline">multiline()</a></dt>
<dd><p>This is a helper for declaring multiline strings.</p>
<pre><code>const s = multiline(`
    Foo
    Bar
    Baz

       Hello

    Bang
`);</code></pre><p>The function basically just takes a string and then
strips the first &amp; last lines if they are empty.</p>
<p>In order to remove indentation, we determine the common
whitespace prefix length (number of space 0x20 characters
at the start of the line). This prefix is simply removed
from each line...</p>
</dd>
</dl>

## Interfaces

<dl>
<dt><a href="#Logger">Logger</a></dt>
<dd><p>The logger interface can be used to customize how logging is done.</p>
<p>Uses a fairly simple interface to avoid complexity for use cases in
which is not required. Can be used to dispatch logging to more
elaborate libraries. E.g. a logger using winston could be constructed like this:</p>
</dd>
</dl>

<a name="Logger"></a>

## Logger
The logger interface can be used to customize how logging is done.

Uses a fairly simple interface to avoid complexity for use cases in
which is not required. Can be used to dispatch logging to more
elaborate libraries. E.g. a logger using winston could be constructed like this:

**Kind**: global interface  
<a name="BaseConfig"></a>

## BaseConfig
**Kind**: global class  

* [BaseConfig](#BaseConfig)
    * [new BaseConfig(name)](#new_BaseConfig_new)
    * [.saveConfig()](#BaseConfig+saveConfig) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_BaseConfig_new"></a>

### new BaseConfig(name)

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the config file, e.g. `helix-config.yaml` |

<a name="BaseConfig+saveConfig"></a>

### baseConfig.saveConfig() ⇒ <code>Promise.&lt;void&gt;</code>
Saves this config to [#configPath](#configPath)

**Kind**: instance method of [<code>BaseConfig</code>](#BaseConfig)  
<a name="PropertyCondition"></a>

## PropertyCondition
PropertyCondition

**Kind**: global class  
<a name="PropertyCondition+toVCLPath"></a>

### propertyCondition.toVCLPath(paramName)
Return a VCL conditional clause that will assign the calculated base path
to a request parameter.

**Kind**: instance method of [<code>PropertyCondition</code>](#PropertyCondition)  

| Param | Type | Description |
| --- | --- | --- |
| paramName | <code>String</code> | request parameter name to assign the base path to |

<a name="StringCondition"></a>

## StringCondition
StringCondition class

**Kind**: global class  
<a name="Condition"></a>

## Condition
Condition class

**Kind**: global class  
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
| opts.schema | <code>object</code> | a mapping between JSON paths (regex) and schema file names |
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

<a name="ConsoleLogger"></a>

## ConsoleLogger
Logger that is especially designed to be used in node.js
Print's to stderr; Marks errors, warns & debug messages
with a colored `[ERROR]`/... prefix. Uses `inspect` to display
all non-strings.

**Kind**: global class  
**Implements**: [<code>Logger</code>](#Logger)  
**Parameter**: <code>Object</code> opts – Currently supports one option:
  loglevel – One of the log levels described in the Logger interface.
    Messages below this log level will not be printed.
    Defaults to info.

  The rest of the options will be passed to serialize…  
<a name="MultiLogger"></a>

## MultiLogger
Simple logger that forwards all messages to the underlying loggers.

This maintains an es6 map called loggers. Consumers of this API are
explicitly permitted to mutate this map or replace it all together in
order to add, remove or alter logger.

```js
const { rootLogger } = require('@adobe/helix-shared').log;

// Changing the log level of the default logger:
rootLogger.loggers.get('default').level = 'info';

// Adding a named logger
rootLogger.loggers.set('logfile', new FileLogger('...'));

// Adding an anonymous logger (you can add an arbitrary number of these)
const name = `logfile-${uuidgen()}`;
rootLogger.loggers.set(name, new FileLogger('...'));

// Deleting a logger
rootLogger.loggers.delete(name);

// Replacing all loggers
rootLogger.loggers = new Map([['default', new ConsoleLogger({level: 'debug'})]]);
```

**Kind**: global class  
**Implements**: [<code>Logger</code>](#Logger)  
**Parameter**: <code>...Logger</code> ...loggers – The loggers to forward to.  
<a name="StreamLogger"></a>

## StreamLogger
Logs to any writable node.js stream

**Kind**: global class  
**Implements**: [<code>Logger</code>](#Logger)  
<a name="new_StreamLogger_new"></a>

### new StreamLogger(stream, opts)

| Param | Type | Description |
| --- | --- | --- |
| stream | <code>WritableStream</code> | The stream to log to |
| opts | <code>Object</code> | – Configuration object; contains only one key at   the moment: `level` - The log level which can be one of `error, warn,   info, verbose` and `debug`. |

<a name="FileLogger"></a>

## FileLogger ⇐ [<code>StreamLogger</code>](#StreamLogger)
Log to a file.

**Kind**: global class  
**Extends**: [<code>StreamLogger</code>](#StreamLogger)  
**Implements**: [<code>Logger</code>](#Logger)  
<a name="new_FileLogger_new"></a>

### new FileLogger(name, opts)

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | The name of the file to log to |
| opts | <code>Object</code> | – Configuration object; contains only one key at   the moment: `level` - The log level which can be one of `error, warn,   info, verbose` and `debug`. |

<a name="MemLogger"></a>

## MemLogger
Logs messages to an in-memory buffer.

**Kind**: global class  
**Implements**: [<code>Logger</code>](#Logger)  
<a name="new_MemLogger_new"></a>

### new MemLogger(opts)

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | – Configuration object; contains only one key at   the moment: `level` - The log level which can be one of `error, warn,   info, verbose` and `debug`. |

<a name="urlOverridesCondition"></a>

## urlOverridesCondition
Flags indicating whether deprecation warning were shown.

**Kind**: global variable  
<a name="serializeOpts"></a>

## serializeOpts : <code>object</code>
Options that will be passed to `serializeMessage()`;
Feel free to mutate or exchange.

**Kind**: global variable  
<a name="stream"></a>

## stream : <code>Object</code>
The stream this logs to.

**Kind**: global variable  
<a name="level"></a>

## level : <code>string</code>
The minimum log level for messages to be printed.
Feel free to change to one of the levels described in the Logger
interface.

**Kind**: global variable  
<a name="serializeOpts"></a>

## serializeOpts : <code>object</code>
Options that will be passed to `serializeMessage()`;
Feel free to mutate or exchange.

**Kind**: global variable  
<a name="buf"></a>

## buf : <code>Array.&lt;String&gt;</code>
The buffer this records to.
Each element is a message, without the newline at the end.

**Kind**: global variable  
<a name="level"></a>

## level : <code>string</code>
The minimum log level for messages to be printed.
Feel free to change to one of the levels described in the Logger
interface.

**Kind**: global variable  
<a name="serializeOpts"></a>

## serializeOpts : <code>object</code>
Options that will be passed to `serializeMessage()`;
Feel free to mutate or exchange.

**Kind**: global variable  
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
<a name="progressFormat"></a>

## progressFormat
Winston format that suppresses messages when the `info.progress` is `true` and console._stdout
is a TTY. This is used to log steps during a progress meter.

**Kind**: global constant  
<a name="commandLineFormat"></a>

## commandLineFormat
Winston format that is used for a command line application where `info` messages are rendered
without level.

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

<a name="rootLogger"></a>

## rootLogger
The logger all other loggers attach to.

Must always contain a logger named 'default'; it is very much reccomended
that the default logger always be a console logger; this can serve as a good
fallback in case other loggers fail.

```js
// Change the default logger
rootLogger.loggers.set('default', new ConsoleLogger({level: 'debug'}));
```

You should not log to the root logger directly; instead use one of the
wrapper functions `log, fatal, err, warn, info, verbose, debug`; they
perform some additional

**Kind**: global constant  
<a name="urlPrefixCompose"></a>

## urlPrefixCompose()
For URLs and URL paths, a substring match of '/foo' should actually
match '/foo' or '/foo/index.html' but not '/fooby'.

We therefore add extra clauses in VCL or evaluate an extra condition.

**Kind**: global function  
<a name="ResolveFn"></a>

## ResolveFn(left, right)
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| left | [<code>Strain</code>](#Strain) | the current candidate strain (can be undefined) |
| right | [<code>Strain</code>](#Strain) | the alternative candidate strain (can be undefined) |

<a name="getTestLogger"></a>

## getTestLogger() ⇒ <code>winston.Logger</code>
Creates a test logger that logs to the console but also to an internal buffer. The contents of
the buffer can be retrieved with {@code Logger#getOutput()} which will flush also close the
logger. Each test logger will be registered with a unique category, so that there is no risk of
reusing a logger in between tests.

**Kind**: global function  
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
<a name="numericLogLevel"></a>

## numericLogLevel(name) ⇒ <code>Number</code>
This can be used to convert a string log level into it's
numeric equivalent. More pressing log levels have lower numbers.

**Kind**: global function  
**Returns**: <code>Number</code> - The numeric log level  
**Throws**:

- <code>Error</code> If the given log level name is invalid.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of the log level |

<a name="tryInspect"></a>

## tryInspect(what, opts)
Wrapper around inspect that is extremely robust against errors
during inspection.

Specifically designed to handle errors in toString() functions
and custom inspect functions.

If any error is encountered a less informative string than a full
inspect is returned and the error is logged using `err()`.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| what | <code>Any</code> | The object to inspect |
| opts | <code>Object</code> | Options will be passed through to inspect.   Note that these may be ignored if there is an error during inspect(). |

<a name="serializeMessage"></a>

## serializeMessage(msg, opts) ⇒ <code>string</code>
This is a useful helper function that turns a message containing
arbitrary objects (like you would hand to console.log) into a string.

Leaves strings as is; uses `require('util').inspect(...)` on all other
types and joins the parameters using space:

Loggers writing to raw streams or to strings usually use this, however
not all loggers require this; e.g. in a browser environment
console.warn/log/error should be used as these enable the use of the
visual object inspectors, at least in chrome and firefox.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>Array.&lt;any&gt;</code> | – Parameters as you would pass them to console.log |
| opts | <code>Object</code> | – Parameters are forwarded to util.inspect().   By default `{depth: null, breakLength: Infinity, colors: false}` is used. |

<a name="jsonEncodeMessage"></a>

## jsonEncodeMessage(msg, opts) ⇒ <code>string</code>
Can be used to encode a message as json.

Uses serializeMessage internally.

```
jsonEncodeMessage(["Hello World", 42], { level: 'debug' })
// => {message: 'Hello World 42', level: 'debug'}
```

**Kind**: global function  
**Returns**: <code>string</code> - Json encoded string  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>Array.&lt;any&gt;</code> | – Parameters as you would pass them to console.log |
| opts | <code>Object</code> | – Named parameters:   - level: The log level; defaults to 'info'   Any other parameters are forwarded to serializeMessage. |

<a name="log"></a>

## log(msg, opts)
Actually print a log message

Implementations of this MUST NOT throw exceptions. Instead implementors
ARE ADVISED to attempt to log the error using err() while employing some
means to avoid recursively triggering the error. Loggers SHOULD fall back
to logging with console.error.

Even though loggers MUST NOT throw exceptions; users of this method SHOULD
still catch any errors and handle them appropriately.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>Array.&lt;any&gt;</code> | The message; list of arguments as you would pass it to console.log |
| opts | <code>Object</code> | – Configuration object; contains only one key at   the moment: `level` - The log level which can be one of `error, warn,   info, verbose` and `debug`. |

<a name="log"></a>

## log(msg, opts)
Lot to the root logger; this is a wrapper around `rootLogger.log`
that handles exceptions thrown by rootLogger.log.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>Array.&lt;Any&gt;</code> | – The message as you would hand it to console.log |
| opts | <code>Object</code> | – Any options you would pass to rootLogger.log |

<a name="fatal"></a>

## fatal()
Uses the currently installed logger to print a fatal error-message

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ......msg | <code>Any</code> | – The message as you would hand it to console.log |

<a name="err"></a>

## err()
Uses the currently installed logger to print an error-message

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ......msg | <code>Any</code> | – The message as you would hand it to console.log |

<a name="warn"></a>

## warn()
Uses the currently installed logger to print an warn

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ......msg | <code>Any</code> | – The message as you would hand it to console.log |

<a name="info"></a>

## info()
Uses the currently installed logger to print an informational message

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ......msg | <code>Any</code> | – The message as you would hand it to console.log |

<a name="verbose"></a>

## verbose()
Uses the currently installed logger to print a verbose message

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ......msg | <code>Any</code> | – The message as you would hand it to console.log |

<a name="debug"></a>

## debug()
Uses the currently installed logger to print a message intended for debugging

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ......msg | <code>Any</code> | – The message as you would hand it to console.log |

<a name="recordLogs"></a>

## recordLogs(opts, fn) ⇒ <code>String</code>
Record the log files with debug granularity while the given function is running.

While the logger is recording, all other loggers are disabled.
If this is not your desired behaviour, you can use the MemLogger
manually.

```
const { assertEquals } = require('ferrum');
const { recordLogs, info, err } = require('@adobe/helix-shared').log;

const logs = recordLogs(() => {
  info('Hello World\n');
  err('Nooo')
});
assertEquals(logs, 'Hello World\n[ERROR] Nooo');
```

**Kind**: global function  
**Returns**: <code>String</code> - The logs that where produced by the codee  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | – optional first parameter; options passed to MemLogger |
| fn | <code>function</code> | The logs that this code emits will be recorded. |

<a name="assertLogs"></a>

## assertLogs(opts, fn, logs)
Assert that a piece of code produces a specific set of log messages.

```
const { assertLogs, info, err } = require('@adobe/helix-shared').log;

assertLogs(() => {
r
  info('Hello World\n');
  err('Nooo')
}, multiline(`
  Hello World
  [ERROR] Nooo
`));
```

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | – optional first parameter; options passed to MemLogger |
| fn | <code>function</code> | The logs that this code emits will be recorded. |
| logs | <code>String</code> |  |

<a name="recordAsyncLogs"></a>

## recordAsyncLogs(opts, fn) ⇒ <code>String</code>
Async variant of recordLogs.

Note that using this is a bit dangerous;

```
const { assertEquals } = require('ferrum');
const { recordAsyncLogs, info, err } = require('@adobe/helix-shared').log;

const logs = await recordLogs(async () => {
  info('Hello World\n');
  await sleep(500);
  err('Nooo')
});
assertEquals(logs, 'Hello World\n[ERROR] Nooo');
```

**Kind**: global function  
**Returns**: <code>String</code> - The logs that where produced by the codee  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | – optional first parameter; options passed to MemLogger |
| fn | <code>function</code> | The logs that this code emits will be recorded. |

<a name="assertAsyncLogs"></a>

## assertAsyncLogs(opts, fn, logs)
Async variant of assertLogs

```
const { assertAsyncLogs, info, err } = require('@adobe/helix-shared').log;

await assertAsyncLogs(() => {
  info('Hello World\n');
  await sleep(500);
  err('Nooo')
}, multiline(`
  Hello World
  [ERROR] Nooo
`));
```

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | – optional first parameter; options passed to MemLogger |
| fn | <code>function</code> | The logs that this code emits will be recorded. |
| logs | <code>String</code> |  |

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
