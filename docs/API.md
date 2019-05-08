## Classes

<dl>
<dt><a href="#GitUrl">GitUrl</a></dt>
<dd><p>Represents a GIT url.</p>
</dd>
<dt><a href="#Performance">Performance</a></dt>
<dd><p>Performance Definition</p>
</dd>
<dt><a href="#Redirect">Redirect</a></dt>
<dd><p>Defines a redirect rule</p>
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
<dt><a href="#HybridWeakMap">HybridWeakMap</a></dt>
<dd><p>Drop-in replacement for WeakMap that can store primitives.</p>
</dd>
<dt><a href="#Trait">Trait</a></dt>
<dd><p>Helper for implementing generic functions/protocols.</p>
<p>Want to see the code? Scroll down to <code>Show me the code</code>.</p>
<h1 id="traits-an-introduction-very-specific-interfaces-that-let-you-choose-your-guarantees">Traits, an introduction: Very specific interfaces that let you choose your guarantees</h1>
<p>This helps to implement a concept known as type classes in haskell,
traits in rust, protocols in elixir, protocols (like the iteration protocol)
in javascript.
This helper is not supposed to replace ES6 protocols, instead it is supposed
to expand on them and make them more powerfull.</p>
<p>Basically this allows you to declare an interface, similar to interfaces in
C++ or C# or Java. You declare the interface; anyone implementing this generic
interface (like the iterator protocol, or Size interface which can be used to
determine the size of a container) promises to obey the rules and the laws of
the interface.
This is much more specific than having a size() method for instance; size() is
just an name which might be reasonably used in multiple circumstances; e.g. one
might use the name size() for a container that can have a <code>null</code> size, or return
a tuple of two numbers because the size is two dimensional. Or it might require
io to return the size or be complex to compute (e.g. in a linked list).</p>
<p>A size() method may do a lot of things, the Size trait however has a highly specific
definition: It returns the size of a container, as a Number which must be greater than
zero and cannot be null. The size must be efficient to compute as well.</p>
<p>By using the Size trait, the developer providing an implementation specifically says
&#39;I obey those rules&#39;. There may even be a second trait called <code>Size</code> with it&#39;s own rules.
The trait class is written in a way so those two would not interfere.</p>
<h2 id="traits-do-not-provide-type-checks">Traits do not provide type checks</h2>
<p>Because we are in javascript, these guarantees are generally not enforced by the type system
and the dev providing an implementation is still responsible for writing extensive tests.</p>
<h1 id="traits-provide-abstraction-think-about-what-you-want-to-do-not-how-you-want-to-do-it">Traits provide abstraction: Think about what you want to do, not how you want to do it</h1>
<p>One specific feature traits provide is that they let you state what you want to do instead of how
to do it.
Need to determine the size of a container? Use <code>.length</code> for arrays and strings,
use <code>.size</code> for ES6 Maps and Sets and a for loop to determine the size of an object.
Or you could just use the Size trait and call <code>size(thing)</code> which works for all of these
types. This is one of the features traits provide; define an implementation for a trait
once and you no longer have to think about how to achieve a thing, just what to achieve.</p>
<h1 id="show-me-the-code">Show me the code</h1>
<pre><code>// Declaring a trait
const Size = new Trait(&#39;Size&#39;);

// Using it
const size = (what) =&gt; Size.invoke(what);
const empty = (what) =&gt; size(what) === 0;

// Providing implementations for own types
class MyType {
  [Size.sym]() {
    return 42;
  }
}

// Providing implementations for third party types
Size.impl(Array, (x) =&gt; x.length); // Method of type Array
Size.impl(String, (x) =&gt; x.length);
Size.impl(Map, (x) =&gt; x.size);
Size.impl(Set, (x) =&gt; x.size);

Size.impl(Object, (x) =&gt; { // Note that this won&#39;t apply to subclasses
  let cnt = 0;
  for (const _ in x) cnt++;
  return cnt;
});

// Note: The two following examples would be a bad idea in reality,
// they are just here toshow the mechanism
Size.implStatic(null, (_) =&gt; 0); // Static implementation (for a value and not a type)

// This implementation will be used if the underlying type/value
// implements the magnitude trait
Size.implDerived([Magnitued], ([magnitude], v) =&gt; magnitude(v));

// This will be called as a last resort, so this must be very fast!
// This example would implement the `size` trait for any even number.
// Note how we just return `undefined` for non even numbers
Size.implWildStatic(
   (x) =&gt; type(x) === Number &amp;&amp; x % 2 == 0 ? (x =&gt; x) : undefined);

// test if an object is a dom node
const isNode = o =&gt;
    typeof Node === &quot;object&quot;
       ? o instanceof Node
       : o &amp;&amp; typeof o === &quot;object&quot;
           &amp;&amp; typeof o.nodeType === &quot;number&quot;
           &amp;&amp; typeof o.nodeName===&quot;string&quot;;

// Last resort lookup for types. Implements Size for any dom nodes…
Size.implWild(
   (t) =&gt; isNodeType(t) ? ((elm) =&gt; elm.childElementCount) : undefined);


// Using all the implementations
size([1,2,3]) # =&gt; 3
size({foo: 42}) # =&gt; 1
size(new Set([1,2,3])) # =&gt; 3
size(new MyType()) # =&gt; 42
size(null) # =&gt; 0
size(document.body) # =&gt; 1
</code></pre><h1 id="implementing-traits-for-third-party-types">Implementing traits for third party types</h1>
<p>This is another feature that makes traits particularly useful! Java for instance
has interfaces, but the creator of a class/type must think of implementing a specific interface;
this is particularly problematic if the type is from a library; the interface must
either come from the standard library or from that particular library.</p>
<p>This usually is not very helpful; with traits this is not a problem at all.
Just use <code>MyTrait.impl</code> as in the example above.</p>
<h1 id="subclassing-the-trait-class">Subclassing the Trait class</h1>
<p>You may subclass Trait and overwrite any of it&#39;s methods.</p>
</dd>
</dl>

## Constants

<dl>
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
  <code></code>
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
<dt><a href="#and">and</a></dt>
<dd><p>The &amp;&amp; operator as a function</p>
</dd>
<dt><a href="#or">or</a></dt>
<dd><p>The|| operator as a function</p>
</dd>
<dt><a href="#nand">nand</a> ⇒ <code>Boolean</code></dt>
<dd><p>NAND as a function.</p>
</dd>
<dt><a href="#nor">nor</a> ⇒ <code>Boolean</code></dt>
<dd><p>NOR as a function.</p>
</dd>
<dt><a href="#xor">xor</a> ⇒ <code>Boolean</code></dt>
<dd><p>XOR as a function.</p>
</dd>
<dt><a href="#xnor">xnor</a> ⇒ <code>Boolean</code></dt>
<dd><p>XNOR as a function.</p>
</dd>
<dt><a href="#is">is</a></dt>
<dd><p>=== as a function</p>
</dd>
<dt><a href="#aint">aint</a></dt>
<dd><p>!== as a function</p>
</dd>
<dt><a href="#plus">plus</a></dt>
<dd><p>The + operator as a function</p>
</dd>
<dt><a href="#mul">mul</a></dt>
<dd><p>The * operator as a function</p>
</dd>
<dt><a href="#Sequence">Sequence</a></dt>
<dd><p>Trait for any iterable type.</p>
<p>Uses the <code>Symbol.iterator</code> Symbol, so this is implemented for any
type that implements the iterator protocol.</p>
</dd>
<dt><a href="#extend">extend</a> ⇒ <code>Iterator</code></dt>
<dd><p>Generate a sequence by repeatedly calling the same function on the
previous value.</p>
<p>This is often used in conjunction with takeDef or takeWhile to generate
a non-infinite sequence.</p>
<pre><code>// Generate an infinite list of all positive integers
extend(0, x =&gt; x+1);
// Generate the range of integers [first; last[
const range = (first, last) =&gt;
  takeUntilVal(extend(first, x =&gt; x+1), last);
</code></pre></dd>
<dt><a href="#extend1">extend1</a> ⇒ <code>Iterator</code></dt>
<dd><p>Like extend(), but the resulting sequence does not contain
the initial element.</p>
</dd>
<dt><a href="#flattenTree">flattenTree</a> ⇒ <code>Sequnece</code></dt>
<dd><p>Flatten trees of any type into a sequence.</p>
<p>The given function basically has three jobs:</p>
<ol>
<li>Decide whether a given value in a tree is a node or a leaf (or both)</li>
<li>Convert nodes into sequences so we can easily recurse into them</li>
<li>Extract values from leaves</li>
</ol>
<p>If the given function does it&#39;s job correctly, visit will yield
a sequence with all the values from the tree.</p>
<p>The function must return a sequence of values! It is given the current
node as well as a callback that that takes a list of child nodes and flattens
the given subnodes.</p>
<p>Use the following return values:</p>
<pre><code>flattenTree((node, recurse) =&gt; {
  if (isEmptyLeaf()) {
    return [];

  } else if (isLeaf(node)) {
    return [node.value];

  } else if (isMultiLeaf(node)) {
    return node.values;

  } else if (isNode(node)) {
    return recurse(node.childNodes);

  } else if (isLeafAndNode(node)) {
    return concat([node.value], recurse(node.childNodes));
  }
 }
});
</code></pre></dd>
<dt><a href="#nth">nth</a></dt>
<dd><p>Extract the nth element from the sequence</p>
</dd>
<dt><a href="#each">each</a></dt>
<dd><p>Iterate over sequences: Apply the give function to
every element in the sequence</p>
</dd>
<dt><a href="#join">join</a></dt>
<dd><p>Convert each element from a sequence into a string
and join them with the given separator.</p>
</dd>
<dt><a href="#into">into</a></dt>
<dd><p>Convert values into a given type using the <code>Into</code> trait.
Note that this has inverse parameters compared to the trait
(sequence first, type second) for currying purposes.</p>
</dd>
<dt><a href="#Into">Into</a></dt>
<dd><p>Into can be used to turn sequences back into other types.</p>
<p>into is the inverse of <code>iter()</code>, meaning that taking the result
of <code>iter()</code> and calling <code>into()</code>, yields the original value.</p>
<p>So in a purely functional language, <code>into(iter(v))</code> would be a
no-op; since we are in javascript, this essentially implements
a poor mans shallow copy for some types</p>
<pre><code>const shallowcopy = (v) =&gt; into(v, v.constructor);
</code></pre><h1 id="interface">Interface</h1>
<p>`(T: Type/Function, v: Sequence) =&gt; r: T</p>
<h1 id="laws">Laws</h1>
<ul>
<li><code>into(v, type(v)) &lt;=&gt; shallowclone(v)</code></li>
</ul>
<h1 id="specialization-notes">Specialization notes</h1>
<p>String: Uses toString() on each value from the sequence
  and concatenates them into one string...
Object: Expects key/value pairs; the keys must be strings;
  sequences containing the same key multiple times and sequences
  with bad key/value pairs are considered to be undefined behaviour.
  The key/value pairs may be sequences themselves.
Map: Same rules as for object.
Set: Refer to <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set">https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set</a></p>
<h1 id="examples">Examples</h1>
<p>Practical uses of into include converting between types; e.g:</p>
<pre><code>into({foo:  42, bar: 23}, Map) # Map { &#39;foo&#39; =&gt; 42, &#39;bar&#39; }
into([&quot;foo&quot;, &quot; bar&quot;], String) # &quot;foo bar&quot;
into([1,1,2,3,4,2], Set) # Set(1,2,3,4)
</code></pre><p>Into is also useful to transform values using the functions
in this class:</p>
<pre><code># Remove odd numbers from a set
const st = new Set([1,1,2,2,3,4,5]);
into(filter(st, n =&gt; n % 2 == 0), Set) # Set(2,4)

# Remove a key/value pair from an object
const obj = {foo: 42, bar: 5};
into(filter(obj, ([k, v]) =&gt; k !== &#39;foo&#39;), Obj)
# yields {bar: 5}
</code></pre><p>It can be even used for more complex use cases:</p>
<pre><code># Merge multiple key/value containers into one sequence:
const seq = concat([[99, 42]], new Map(true, 23), {bar: 13});
into(seq, Map) # Map( 99 =&gt; 42, true =&gt; 23, bar =&gt; 13 )
</code></pre></dd>
<dt><a href="#foldl">foldl</a></dt>
<dd><p>Combine all the values from a sequence into one value.</p>
<p>This function is also often called reduce, because it reduces
multiple values into a single value.</p>
<p>Here are some common use cases of the foldl function:</p>
<pre><code>const all = (seq) =&gt; foldl(seq, true, (a, b) =&gt; a &amp;&amp; b);
const any = (seq) =&gt; foldl(seq, false, (a, b) =&gt; a || b);
const sum = (seq) =&gt; foldl(seq, 0, (a, b) =&gt; a + b);
const product = (seq) =&gt; foldl(seq, 1, (a, b) =&gt; a * b);
</code></pre><p>Notice the pattern: We basically take an operator and apply
it until the sequence is empty: sum([1,2,3,4]) is pretty much
equivalent to <code>1 + 2 + 3 + 4</code>.</p>
<p>(If you want to get very mathematical here...notice how we basically
have an operation and then just take the operation&#39;s neutral element
as the initial value?)</p>
</dd>
<dt><a href="#foldr">foldr</a></dt>
<dd><p>Like foldl, but right-to-left</p>
</dd>
<dt><a href="#map">map</a> ⇒ <code>Iterator</code></dt>
<dd><p>Lazily transform all the values in a sequence.</p>
<pre><code>into(map([1,2,3,4], n =&gt; n*2), Array) # [2,4,6,8]
</code></pre></dd>
<dt><a href="#filter">filter</a> ⇒ <code>Iterator</code></dt>
<dd><p>Remove values from the sequence based on the given condition.</p>
<pre><code>filter(range(0,10), x =&gt; x%2 == 0) // [2,4,6,8]
</code></pre></dd>
<dt><a href="#reject">reject</a></dt>
<dd><p>Opposite of filter: Removes values from the sequence if the function
returns true.</p>
</dd>
<dt><a href="#trySkip">trySkip</a> ⇒ <code>Iterator</code></dt>
<dd><p>Like skip, but returns an exhausted iterator if the sequence contains
less than <code>no</code> elements instead of throwing IteratorEnded.</p>
</dd>
<dt><a href="#skip">skip</a> ⇒ <code>Iterator</code></dt>
<dd><p>Skip elements in a sequence.
Throws IteratorEnded if the sequence contains less than <code>no</code> elements.</p>
</dd>
<dt><a href="#skipWhile">skipWhile</a> ⇒ <code>Iterator</code></dt>
<dd><p>Skips elements in the given sequences until one is found
for which the predicate is false.</p>
</dd>
<dt><a href="#tryTake">tryTake</a> ⇒ <code>Iterator</code></dt>
<dd><p>Yields an iterator of the first <code>no</code> elements in the given
sequence; the resulting iterator may contain less then <code>no</code>
elements if the input sequence was shorter than <code>no</code> elements.</p>
</dd>
<dt><a href="#take">take</a> ⇒ <code>Array</code></dt>
<dd><p>Version of tryTake that will throw IteratorEnded
if the given iterable is too short.</p>
</dd>
<dt><a href="#takeWhile">takeWhile</a> ⇒ <code>Iterator</code></dt>
<dd><p>Cut off the sequence at the first point where the given condition is no
longer met.</p>
<p><code>list(takeWhile([1,2,3,4,5,6...], x =&gt; x &lt; 4))</code> yields <code>[1,2,3]</code></p>
</dd>
<dt><a href="#takeUntilVal">takeUntilVal</a> ⇒ <code>Iterator</code></dt>
<dd><p>Cut of the sequence at the point where the given value is
first encountered.</p>
</dd>
<dt><a href="#prepend">prepend</a></dt>
<dd><p>Given a sequence and a value, prepend the value to the sequence,
yielding a new iterator.</p>
</dd>
<dt><a href="#append">append</a></dt>
<dd><p>Given a sequence and a value, append the value to the sequence,
yielding a new iterator.</p>
</dd>
<dt><a href="#mapSort">mapSort</a> ⇒ <code>Array</code></dt>
<dd><p>Sort a sequence.
The given function must turn map each parameter to a string or
number. Objects will be sorted based on those numbers.A
If the given parameters are already numbers/strings, you may
just use identity as the mapping function.</p>
</dd>
<dt><a href="#zipLeast2">zipLeast2</a></dt>
<dd><p>Curryable version of zipLeast</p>
</dd>
<dt><a href="#zip2">zip2</a></dt>
<dd><p>Curryable version of zip</p>
</dd>
<dt><a href="#zipLongest">zipLongest</a> ⇒ <code>Iterator</code></dt>
<dd><p>Zip multiple sequences.
Puts all the first values from sequences into one sublist;
all the second values, third values and so on...
If the sequences are of different length, the resulting iterator
will have the length of the longest sequence; the missing values
from the shorter sequences will be substituted with the given
fallback value.</p>
</dd>
<dt><a href="#zipLongest2">zipLongest2</a></dt>
<dd><p>Curryable version of zipLongest</p>
</dd>
<dt><a href="#slidingWindow">slidingWindow</a> ⇒ <code>Iterator</code></dt>
<dd><p>Forms a sliding window on the underlying iterator.</p>
<p><code>slidingWindow([1,2,3,4,5], 3)</code>
yields <code>[[1,2,3], [2,3,4], [3,4,5]]</code></p>
<p>Will throw IteratorEnded if the sequence is shorter than
the given window.</p>
</dd>
<dt><a href="#trySlidingWindow">trySlidingWindow</a></dt>
<dd><p>Like slidingWindow, but returns an empty sequence if the given
sequence is too short.</p>
</dd>
<dt><a href="#lookahead">lookahead</a></dt>
<dd><p>Almost like trySlidingWindow, but makes sure that
every element from the sequence gets it&#39;s own subarray,
even the last element. The arrays at the end are filled
with the filler value to make sure they have the correct
length.</p>
<pre><code>lookahead([], 3, null) # =&gt; []
lookahead([42], 3, null) # =&gt; [[42, null, null, null]]
lookahead([42, 23], 3, null) # =&gt; [[42, 23, null, null], [23, null, null, null]]
lookahead([42, 23], 0, null) # =&gt; [[42], [23]]
</code></pre><p>Try sliding window would yield an empty array in each of the examples
above.</p>
</dd>
<dt><a href="#mod">mod</a> ⇒ <code>Any</code></dt>
<dd><p>Modify/Transform the given value.</p>
<p>Applys the given value to the given function; after the return
value is known, that return value is converted into the type
of the given parameter.</p>
<pre><code>const s = new Set([1,2,3,4]);
const z = mod1(s, map(plus(1))); # =&gt; new Set([2,3,4,5]),
assert(z.constructor === Set)
</code></pre></dd>
<dt><a href="#union2">union2</a></dt>
<dd><p>Curryable version of union</p>
</dd>
<dt><a href="#typedArrays">typedArrays</a></dt>
<dd><p>List of all types that are typed arrays</p>
</dd>
<dt><a href="#implements">implements</a></dt>
<dd><p>Test if the given trait has been implemented for the given type</p>
</dd>
<dt><a href="#valueImplements">valueImplements</a></dt>
<dd><p>Test if the given trait has been implemented for the given value</p>
</dd>
<dt><a href="#Immutable">Immutable</a></dt>
<dd><p>This is a flag trait that indicates whether a type is immutable.</p>
<p>Since javascript has not real way to enforce absolute immutability
this trait considers anything immutable that is hard to mutate
or really not supposed to be mutated.
Function is considered immutable despite it being possible to assign
parameters to functions...</p>
<p>This is used in a couple paces; specifically it is used as a list of types
that should be left alone in <code>deepclone</code> and <code>shallowclone</code>.</p>
</dd>
<dt><a href="#eq">eq</a></dt>
<dd><p>Determine whether two values are equal using the Equals trait.</p>
<p>This function is a bit more powerful than than the Equals trait itself:
First of all it searches for a <code>Equals</code> implementation for both arguments
and it falls back to <code>===</code> if none is found.
For this reason using eq() is usually preferred over using the Equals trait directly.</p>
</dd>
<dt><a href="#uneq">uneq</a></dt>
<dd><p>Equivalent to <code>!eq(a, b)</code></p>
</dd>
<dt><a href="#Equals">Equals</a></dt>
<dd><p>Trait to check whether two values are equal.</p>
<p>Normally this trait should not be used directly; consider using
<code>eq()</code> instead.</p>
<p>This trait should be used only in cases where <code>===</code>/<code>is()</code> is too
strict. Equals is for cases in which the content of two variables
or data structures is the same/semantically equivalent.</p>
<h1 id="interface">Interface</h1>
<p><code>(value1: Any, value2: Any) =&gt; r: Boolean</code></p>
<h1 id="laws">Laws</h1>
<ul>
<li><code>Equals.invoke(a, b) &lt;=&gt; Equals.invoke(b, a)</code></li>
</ul>
<p>This law seems trivial at first, but one actually needs to take some
care to make this work: The trait resolves to the implementation for
the <strong>first argument</strong>!
So <code>Equals.invoke(a: Number, b: String)</code> and <code>Equals.invoke(a: String, b: Number)</code>
will actually resolve to two different implementations.
The easiest way to make this work is just to add a check <code>(a, b) =&gt; type(b) === Number</code>
to the implementation for number and adding an equivalent check in string.
If comparing across types is actually desired (and might return <code>true</code>),
I suggest using the same code for both implementations: Consider the following
contrive examples:</p>
<pre><code>Equals.impl(Number, (a, b) =&gt;
  type(b) === (String || type(b) === Number)
  &amp;&amp; a.toString() === b.toString());
Equals.impl(String, (a, b) =&gt;
  type(b) === (String || type(b) === Number)
  &amp;&amp; a.toString() === b.toString());
</code></pre><h1 id="specialization-notes">Specialization notes</h1>
<p>Extra implementations provided for Date, RegExp, URL and typed arrays.</p>
<p>Note that for sets: <code>eq(new Set([{}]), new Set([{}]))</code> does not hold true,
since in sets keys and values are the same thing and keys always follow <code>===</code>
semantics.</p>
</dd>
<dt><a href="#Size">Size</a></dt>
<dd><p>Trait to determine the size of a container.</p>
<p>Implemented at least for Object, String, Array, Map, Set.</p>
<h1 id="interface">Interface</h1>
<p>Invocation takes the form <code>(c: Container) =&gt; i: Integer</code></p>
<h1 id="laws">Laws</h1>
<ul>
<li><code>i &gt;= 0</code></li>
<li><code>i !== null &amp;&amp; i !== undefined</code>.</li>
<li>Must be efficient to execute. No IO, avoid bad algorithmic complexities.</li>
</ul>
</dd>
<dt><a href="#Shallowclone">Shallowclone</a></dt>
<dd><p>Shallowly clone an object.</p>
<h1 id="interface">Interface</h1>
<p><code>(x: TheValue) =&gt; r: TheValue</code></p>
<h1 id="laws">Laws</h1>
<ul>
<li><code>x !== r</code></li>
<li><code>get(r, k) === get(x, k)</code> for any k.</li>
</ul>
<h1 id="implementation-notes">Implementation Notes</h1>
<p>No-Op implementations are provided for read only primitive types.</p>
</dd>
<dt><a href="#Deepclone">Deepclone</a></dt>
<dd><p>Recursively clone an object.</p>
<h1 id="interface">Interface</h1>
<p><code>(x: TheValue) =&gt; r: TheValue</code></p>
<h1 id="laws">Laws</h1>
<ul>
<li><code>x !== r</code></li>
<li><code>x equals r</code> wehre eq is the equals() function.</li>
<li><code>get(r, k) !== get(x, k)</code> for any k.</li>
<li><code>has(r, k) implies has(x, k)</code> for any k.</li>
<li><code>get(r, k) equals get(x, k)</code> for any k wehre eq is the equals() function.</li>
<li>The above laws apply recursively for any children.</li>
</ul>
<h1 id="specialization-notes">Specialization Notes</h1>
<p>No implementation provided for set: In sets keys and values are the
same thing.
If we cloned sets deeply, <code>has(orig, key) implies has(clone, key)</code> would be violated
and the sets would not be equal after cloning.
For the same reason, Map keys are not cloned either!</p>
</dd>
<dt><a href="#Pairs">Pairs</a></dt>
<dd><p>Get an iterator over a container.</p>
<p>This is different from the <code>Sequence</code> trait in <code>sequence.js</code>
in that this always returns pairs, even for lists, sets, strings...</p>
<h1 id="interface">Interface</h1>
<p><code>(c: Container(k: Key, v: Value)) =&gt; r: Sequence([k: Key, v: Value], ...)</code>.</p>
<h1 id="specialization-notes">Specialization Notes</h1>
<p>Array like types return index =&gt; value, set returns value =&gt; value.</p>
</dd>
<dt><a href="#get">get</a></dt>
<dd><p>Given a key, get a value from a container.</p>
</dd>
<dt><a href="#Get">Get</a></dt>
<dd><p>Trait to get a value from a container like type.</p>
<p>Implemented for Object, String, Array, Map.</p>
<h1 id="interface">Interface</h1>
<p><code>(c: Container, k: Key) =&gt; v: Value|undefined</code>. Will return undefined
if the key could not be found.</p>
<h1 id="laws">Laws</h1>
<ul>
<li>Must not be implemented for set-like data structures</li>
</ul>
</dd>
<dt><a href="#has">has</a></dt>
<dd><p>Test if a container includes an entry with the given key</p>
</dd>
<dt><a href="#Has">Has</a></dt>
<dd><p>Test if a container holds an entry with the given key.</p>
<h1 id="interface">Interface</h1>
<p><code>(c: Container, k: Key) =&gt; b: Boolean</code>.</p>
<h1 id="laws">Laws</h1>
<ul>
<li>Must not be implemented for set-like data structures</li>
</ul>
</dd>
<dt><a href="#assign">assign</a></dt>
<dd><p>Set a value in a container.
Always returns the given value.</p>
</dd>
<dt><a href="#Assign">Assign</a></dt>
<dd><p>Trait to assign a value in a container like type.</p>
<p>Implemented for Object, String, Array, Map.</p>
<h1 id="interface">Interface</h1>
<p><code>(c: Container, v: Value, k: Key) =&gt; void</code>.</p>
<h1 id="laws">Laws</h1>
<ul>
<li>Must not be implemented for set-like data structures</li>
</ul>
<h1 id="specialization-notes">Specialization Notes</h1>
<p>No implementation provided for String since String is read only.</p>
</dd>
<dt><a href="#del">del</a></dt>
<dd><p>Delete an entry with the given key from a container</p>
</dd>
<dt><a href="#Delete">Delete</a></dt>
<dd><p>Test if a container holds an entry with the given key.</p>
<h1 id="interface">Interface</h1>
<p><code>(c: Container, k: Key) =&gt; Void</code>.</p>
<h1 id="laws">Laws</h1>
<ul>
<li>The value must actually be deleted, not set to <code>undefined</code> if possible.
Arrays become sparse if a value in their midst is deleted.</li>
</ul>
<h1 id="specialization-notes">Specialization Notes</h1>
<p>No implementation provided for String since String is read only.
No implementation for Array since has() disregards sparse slots in arrays
(so a delete op would be the same as assign(myArray, idx, undefined)) which
would be inconsistent.</p>
</dd>
<dt><a href="#setdefault">setdefault</a></dt>
<dd><p>Set a default value in a container.</p>
</dd>
<dt><a href="#Setdefault">Setdefault</a></dt>
<dd><p>Set a default value in a container.</p>
<p>This trait is implicitly implemented if the container implements Has, Get and Set.</p>
<h1 id="interface">Interface</h1>
<p><code>(c: Container, v: Value, k: Key) =&gt; r: Value</code>.</p>
</dd>
<dt><a href="#replace">replace</a></dt>
<dd><p>Swap out one value in a container for another</p>
</dd>
<dt><a href="#Replace">Replace</a></dt>
<dd><p>Swap out one value in a container for another.</p>
<p>This trait is implicitly implemented if the container implements Get and Set.</p>
<h1 id="interface">Interface</h1>
<p><code>(c: Container, v: Value, k: Key) =&gt; r: Value</code>.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#ResolveFn">ResolveFn(left, right)</a></dt>
<dd></dd>
<dt><a href="#getTestLogger">getTestLogger()</a> ⇒ <code>winston.Logger</code></dt>
<dd><p>Creates a test logger that logs to the console but also to an internal buffer. The contents of
the buffer can be retrieved with {@code Logger#getOutput()} which will flush also close the
logger. Each test logger will be registered with a unique category, so that there is no risk of
reusing a logger in between tests.</p>
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
<p>The given examples also adhere to the &#39;do not affect rendering&#39;
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
   the tag in question is inline. A tag is inline if it&#39;s computed
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
<p><pre> or differentiate between <span> and <div>. Instead the <code>display</code>
and <code>white-space</code> computed css properties are used to determine how
space should be compacted.</p>
<p>Since the computedStyle is used to determine how space compaction
should be applied, the function can deal with css affecting rendering
of white space: e.g. if <code>white-space</code> is set to <code>pre</code>, this will be
detected by this function just as if a <pre> element had been used.
The same is true for the <code>display</code> property.</p>
<p>The only requirement for this to work is that the CSS in question is
present in the dom tree.</p>
<p>So when JSDOM is used to provide the DOM, then the entire html document
should be loaded (not just fragments) and loading external stylesheets
should be enabled...</p>
</dd>
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
<dt><a href="#exec">exec()</a></dt>
<dd><p>Immediately execute the given function.
Mostly used as a way to open a scope.</p>
</dd>
<dt><a href="#identity">identity()</a></dt>
<dd><p>Just a function that returns it&#39;s argument!</p>
</dd>
<dt><a href="#pipe">pipe(val, ...fns)</a> ⇒ <code>Any</code></dt>
<dd><p>Pipeline a value through multiple function calls.</p>
<pre><code>console.log(pipe(
  4,
  (x) =&gt; x+2,
  (x) =&gt; x*3
));
// =&gt; 18
</code></pre></dd>
<dt><a href="#compose">compose(...fns)</a> ⇒ <code>function</code></dt>
<dd><p>Function composition.</p>
<pre><code>const fn = compose(
  (x) =&gt; x+2,
  (x) =&gt; x*3
);

console.log(fn(4)); // =&gt; 18
</code></pre></dd>
<dt><a href="#withFunctionName">withFunctionName(name, fn, Just)</a></dt>
<dd><p>Manually assign a name to a function.</p>
</dd>
<dt><a href="#curry">curry()</a></dt>
<dd><p>Autocurry a function!</p>
<p><a href="https://en.wikipedia.org/wiki/Currying">https://en.wikipedia.org/wiki/Currying</a></p>
<p>Any function that has a fixed number of parameters may be curried!
Curried parameters will be in reverse order. This is useful for
functional programming, because it allows us to use function parameters
in the suffix position when using no curring:</p>
<pre><code>const toNumber = (seq) =&gt; map(seq, n =&gt; Number(n));

// is the same as

const toNumber = map(n =&gt; Number(n))

// or even

const toNumber = map(Number);
</code></pre><p>Note how in the second version we specified the last parameter
first due to currying.</p>
<p>Reverse order only applies in separate invocations:</p>
<pre><code>const sum = (seq) =&gt; foldl(seq, 0, (a, b) =&gt; a+b);

// is the same as

const sum = foldl(0, (a, b) =&gt; a+b);

// or even

concat = sum = foldl(0, plus);
</code></pre><p>Note how in version two, we specify the parameters in order 2, 3, and then 1:</p>
<p><code>fn(a, b, c) &lt;=&gt; fn(c)(b)(a) &lt;=&gt; fn(b, c)(a)</code></p>
</dd>
<dt><a href="#not">not()</a></dt>
<dd><p>! as a function</p>
</dd>
<dt><a href="#iter">iter(obj)</a> ⇒ <code>Iterator</code></dt>
<dd><p>Turn any object into an iterator.
Takes objects that implement the iterator protocol.
Plain objects are treated as key-value stores and yield
a sequence of their key value bytes, represented as size-2 arrays.</p>
<p>Any value that is allowed as a parameter for this function shall be
considered to be a <code>Sequence</code> for the purpose of this file.
This term shall be distinguished from <code>Iterable</code> in that iterables
must implement the iterator protocol <code>iterable[Symbol.iterator]()</code>.</p>
</dd>
<dt><a href="#range">range(start, start)</a></dt>
<dd><p>Generates an iterator with the numeric range [start; end[
Includes start but not end.</p>
</dd>
<dt><a href="#range0">range0()</a></dt>
<dd><p>Like range(a, b) but always starts at 0</p>
</dd>
<dt><a href="#repeat">repeat()</a></dt>
<dd><p>Generates an infinite iterator of the given value.</p>
</dd>
<dt><a href="#next">next(seq)</a> ⇒ <code>Any</code></dt>
<dd><p>Extracts the next element from the iterator.
If the element is exhausted, IteratorEnded will be thrown</p>
</dd>
<dt><a href="#first">first()</a></dt>
<dd><p>Extract the first element from the sequence</p>
</dd>
<dt><a href="#second">second()</a></dt>
<dd><p>Extract the second element from the sequence</p>
</dd>
<dt><a href="#seqEq">seqEq()</a></dt>
<dd><p>Determine whether the items in two sequences are equal.</p>
</dd>
<dt><a href="#count">count()</a></dt>
<dd><p>Determine the number of elements in an iterator.
This will try using trySize(), but fall back to iterating
over the container and counting the elements this way if necessary.</p>
</dd>
<dt><a href="#list">list()</a></dt>
<dd><p>Turns any sequence into a list.
Shorthand for <code>Array.from(iter())</code>.
This is often utilized to cache a sequence so it can be
iterated over multiple times.</p>
</dd>
<dt><a href="#uniq">uniq()</a></dt>
<dd><p>Turns any sequence into a set.
Shorthand for new Set(iter()).
This often finds practical usage as a way of
removing duplicates elements from a sequence.</p>
</dd>
<dt><a href="#dict">dict()</a></dt>
<dd><p>Turns any sequence into an es6 map
This is particularly useful for constructing es7 maps from objects...</p>
</dd>
<dt><a href="#obj">obj()</a></dt>
<dd><p>Turns any sequence into an object</p>
</dd>
<dt><a href="#any">any()</a></dt>
<dd><p>Test whether any element in the given sequence is truthy.
Returns null if the list is empty.</p>
</dd>
<dt><a href="#all">all()</a></dt>
<dd><p>Test whether all elements in the given sequence are truthy
Returns true if the list is empty.</p>
</dd>
<dt><a href="#sum">sum()</a></dt>
<dd><p>Calculate the sum of a list of numbers.
Returns 0 is the list is empty.</p>
</dd>
<dt><a href="#product">product()</a></dt>
<dd><p>Calculate the product of a list of numbers.
Returns 1 is the list is empty.</p>
</dd>
<dt><a href="#reverse">reverse(seq)</a> ⇒ <code>Array</code></dt>
<dd><p>Reverse a given sequence</p>
</dd>
<dt><a href="#enumerate">enumerate(seq)</a> ⇒ <code>Iterator</code></dt>
<dd><p>Extend the given sequences with indexes:
Takes a sequence of values and generates
a sequence where each element is a pair [index, element];</p>
</dd>
<dt><a href="#takeDef">takeDef(seq)</a> ⇒ <code>Iterator</code></dt>
<dd><p>Cut of the given sequence at the first undefined or null value.</p>
</dd>
<dt><a href="#flat">flat(seq)</a></dt>
<dd><p>Flattens a sequence of sequences.</p>
<pre><code>into(flat([[1,2], [3,4]]), Array) # [1,2,3,4]
into(flat({foo: 42}), Array) # [&quot;foo&quot;, 42]
</code></pre></dd>
<dt><a href="#concat">concat()</a></dt>
<dd><p>Concatenate any number of sequences.
This is just a variadic alias for <code>flat()</code></p>
</dd>
<dt><a href="#zipLeast">zipLeast(seq)</a> ⇒ <code>Iterator</code></dt>
<dd><p>Zip multiple sequences.
Puts all the first values from sequences into one sublist;
all the second values, third values and so on.
If the sequences are of different length, the output sequence
will be the length of the <em>shortest</em> sequence and discard all
remaining from the longer sequences...</p>
</dd>
<dt><a href="#zip">zip(seq)</a> ⇒ <code>Iterator</code></dt>
<dd><p>Zip multiple sequences.
Puts all the first values from sequences into one sublist;
all the second values, third values and so on.
If the sequences are of different length, an error will be thrown.</p>
</dd>
<dt><a href="#union">union()</a></dt>
<dd><p>Combine multiple map/set like objects.</p>
<p>The return type is always the type of the first value.
Internally this just concatenates the values from all
parameters and then uses into to convert the values back
to the original type.</p>
<p><code>union({a: 42, b: 23}, new Map([[&#39;b&#39;, 99]]))</code> =&gt; <code>{a: 42, b: 99}</code>
<code>union(new Set(1,2,3,4), [4,6,99])</code> =&gt; <code>new Set([1,2,3,4,6,99])</code>AA</p>
<p>Takes any number of values to combine.</p>
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
</code></pre><p>The function basically just takes a string and then
strips the first &amp; last lines if they are empty.</p>
<p>In order to remove indentation, we determine the common
whitespace prefix length (number of space 0x20 characters
at the start of the line). This prefix is simply removed
from each line...</p>
</dd>
<dt><a href="#isdef">isdef()</a></dt>
<dd><p>Checks whether a value is defined.
This function considers all values that are not null
and not undefined to be defined</p>
</dd>
<dt><a href="#type">type()</a></dt>
<dd><p>Determine type of an object.
Like obj.constructor, but won&#39;t fail
for null/undefined and just returns the
value itself for those.
This is a useful feature for code that is supposed to be
null/undefined-safe since those need not be special cased.</p>
</dd>
<dt><a href="#typename">typename()</a></dt>
<dd><p>Given a type, determine it&#39;s name.
This is useful as a replacement for val.constructor.name,
since this can deal with null and undefined.</p>
</dd>
<dt><a href="#isPrimitive">isPrimitive()</a></dt>
<dd><p>Test if a value is primitive</p>
</dd>
<dt><a href="#typeIsImmutable">typeIsImmutable()</a></dt>
<dd><p>Test whether instance of a given type is immutable</p>
</dd>
<dt><a href="#isImmutable">isImmutable()</a></dt>
<dd><p>Test whether a given value is immutable</p>
</dd>
<dt><a href="#assertEquals">assertEquals()</a></dt>
<dd><p>Assert that <code>eq(actual, expected)</code></p>
</dd>
<dt><a href="#assertUneq">assertUneq()</a></dt>
<dd><p>Assert that <code>!eq(actual, expected)</code></p>
</dd>
<dt><a href="#size">size()</a></dt>
<dd><p>Determine the size of a container. Uses the Size trait</p>
</dd>
<dt><a href="#empty">empty()</a></dt>
<dd><p>Determine if a container is empty. Uses <code>size(x) === 0</code></p>
</dd>
<dt><a href="#shallowclone">shallowclone()</a></dt>
<dd><p>Shallowly clone an object</p>
</dd>
<dt><a href="#deepclone">deepclone()</a></dt>
<dd><p>Recursively clone an object</p>
</dd>
<dt><a href="#pairs">pairs()</a></dt>
<dd><p>Get an iterator over any container; always returns pairs [key, value]</p>
</dd>
<dt><a href="#keys">keys()</a></dt>
<dd><p>Get an iterator over the keys of a container. Uses <code>pairs(c)</code>.</p>
</dd>
<dt><a href="#values">values()</a></dt>
<dd><p>Get an iterator over the values of a container. Uses <code>pairs(c)</code>.</p>
</dd>
</dl>

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

<a name="HybridWeakMap"></a>

## HybridWeakMap
Drop-in replacement for WeakMap that can store primitives.

**Kind**: global class  
<a name="Trait"></a>

## Trait
Helper for implementing generic functions/protocols.

Want to see the code? Scroll down to `Show me the code`.

# Traits, an introduction: Very specific interfaces that let you choose your guarantees

This helps to implement a concept known as type classes in haskell,
traits in rust, protocols in elixir, protocols (like the iteration protocol)
in javascript.
This helper is not supposed to replace ES6 protocols, instead it is supposed
to expand on them and make them more powerfull.

Basically this allows you to declare an interface, similar to interfaces in
C++ or C# or Java. You declare the interface; anyone implementing this generic
interface (like the iterator protocol, or Size interface which can be used to
determine the size of a container) promises to obey the rules and the laws of
the interface.
This is much more specific than having a size() method for instance; size() is
just an name which might be reasonably used in multiple circumstances; e.g. one
might use the name size() for a container that can have a `null` size, or return
a tuple of two numbers because the size is two dimensional. Or it might require
io to return the size or be complex to compute (e.g. in a linked list).

A size() method may do a lot of things, the Size trait however has a highly specific
definition: It returns the size of a container, as a Number which must be greater than
zero and cannot be null. The size must be efficient to compute as well.

By using the Size trait, the developer providing an implementation specifically says
'I obey those rules'. There may even be a second trait called `Size` with it's own rules.
The trait class is written in a way so those two would not interfere.

## Traits do not provide type checks

Because we are in javascript, these guarantees are generally not enforced by the type system
and the dev providing an implementation is still responsible for writing extensive tests.

# Traits provide abstraction: Think about what you want to do, not how you want to do it

One specific feature traits provide is that they let you state what you want to do instead of how
to do it.
Need to determine the size of a container? Use `.length` for arrays and strings,
use `.size` for ES6 Maps and Sets and a for loop to determine the size of an object.
Or you could just use the Size trait and call `size(thing)` which works for all of these
types. This is one of the features traits provide; define an implementation for a trait
once and you no longer have to think about how to achieve a thing, just what to achieve.

# Show me the code

```
// Declaring a trait
const Size = new Trait('Size');

// Using it
const size = (what) => Size.invoke(what);
const empty = (what) => size(what) === 0;

// Providing implementations for own types
class MyType {
  [Size.sym]() {
    return 42;
  }
}

// Providing implementations for third party types
Size.impl(Array, (x) => x.length); // Method of type Array
Size.impl(String, (x) => x.length);
Size.impl(Map, (x) => x.size);
Size.impl(Set, (x) => x.size);

Size.impl(Object, (x) => { // Note that this won't apply to subclasses
  let cnt = 0;
  for (const _ in x) cnt++;
  return cnt;
});

// Note: The two following examples would be a bad idea in reality,
// they are just here toshow the mechanism
Size.implStatic(null, (_) => 0); // Static implementation (for a value and not a type)

// This implementation will be used if the underlying type/value
// implements the magnitude trait
Size.implDerived([Magnitued], ([magnitude], v) => magnitude(v));

// This will be called as a last resort, so this must be very fast!
// This example would implement the `size` trait for any even number.
// Note how we just return `undefined` for non even numbers
Size.implWildStatic(
   (x) => type(x) === Number && x % 2 == 0 ? (x => x) : undefined);

// test if an object is a dom node
const isNode = o =>
    typeof Node === "object"
       ? o instanceof Node
       : o && typeof o === "object"
           && typeof o.nodeType === "number"
           && typeof o.nodeName==="string";

// Last resort lookup for types. Implements Size for any dom nodes…
Size.implWild(
   (t) => isNodeType(t) ? ((elm) => elm.childElementCount) : undefined);


// Using all the implementations
size([1,2,3]) # => 3
size({foo: 42}) # => 1
size(new Set([1,2,3])) # => 3
size(new MyType()) # => 42
size(null) # => 0
size(document.body) # => 1
```

# Implementing traits for third party types

This is another feature that makes traits particularly useful! Java for instance
has interfaces, but the creator of a class/type must think of implementing a specific interface;
this is particularly problematic if the type is from a library; the interface must
either come from the standard library or from that particular library.

This usually is not very helpful; with traits this is not a problem at all.
Just use `MyTrait.impl` as in the example above.

# Subclassing the Trait class

You may subclass Trait and overwrite any of it's methods.

**Kind**: global class  

* [Trait](#Trait)
    * [new Trait(name, sym)](#new_Trait_new)
    * [.lookupValue(what)](#Trait+lookupValue) ⇒ <code>function</code> \| <code>falsy-value</code>
    * [.lookupType()](#Trait+lookupType)
    * [.invoke()](#Trait+invoke)
    * [.impl()](#Trait+impl)
    * [.implStatic()](#Trait+implStatic)
    * [.implDerived()](#Trait+implDerived)
    * [.implWild()](#Trait+implWild)
    * [.implWildStatic()](#Trait+implWildStatic)

<a name="new_Trait_new"></a>

### new Trait(name, sym)
Create a new Trait.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name of the trait |
| sym | <code>Symbol</code> \| <code>null</code> | Symbol associated with the trait; this symbol   will be available under `MyTrait.sym` for devs to implement their   interfaces with. This parameter is usually left empty; in this case a   new symbol is created for the trait. An example where the extra   parameter is used is the `Sequence` trait in `sequence.js`; this trait   is just a wrapper around the built in `Symbol.iterator` protocol, so   it's using it's symbol. |

<a name="Trait+lookupValue"></a>

### trait.lookupValue(what) ⇒ <code>function</code> \| <code>falsy-value</code>
Find the implementation of this trait for a specific value.
This is used by `.invoke()`, `.implements()` and `.valueImplements`.

It uses the following precedence by default:

- Implementations added with `implStatic`
- Implementations using the symbol in a method of a prototype
- Implementations added with `impl`
- Implementations added with `implDerived` in the order they where added
- Implementations added with `implWild` in the order…
- Implementations added with `implWildStatic` in the order…

This function can be used directly in order to avoid a double lookiup
of the implementation:

```
const impl = MyTrait.lookupValue(what);
if (impl) {
  impl(what, ...);
} else {
  ...
}
```

**Kind**: instance method of [<code>Trait</code>](#Trait)  
**Returns**: <code>function</code> \| <code>falsy-value</code> - The function that was found or nothing.
  Takes the same parameters as `.invoke(what, ...args)`, so if you are not
  using invoke, you must specify `what` twice; once in the `lookupValue` call, once
  in the invocation.  

| Param | Type | Description |
| --- | --- | --- |
| what | <code>Any</code> | The thing to find an implementation for |

<a name="Trait+lookupType"></a>

### trait.lookupType()
Lookup the implementation of this trait for a specific type.
Pretty much the same as lookupValue, just skips the value lookup steps…

**Kind**: instance method of [<code>Trait</code>](#Trait)  
<a name="Trait+invoke"></a>

### trait.invoke()
Invoke the implementation. See examples above.

**Kind**: instance method of [<code>Trait</code>](#Trait)  
<a name="Trait+impl"></a>

### trait.impl()
Implement this trait for a class as a 'method'. See examples above

**Kind**: instance method of [<code>Trait</code>](#Trait)  
<a name="Trait+implStatic"></a>

### trait.implStatic()
Implement this trait for a value/as a 'static method'. See examples above
Prefer impl() when possible since implementations using this function will
not show up in implements()/this.typeHasImpl().

**Kind**: instance method of [<code>Trait</code>](#Trait)  
<a name="Trait+implDerived"></a>

### trait.implDerived()
Implements a trait based on other traits

**Kind**: instance method of [<code>Trait</code>](#Trait)  
<a name="Trait+implWild"></a>

### trait.implWild()
Arbitrary code implementation of this trait for types. See examples above
Prefer implWild() when possible since implementations using this function will
not show up in implements()/this.typeHasImpl().

**Kind**: instance method of [<code>Trait</code>](#Trait)  
<a name="Trait+implWildStatic"></a>

### trait.implWildStatic()
Arbitrary code implementation of this trait for values. See examples above

**Kind**: instance method of [<code>Trait</code>](#Trait)  
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

<a name="and"></a>

## and
The && operator as a function

**Kind**: global constant  
<a name="or"></a>

## or
The|| operator as a function

**Kind**: global constant  
<a name="nand"></a>

## nand ⇒ <code>Boolean</code>
NAND as a function.

**Kind**: global constant  
<a name="nor"></a>

## nor ⇒ <code>Boolean</code>
NOR as a function.

**Kind**: global constant  
<a name="xor"></a>

## xor ⇒ <code>Boolean</code>
XOR as a function.

**Kind**: global constant  
<a name="xnor"></a>

## xnor ⇒ <code>Boolean</code>
XNOR as a function.

**Kind**: global constant  
<a name="is"></a>

## is
=== as a function

**Kind**: global constant  
<a name="aint"></a>

## aint
!== as a function

**Kind**: global constant  
<a name="plus"></a>

## plus
The + operator as a function

**Kind**: global constant  
<a name="mul"></a>

## mul
The * operator as a function

**Kind**: global constant  
<a name="Sequence"></a>

## Sequence
Trait for any iterable type.

Uses the `Symbol.iterator` Symbol, so this is implemented for any
type that implements the iterator protocol.

**Kind**: global constant  
<a name="extend"></a>

## extend ⇒ <code>Iterator</code>
Generate a sequence by repeatedly calling the same function on the
previous value.

This is often used in conjunction with takeDef or takeWhile to generate
a non-infinite sequence.

```
// Generate an infinite list of all positive integers
extend(0, x => x+1);
// Generate the range of integers [first; last[
const range = (first, last) =>
  takeUntilVal(extend(first, x => x+1), last);
```

**Kind**: global constant  

| Param | Type |
| --- | --- |
| init | <code>Any</code> | 
| fn | <code>function</code> | 

<a name="extend1"></a>

## extend1 ⇒ <code>Iterator</code>
Like extend(), but the resulting sequence does not contain
the initial element.

**Kind**: global constant  

| Param | Type |
| --- | --- |
| init | <code>Any</code> | 
| fn | <code>function</code> | 

<a name="flattenTree"></a>

## flattenTree ⇒ <code>Sequnece</code>
Flatten trees of any type into a sequence.

The given function basically has three jobs:

1. Decide whether a given value in a tree is a node or a leaf (or both)
2. Convert nodes into sequences so we can easily recurse into them
3. Extract values from leaves

If the given function does it's job correctly, visit will yield
a sequence with all the values from the tree.

The function must return a sequence of values! It is given the current
node as well as a callback that that takes a list of child nodes and flattens
the given subnodes.

Use the following return values:

```
flattenTree((node, recurse) => {
  if (isEmptyLeaf()) {
    return [];

  } else if (isLeaf(node)) {
    return [node.value];

  } else if (isMultiLeaf(node)) {
    return node.values;

  } else if (isNode(node)) {
    return recurse(node.childNodes);

  } else if (isLeafAndNode(node)) {
    return concat([node.value], recurse(node.childNodes));
  }
 }
});
```

**Kind**: global constant  
**Returns**: <code>Sequnece</code> - A sequence containing the actual values from the tree  

| Param | Type | Description |
| --- | --- | --- |
| val | <code>Any</code> | The tree to flatten |
| fn | <code>function</code> | The function that does the actual flattening |

<a name="nth"></a>

## nth
Extract the nth element from the sequence

**Kind**: global constant  
<a name="each"></a>

## each
Iterate over sequences: Apply the give function to
every element in the sequence

**Kind**: global constant  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |
| fn | <code>function</code> | Function taking a single parameter |

<a name="join"></a>

## join
Convert each element from a sequence into a string
and join them with the given separator.

**Kind**: global constant  
<a name="into"></a>

## into
Convert values into a given type using the `Into` trait.
Note that this has inverse parameters compared to the trait
(sequence first, type second) for currying purposes.

**Kind**: global constant  
<a name="Into"></a>

## Into
Into can be used to turn sequences back into other types.

into is the inverse of `iter()`, meaning that taking the result
of `iter()` and calling `into()`, yields the original value.

So in a purely functional language, `into(iter(v))` would be a
no-op; since we are in javascript, this essentially implements
a poor mans shallow copy for some types

```
const shallowcopy = (v) => into(v, v.constructor);
```

# Interface

`(T: Type/Function, v: Sequence) => r: T

# Laws

* `into(v, type(v)) <=> shallowclone(v)`

# Specialization notes

String: Uses toString() on each value from the sequence
  and concatenates them into one string...
Object: Expects key/value pairs; the keys must be strings;
  sequences containing the same key multiple times and sequences
  with bad key/value pairs are considered to be undefined behaviour.
  The key/value pairs may be sequences themselves.
Map: Same rules as for object.
Set: Refer to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

# Examples

Practical uses of into include converting between types; e.g:

```
into({foo:  42, bar: 23}, Map) # Map { 'foo' => 42, 'bar' }
into(["foo", " bar"], String) # "foo bar"
into([1,1,2,3,4,2], Set) # Set(1,2,3,4)
```

Into is also useful to transform values using the functions
in this class:

```
# Remove odd numbers from a set
const st = new Set([1,1,2,2,3,4,5]);
into(filter(st, n => n % 2 == 0), Set) # Set(2,4)

# Remove a key/value pair from an object
const obj = {foo: 42, bar: 5};
into(filter(obj, ([k, v]) => k !== 'foo'), Obj)
# yields {bar: 5}
```

It can be even used for more complex use cases:

```
# Merge multiple key/value containers into one sequence:
const seq = concat([[99, 42]], new Map(true, 23), {bar: 13});
into(seq, Map) # Map( 99 => 42, true => 23, bar => 13 )
```

**Kind**: global constant  
<a name="foldl"></a>

## foldl
Combine all the values from a sequence into one value.

This function is also often called reduce, because it reduces
multiple values into a single value.

Here are some common use cases of the foldl function:

```
const all = (seq) => foldl(seq, true, (a, b) => a && b);
const any = (seq) => foldl(seq, false, (a, b) => a || b);
const sum = (seq) => foldl(seq, 0, (a, b) => a + b);
const product = (seq) => foldl(seq, 1, (a, b) => a * b);
```

Notice the pattern: We basically take an operator and apply
it until the sequence is empty: sum([1,2,3,4]) is pretty much
equivalent to `1 + 2 + 3 + 4`.

(If you want to get very mathematical here...notice how we basically
have an operation and then just take the operation's neutral element
as the initial value?)

**Kind**: global constant  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | The sequence to reduce |
| Any | <code>initial</code> | The initial value of the reduce operation.   If the sequence is empty, this value will be returned. |

<a name="foldr"></a>

## foldr
Like foldl, but right-to-left

**Kind**: global constant  
<a name="map"></a>

## map ⇒ <code>Iterator</code>
Lazily transform all the values in a sequence.

```
into(map([1,2,3,4], n => n*2), Array) # [2,4,6,8]
```

**Kind**: global constant  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |
| fn | <code>function</code> | The function that transforms all the values in the sequence |

<a name="filter"></a>

## filter ⇒ <code>Iterator</code>
Remove values from the sequence based on the given condition.

```
filter(range(0,10), x => x%2 == 0) // [2,4,6,8]
```

**Kind**: global constant  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |
| fn | <code>function</code> | The function |

<a name="reject"></a>

## reject
Opposite of filter: Removes values from the sequence if the function
returns true.

**Kind**: global constant  
<a name="trySkip"></a>

## trySkip ⇒ <code>Iterator</code>
Like skip, but returns an exhausted iterator if the sequence contains
less than `no` elements instead of throwing IteratorEnded.

**Kind**: global constant  
**Params**: <code>Number</code> no The number of elements to skip  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |

<a name="skip"></a>

## skip ⇒ <code>Iterator</code>
Skip elements in a sequence.
Throws IteratorEnded if the sequence contains less than `no` elements.

**Kind**: global constant  
**Params**: <code>Number</code> no The number of elements to skip  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |

<a name="skipWhile"></a>

## skipWhile ⇒ <code>Iterator</code>
Skips elements in the given sequences until one is found
for which the predicate is false.

**Kind**: global constant  
**Returns**: <code>Iterator</code> - The first element for which pred returns false
  plus the rest of the sequence.  
**Params**: <code>Function</code> pred  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |

<a name="tryTake"></a>

## tryTake ⇒ <code>Iterator</code>
Yields an iterator of the first `no` elements in the given
sequence; the resulting iterator may contain less then `no`
elements if the input sequence was shorter than `no` elements.

**Kind**: global constant  
**Returns**: <code>Iterator</code> - The first element for which pred returns false
  plus the rest of the sequence.  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |
| no | <code>Number</code> | The number of elements to take |

<a name="take"></a>

## take ⇒ <code>Array</code>
Version of tryTake that will throw IteratorEnded
if the given iterable is too short.

**Kind**: global constant  
<a name="takeWhile"></a>

## takeWhile ⇒ <code>Iterator</code>
Cut off the sequence at the first point where the given condition is no
longer met.

`list(takeWhile([1,2,3,4,5,6...], x => x < 4))` yields `[1,2,3]`

**Kind**: global constant  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |
| fn | <code>function</code> | The predicate function |

<a name="takeUntilVal"></a>

## takeUntilVal ⇒ <code>Iterator</code>
Cut of the sequence at the point where the given value is
first encountered.

**Kind**: global constant  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |

<a name="prepend"></a>

## prepend
Given a sequence and a value, prepend the value to the sequence,
yielding a new iterator.

**Kind**: global constant  
<a name="append"></a>

## append
Given a sequence and a value, append the value to the sequence,
yielding a new iterator.

**Kind**: global constant  
<a name="mapSort"></a>

## mapSort ⇒ <code>Array</code>
Sort a sequence.
The given function must turn map each parameter to a string or
number. Objects will be sorted based on those numbers.A
If the given parameters are already numbers/strings, you may
just use identity as the mapping function.

**Kind**: global constant  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |
| fn | <code>function</code> |  |

<a name="zipLeast2"></a>

## zipLeast2
Curryable version of zipLeast

**Kind**: global constant  
<a name="zip2"></a>

## zip2
Curryable version of zip

**Kind**: global constant  
<a name="zipLongest"></a>

## zipLongest ⇒ <code>Iterator</code>
Zip multiple sequences.
Puts all the first values from sequences into one sublist;
all the second values, third values and so on...
If the sequences are of different length, the resulting iterator
will have the length of the longest sequence; the missing values
from the shorter sequences will be substituted with the given
fallback value.

**Kind**: global constant  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | A sequence of sequences |

<a name="zipLongest2"></a>

## zipLongest2
Curryable version of zipLongest

**Kind**: global constant  
<a name="slidingWindow"></a>

## slidingWindow ⇒ <code>Iterator</code>
Forms a sliding window on the underlying iterator.

`slidingWindow([1,2,3,4,5], 3)`
yields `[[1,2,3], [2,3,4], [3,4,5]]`

Will throw IteratorEnded if the sequence is shorter than
the given window.

**Kind**: global constant  
**Returns**: <code>Iterator</code> - Iterator of lists  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | A sequence of sequences |

<a name="trySlidingWindow"></a>

## trySlidingWindow
Like slidingWindow, but returns an empty sequence if the given
sequence is too short.

**Kind**: global constant  
<a name="lookahead"></a>

## lookahead
Almost like trySlidingWindow, but makes sure that
every element from the sequence gets it's own subarray,
even the last element. The arrays at the end are filled
with the filler value to make sure they have the correct
length.

```
lookahead([], 3, null) # => []
lookahead([42], 3, null) # => [[42, null, null, null]]
lookahead([42, 23], 3, null) # => [[42, 23, null, null], [23, null, null, null]]
lookahead([42, 23], 0, null) # => [[42], [23]]
```

Try sliding window would yield an empty array in each of the examples
above.

**Kind**: global constant  
<a name="mod"></a>

## mod ⇒ <code>Any</code>
Modify/Transform the given value.

Applys the given value to the given function; after the return
value is known, that return value is converted into the type
of the given parameter.

```
const s = new Set([1,2,3,4]);
const z = mod1(s, map(plus(1))); # => new Set([2,3,4,5]),
assert(z.constructor === Set)
```

**Kind**: global constant  
**Returns**: <code>Any</code> - same type as `v`  

| Param | Type | Description |
| --- | --- | --- |
| v | <code>Any</code> | The value to transform |
| Fn | <code>function</code> | The transformation function |

<a name="union2"></a>

## union2
Curryable version of union

**Kind**: global constant  
<a name="typedArrays"></a>

## typedArrays
List of all types that are typed arrays

**Kind**: global constant  
<a name="implements"></a>

## implements
Test if the given trait has been implemented for the given type

**Kind**: global constant  
<a name="valueImplements"></a>

## valueImplements
Test if the given trait has been implemented for the given value

**Kind**: global constant  
<a name="Immutable"></a>

## Immutable
This is a flag trait that indicates whether a type is immutable.

Since javascript has not real way to enforce absolute immutability
this trait considers anything immutable that is hard to mutate
or really not supposed to be mutated.
Function is considered immutable despite it being possible to assign
parameters to functions...

This is used in a couple paces; specifically it is used as a list of types
that should be left alone in `deepclone` and `shallowclone`.

**Kind**: global constant  
<a name="eq"></a>

## eq
Determine whether two values are equal using the Equals trait.

This function is a bit more powerful than than the Equals trait itself:
First of all it searches for a `Equals` implementation for both arguments
and it falls back to `===` if none is found.
For this reason using eq() is usually preferred over using the Equals trait directly.

**Kind**: global constant  
<a name="uneq"></a>

## uneq
Equivalent to `!eq(a, b)`

**Kind**: global constant  
<a name="Equals"></a>

## Equals
Trait to check whether two values are equal.

Normally this trait should not be used directly; consider using
`eq()` instead.

This trait should be used only in cases where `===`/`is()` is too
strict. Equals is for cases in which the content of two variables
or data structures is the same/semantically equivalent.

# Interface

`(value1: Any, value2: Any) => r: Boolean`

# Laws

* `Equals.invoke(a, b) <=> Equals.invoke(b, a)`

This law seems trivial at first, but one actually needs to take some
care to make this work: The trait resolves to the implementation for
the **first argument**!
So `Equals.invoke(a: Number, b: String)` and `Equals.invoke(a: String, b: Number)`
will actually resolve to two different implementations.
The easiest way to make this work is just to add a check `(a, b) => type(b) === Number`
to the implementation for number and adding an equivalent check in string.
If comparing across types is actually desired (and might return `true`),
I suggest using the same code for both implementations: Consider the following
contrive examples:

```
Equals.impl(Number, (a, b) =>
  type(b) === (String || type(b) === Number)
  && a.toString() === b.toString());
Equals.impl(String, (a, b) =>
  type(b) === (String || type(b) === Number)
  && a.toString() === b.toString());
```

# Specialization notes

Extra implementations provided for Date, RegExp, URL and typed arrays.

Note that for sets: `eq(new Set([{}]), new Set([{}]))` does not hold true,
since in sets keys and values are the same thing and keys always follow `===`
semantics.

**Kind**: global constant  
<a name="Size"></a>

## Size
Trait to determine the size of a container.

Implemented at least for Object, String, Array, Map, Set.

# Interface

Invocation takes the form `(c: Container) => i: Integer`

# Laws

- `i >= 0`
- `i !== null && i !== undefined`.
- Must be efficient to execute. No IO, avoid bad algorithmic complexities.

**Kind**: global constant  
<a name="Shallowclone"></a>

## Shallowclone
Shallowly clone an object.

# Interface

`(x: TheValue) => r: TheValue`

# Laws

- `x !== r`
- `get(r, k) === get(x, k)` for any k.

# Implementation Notes

No-Op implementations are provided for read only primitive types.

**Kind**: global constant  
<a name="Deepclone"></a>

## Deepclone
Recursively clone an object.

# Interface

`(x: TheValue) => r: TheValue`

# Laws

- `x !== r`
- `x equals r` wehre eq is the equals() function.
- `get(r, k) !== get(x, k)` for any k.
- `has(r, k) implies has(x, k)` for any k.
- `get(r, k) equals get(x, k)` for any k wehre eq is the equals() function.
- The above laws apply recursively for any children.

# Specialization Notes

No implementation provided for set: In sets keys and values are the
same thing.
If we cloned sets deeply, `has(orig, key) implies has(clone, key)` would be violated
and the sets would not be equal after cloning.
For the same reason, Map keys are not cloned either!

**Kind**: global constant  
<a name="Pairs"></a>

## Pairs
Get an iterator over a container.

This is different from the `Sequence` trait in `sequence.js`
in that this always returns pairs, even for lists, sets, strings...

# Interface

`(c: Container(k: Key, v: Value)) => r: Sequence([k: Key, v: Value], ...)`.

# Specialization Notes

Array like types return index => value, set returns value => value.

**Kind**: global constant  
<a name="get"></a>

## get
Given a key, get a value from a container.

**Kind**: global constant  
<a name="Get"></a>

## Get
Trait to get a value from a container like type.

Implemented for Object, String, Array, Map.

# Interface

`(c: Container, k: Key) => v: Value|undefined`. Will return undefined
if the key could not be found.

# Laws

- Must not be implemented for set-like data structures

**Kind**: global constant  
<a name="has"></a>

## has
Test if a container includes an entry with the given key

**Kind**: global constant  
<a name="Has"></a>

## Has
Test if a container holds an entry with the given key.

# Interface

`(c: Container, k: Key) => b: Boolean`.

# Laws

- Must not be implemented for set-like data structures

**Kind**: global constant  
<a name="assign"></a>

## assign
Set a value in a container.
Always returns the given value.

**Kind**: global constant  
<a name="Assign"></a>

## Assign
Trait to assign a value in a container like type.

Implemented for Object, String, Array, Map.

# Interface

`(c: Container, v: Value, k: Key) => void`.

# Laws

- Must not be implemented for set-like data structures

# Specialization Notes

No implementation provided for String since String is read only.

**Kind**: global constant  
<a name="del"></a>

## del
Delete an entry with the given key from a container

**Kind**: global constant  
<a name="Delete"></a>

## Delete
Test if a container holds an entry with the given key.

# Interface

`(c: Container, k: Key) => Void`.

# Laws

- The value must actually be deleted, not set to `undefined` if possible.
  Arrays become sparse if a value in their midst is deleted.

# Specialization Notes

No implementation provided for String since String is read only.
No implementation for Array since has() disregards sparse slots in arrays
(so a delete op would be the same as assign(myArray, idx, undefined)) which
would be inconsistent.

**Kind**: global constant  
<a name="setdefault"></a>

## setdefault
Set a default value in a container.

**Kind**: global constant  
<a name="Setdefault"></a>

## Setdefault
Set a default value in a container.

This trait is implicitly implemented if the container implements Has, Get and Set.

# Interface

`(c: Container, v: Value, k: Key) => r: Value`.

**Kind**: global constant  
<a name="replace"></a>

## replace
Swap out one value in a container for another

**Kind**: global constant  
<a name="Replace"></a>

## Replace
Swap out one value in a container for another.

This trait is implicitly implemented if the container implements Get and Set.

# Interface

`(c: Container, v: Value, k: Key) => r: Value`.

**Kind**: global constant  
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
<a name="exec"></a>

## exec()
Immediately execute the given function.
Mostly used as a way to open a scope.

**Kind**: global function  
<a name="identity"></a>

## identity()
Just a function that returns it's argument!

**Kind**: global function  
<a name="pipe"></a>

## pipe(val, ...fns) ⇒ <code>Any</code>
Pipeline a value through multiple function calls.

```
console.log(pipe(
  4,
  (x) => x+2,
  (x) => x*3
));
// => 18
```

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| val | <code>Any</code> | The value to pipe through the functions |
| ...fns | <code>function</code> | Multiple functions |

<a name="compose"></a>

## compose(...fns) ⇒ <code>function</code>
Function composition.

```
const fn = compose(
  (x) => x+2,
  (x) => x*3
);

console.log(fn(4)); // => 18
```

**Kind**: global function  
**Returns**: <code>function</code> - All the functions in the sequence composed into one  

| Param | Type | Description |
| --- | --- | --- |
| ...fns | <code>function</code> | Multiple functions |

<a name="withFunctionName"></a>

## withFunctionName(name, fn, Just)
Manually assign a name to a function.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | The new name of the function. |
| fn | <code>function</code> | The function to assign a name to |
| Just | <code>function</code> | returns `fn` again. |

<a name="curry"></a>

## curry()
Autocurry a function!

https://en.wikipedia.org/wiki/Currying

Any function that has a fixed number of parameters may be curried!
Curried parameters will be in reverse order. This is useful for
functional programming, because it allows us to use function parameters
in the suffix position when using no curring:

```
const toNumber = (seq) => map(seq, n => Number(n));

// is the same as

const toNumber = map(n => Number(n))

// or even

const toNumber = map(Number);
```

Note how in the second version we specified the last parameter
first due to currying.

Reverse order only applies in separate invocations:

```
const sum = (seq) => foldl(seq, 0, (a, b) => a+b);

// is the same as

const sum = foldl(0, (a, b) => a+b);

// or even

concat = sum = foldl(0, plus);
```

Note how in version two, we specify the parameters in order 2, 3, and then 1:

`fn(a, b, c) <=> fn(c)(b)(a) <=> fn(b, c)(a)`

**Kind**: global function  
<a name="not"></a>

## not()
! as a function

**Kind**: global function  
<a name="iter"></a>

## iter(obj) ⇒ <code>Iterator</code>
Turn any object into an iterator.
Takes objects that implement the iterator protocol.
Plain objects are treated as key-value stores and yield
a sequence of their key value bytes, represented as size-2 arrays.

Any value that is allowed as a parameter for this function shall be
considered to be a `Sequence` for the purpose of this file.
This term shall be distinguished from `Iterable` in that iterables
must implement the iterator protocol `iterable[Symbol.iterator]()`.

**Kind**: global function  

| Param | Type |
| --- | --- |
| obj | <code>Object</code> \| <code>Iterable</code> \| <code>Iterator</code> | 

<a name="range"></a>

## range(start, start)
Generates an iterator with the numeric range [start; end[
Includes start but not end.

**Kind**: global function  
**Retunrs**: <code>Iterator</code>  

| Param | Type |
| --- | --- |
| start | <code>Number</code> | 
| start | <code>Number</code> | 

<a name="range0"></a>

## range0()
Like range(a, b) but always starts at 0

**Kind**: global function  
<a name="repeat"></a>

## repeat()
Generates an infinite iterator of the given value.

**Kind**: global function  
<a name="next"></a>

## next(seq) ⇒ <code>Any</code>
Extracts the next element from the iterator.
If the element is exhausted, IteratorEnded will be thrown

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |

<a name="first"></a>

## first()
Extract the first element from the sequence

**Kind**: global function  
<a name="second"></a>

## second()
Extract the second element from the sequence

**Kind**: global function  
<a name="seqEq"></a>

## seqEq()
Determine whether the items in two sequences are equal.

**Kind**: global function  
<a name="count"></a>

## count()
Determine the number of elements in an iterator.
This will try using trySize(), but fall back to iterating
over the container and counting the elements this way if necessary.

**Kind**: global function  
<a name="list"></a>

## list()
Turns any sequence into a list.
Shorthand for `Array.from(iter())`.
This is often utilized to cache a sequence so it can be
iterated over multiple times.

**Kind**: global function  
<a name="uniq"></a>

## uniq()
Turns any sequence into a set.
Shorthand for new Set(iter()).
This often finds practical usage as a way of
removing duplicates elements from a sequence.

**Kind**: global function  
<a name="dict"></a>

## dict()
Turns any sequence into an es6 map
This is particularly useful for constructing es7 maps from objects...

**Kind**: global function  
<a name="obj"></a>

## obj()
Turns any sequence into an object

**Kind**: global function  
<a name="any"></a>

## any()
Test whether any element in the given sequence is truthy.
Returns null if the list is empty.

**Kind**: global function  
<a name="all"></a>

## all()
Test whether all elements in the given sequence are truthy
Returns true if the list is empty.

**Kind**: global function  
<a name="sum"></a>

## sum()
Calculate the sum of a list of numbers.
Returns 0 is the list is empty.

**Kind**: global function  
<a name="product"></a>

## product()
Calculate the product of a list of numbers.
Returns 1 is the list is empty.

**Kind**: global function  
<a name="reverse"></a>

## reverse(seq) ⇒ <code>Array</code>
Reverse a given sequence

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |

<a name="enumerate"></a>

## enumerate(seq) ⇒ <code>Iterator</code>
Extend the given sequences with indexes:
Takes a sequence of values and generates
a sequence where each element is a pair [index, element];

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |

<a name="takeDef"></a>

## takeDef(seq) ⇒ <code>Iterator</code>
Cut of the given sequence at the first undefined or null value.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | Any sequence for which iter() is defined |

<a name="flat"></a>

## flat(seq)
Flattens a sequence of sequences.

```
into(flat([[1,2], [3,4]]), Array) # [1,2,3,4]
into(flat({foo: 42}), Array) # ["foo", 42]
```

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| seq | <code>Sequence(Sequence)</code> | Any sequence for which iter() is defined |

<a name="concat"></a>

## concat()
Concatenate any number of sequences.
This is just a variadic alias for `flat()`

**Kind**: global function  
<a name="zipLeast"></a>

## zipLeast(seq) ⇒ <code>Iterator</code>
Zip multiple sequences.
Puts all the first values from sequences into one sublist;
all the second values, third values and so on.
If the sequences are of different length, the output sequence
will be the length of the *shortest* sequence and discard all
remaining from the longer sequences...

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | A sequence of sequences |

<a name="zip"></a>

## zip(seq) ⇒ <code>Iterator</code>
Zip multiple sequences.
Puts all the first values from sequences into one sublist;
all the second values, third values and so on.
If the sequences are of different length, an error will be thrown.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| seq | [<code>Sequence</code>](#Sequence) | A sequence of sequences |

<a name="union"></a>

## union()
Combine multiple map/set like objects.

The return type is always the type of the first value.
Internally this just concatenates the values from all
parameters and then uses into to convert the values back
to the original type.

`union({a: 42, b: 23}, new Map([['b', 99]]))` => `{a: 42, b: 99}`
`union(new Set(1,2,3,4), [4,6,99])` => `new Set([1,2,3,4,6,99])`AA

Takes any number of values to combine.

**Kind**: global function  
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
<a name="isdef"></a>

## isdef()
Checks whether a value is defined.
This function considers all values that are not null
and not undefined to be defined

**Kind**: global function  
<a name="type"></a>

## type()
Determine type of an object.
Like obj.constructor, but won't fail
for null/undefined and just returns the
value itself for those.
This is a useful feature for code that is supposed to be
null/undefined-safe since those need not be special cased.

**Kind**: global function  
<a name="typename"></a>

## typename()
Given a type, determine it's name.
This is useful as a replacement for val.constructor.name,
since this can deal with null and undefined.

**Kind**: global function  
<a name="isPrimitive"></a>

## isPrimitive()
Test if a value is primitive

**Kind**: global function  
<a name="typeIsImmutable"></a>

## typeIsImmutable()
Test whether instance of a given type is immutable

**Kind**: global function  
<a name="isImmutable"></a>

## isImmutable()
Test whether a given value is immutable

**Kind**: global function  
<a name="assertEquals"></a>

## assertEquals()
Assert that `eq(actual, expected)`

**Kind**: global function  
<a name="assertUneq"></a>

## assertUneq()
Assert that `!eq(actual, expected)`

**Kind**: global function  
<a name="size"></a>

## size()
Determine the size of a container. Uses the Size trait

**Kind**: global function  
<a name="empty"></a>

## empty()
Determine if a container is empty. Uses `size(x) === 0`

**Kind**: global function  
<a name="shallowclone"></a>

## shallowclone()
Shallowly clone an object

**Kind**: global function  
<a name="deepclone"></a>

## deepclone()
Recursively clone an object

**Kind**: global function  
<a name="pairs"></a>

## pairs()
Get an iterator over any container; always returns pairs [key, value]

**Kind**: global function  
<a name="keys"></a>

## keys()
Get an iterator over the keys of a container. Uses `pairs(c)`.

**Kind**: global function  
<a name="values"></a>

## values()
Get an iterator over the values of a container. Uses `pairs(c)`.

**Kind**: global function  
