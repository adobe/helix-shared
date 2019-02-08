/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable no-param-reassign */

const assert = require('assert');
const {
  each, enumerate, all, map,
} = require('./sequence.js');

/**
 * Retrieve all the parent nodes of a dom node
 *
 * @param {DomNode} node
 * @returns {DomNode[]}
 */
function* parentNodes(node) {
  if (!node.nodeName) {
    throw new TypeError(`parentNodes expects a dom node, not ${node}`);
  }
  let parent = node.parentNode;
  while (parent !== null) {
    yield parent;
    parent = parent.parentNode;
  }
}

/**
 * Removes comments and redundant whitespace from dom trees
 * and moves meaningful white space to a standardized location.
 *
 * Adjacent text nodes are also merged, as https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize does.
 *
 * This function predominantly serves as a way to preprocess nodes
 * given to `nodeIsEquivalent`, so these nodes can be compared
 * using `isEqualNode` without insignificant whitespace changes standing
 * in the way of equivalence.
 *
 * `normalizeDomWhitespace` is supposed to turn equivalent dom treesturn equivalent dom trees
 * into equal dom trees.
 *
 * # Motivation
 *
 * The concept of equivalence is a bit fuzzy unfortunately. Some html
 * minifiers like kangax's html-minifier even leave whitespace alone
 * by default, because what transformations are permitted is so unclear.
 * Going by isEqualNode, any two dom trees just differentiated by their
 * whitespace content are unequal.
 *
 * This function's ultimate goal is to introduce an equivalence concept
 * which
 *
 * 1) closely matches the mental model developers would have
 * 2) does not affect rendering
 *
 * For instance, indenting dom nodes for improved readability should
 * usually not affect equivalence, neither should inserting newline
 * characters/replacing spaces with newlines because a line is growing
 * too long or because dom elements should be one per line.
 *
 * Whitespace in <pre> elements however should affect equivalence.
 *
 * The given examples also adhere to the 'do not affect rendering'
 * rules unless exotic javascript or CSS is added after the fact.
 *
 * # Precise semantics
 *
 * The following rules are used by this function:
 *
 * 1) Whitespace in <pre> tags and contained tags is left alone.
 *   In more precise terms, whitespace in any elements whose computed
 *   `white-space` style property starts with `pre` is left alone.
 * 2) Whitespace in other elements is compacted, meaning any combination
 *    of whitespace characters (newlines, spaces, tabs, etc) is replaced
 *    by a single space.
 * 3) Any whitespace before/after closing/opening tags is removed, unless
 *    the tag in question is inline. A tag is inline if it's computed
 *    style property `display` starts with `inline` or is set to `content`.
 *    This is the default behaviour for <span>.
 * 4) Whitespace next to opening/closing tags is also collapsed; all
 *    space between text nodes across a tree of purely inline elements are
 *    collapsed into a single space character. The space character is placed
 *    in the closest common ancestor, between the ancestors of both text nodes.
 *
 * Rule 3 and 4 are a bit verbose. Please take a look at the examples below.
 *
 * See also:
 * https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace_in_the_DOM
 * https://drafts.csswg.org/css-text-3/#propdef-white-space
 *
 * # Examples
 *
 * ` <div> </div> ` -> `<div></div>`
 *
 * Rule 3 - div is not inline:
 *
 * ` Hello <div> world </div> friend ` -> `Hello<div>world</div>friend`
 *
 * Rule 4 - span is inline:
 *
 * ` Hello <span> world </span> friend ` -> `Hello <span>world</span> friend`
 *
 * Rule 4 – the whitespace between multiple inline elements is placed
 * int the lowest common ancestor.
 *
 * `<a>Hello   </a> \n  <a>   World</a>` -> `<a>Hello</a> <a>World</a>`
 * `<a>Hello</a><a>   World</a>` -> `<a>Hello</a> <a>World</a>`
 * `<span><a>Hello</a></span><a>   World</a>` -> `<span><a>Hello</a></span> <a>World</a>`
 *
 * # CSS Handling
 *
 * Note that this function does not manually check for dom nodes like
 * <pre> or differentiate between <span> and <div>. Instead the `display`
 * and `white-space` computed css properties are used to determine how
 * space should be compacted.
 *
 * Since the computedStyle is used to determine how space compaction
 * should be applied, the function can deal with css affecting rendering
 * of white space: e.g. if `white-space` is set to `pre`, this will be
 * detected by this function just as if a <pre> element had been used.
 * The same is true for the `display` property.
 *
 * The only requirement for this to work is that the CSS in question is
 * present in the dom tree.
 *
 * So when JSDOM is used to provide the DOM, then the entire html document
 * should be loaded (not just fragments) and loading external stylesheets
 * should be enabled...
 *
 * @param {DomNode} node The node to equalize; this value will be mutated!
 * @returns {DomNode} The node parameter; the node parameter was mutated by this
 *   function; a reference to it is returned in order to facilitate function chaining.
 */
const equalizeNode = node => equalizeNode.impl(node);
equalizeNode.impl = (node, root = true, inlineTextNodes = []) => {
  // Motivation node: This function was introduced after a long search
  // for a decent html equivalence tester. Unfortunately no dom tree equivalence
  // tester, diff algorithm or minifier I could find on the internet had
  // whitespace collapsing support getting close to adhering to the actual
  // html5 space collapsing specification.
  // https://drafts.csswg.org/css-text-3/#propdef-white-space
  // This implementation is probably incomplete and there likely are a few
  // edge cases that are not handled properly.
  // Still this implementation gets much closer than most other attempts and
  // can serve as a better basis for improvement than manually rolled out string
  // comparisons or .isEqualNode calls.

  // private parameters:
  //  root: Whether we are currently in the actual node being processed
  //    or whether we are somewhere deeper in the recursion tree.
  //  inlineTextNodes: List of text nodes in the current block (inline scope).
  //    This may also contain dom elements; these are used as markers, that space
  //    next to these elements must be collapsed, but not erased.

  if (!node.nodeName) {
    throw new TypeError(`equalizeNode expects a dom node, not ${node}`);
  }

  if (node.nodeName === '#document') {
    return equalizeNode(node.documentElement);
  }

  // We use the computedStyle to decide how whitespace should be collapsed.
  // Doing this has the advantage that we can take into account not only
  // the type of dom element used, but also external CSS
  //
  // inline: Whether the element is inline scope. See the html spec https://www.w3.org/TR/CSS22/visuren.html#inline-box
  //   In simple terms, inline elements are those that form one text with their
  //   containing element. E.g. <a> and <em> and <span> and <b> are inline so their
  //   textNodes are layed out in one text block.
  //   <div> or <p> on the other hand open a new `block`/paragraph/separate text.
  //   Whether an element is inline is important for whitespace collapsing: Whitespace next to
  //   block elements must be completely discarded, because it is meaningless. Whitespace next
  //   to inline elements must be collapsed, but not entirely removed:
  //   `<b>Hello</b> World` and `<b>Hello </b>World` are the same thing, but transforming
  //   those examples to `<b>Hello</b>World` would render as `HelloWorld` which is not the
  //   desired effect.
  // preformatted: Whether all whitespace should be preserved within the document.
  //   This pretty much is <pre></pre> lifted to be a css property.
  const doc = node.ownerDocument;
  const win = doc.defaultView;
  if (win === undefined) {
    throw new Error(`Could not find window of ${node}; did you clone the document node?`);
  }

  const style = win.getComputedStyle(node);
  const inline = Boolean(style.display.match(/^(content|inline.*|)$/));
  const preformatted = Boolean(style['white-space'].match(/^pre.*/));

  // This is where the actual space collapsing happens
  const collapseTextAcrossInlineNodes = () => {
    let prev;
    let insertSpace = inline && preformatted;
    // We collected a list of all textNodes/pre formatted elements across inline elements
    // in the current box down below, now we can apply cross element
    // space collapsing
    each(enumerate(inlineTextNodes), ([idx, elm]) => {
      const next = inlineTextNodes[idx + 1];
      const isText = elm.nodeName === '#text';
      const val = isText ? elm.nodeValue : undefined;

      insertSpace = insertSpace || Boolean(isText && val.match(/^\s/));

      // Removal of text nodes consisting solely of white space
      if (isText && val.match(/^\s*$/)) {
        if (prev && next && prev.contains(elm) && prev.isSameNode(next)) {
          // Special case `<pre> foo <span> </span> foo </pre>`
          // elm is the text node inside the span.
          elm.nodeValue = ' ';
          insertSpace = false;
        } else {
          // Remove text nodes containing only space
          elm.parentNode.removeChild(elm);
        }
        return;
      }

      // This collapses space inside a single textNode..
      const insertSpaceNext = isText && val.match(/\s$/);
      if (isText) {
        elm.nodeValue = elm.nodeValue.trim().replace(/\s+/g, ' ');
      }

      // This is what applies our cross element collapsing
      // NOTE: An implementation just collapsing cross element
      // spaces to the right would be simpler and still correct
      // in terms of equivalence; it would also be much less
      // readable when inspected by humans; this is not very pretty:
      // `Hello <b>World</b>` -> `Hello<b> World</b>`
      // `<b>Hello</b> <em>World</em>` -> `<b>Hello</b><em> World</em>`
      if (insertSpace && prev !== undefined) {
        const prevParents = Array.from(parentNodes(prev)).reverse();
        const elmParents = Array.from(parentNodes(elm)).reverse();

        while (prevParents.length > 0 && elmParents.length > 0
               && prevParents[0].isSameNode(elmParents[0])) {
          prevParents.shift();
          elmParents.shift();
        }

        if (prev.nodeName === '#text' && (prevParents.length === 0 || elm.contains(prev))) {
          // Like in `Hello <b>World</b>` or in
          // `<pre><span style='white-space: normal'>hello </span></pre>`
          // (watch for the whitespace character)
          prev.nodeValue += ' ';
        } else if (isText && (elmParents.length === 0 || prev.contains(elm))) {
          // Like in `<b>Hello</b> World` or in
          // `<pre><span style='white-space: normal'> hello</span></pre>`
          elm.nodeValue = ` ${elm.nodeValue}`;
        } else if (elmParents.length > 0) {
          // Like in the `<b>Hello</b> <em>World</em>` case
          const before = elmParents[0];
          before.insertAdjacentHTML('beforebegin', ' ');
        } else {
          const after = prevParents[0];
          after.insertAdjacentHTML('afterend', ' ');
        }
      }

      prev = elm;
      insertSpace = insertSpaceNext;
    });

    // clear the array; we cannot just reassign the array
    // because we need to propagate the change to our parent
    // calls further up in the recursion chain
    inlineTextNodes.splice(0);
  };

  const removeComments = (nod) => {
    if (nod.nodeName === '#comment') {
      nod.parentNode.removeChild(nod);
    } else if (nod.nodeType === 1) {
      // We copy the child nodes object to achieve iterator
      // stability since we are deleting elements
      each(Array.from(nod.childNodes), removeComments);
    }
  };

  // normalize() is part of the DOM spec; it merges adjacent textNodes
  // before normalizing we remove all comments so they do not interfere
  // with adjacent text node merging.
  if (root) {
    removeComments(node);
    node.normalize();
  }

  if (!inline) {
    // This tag opens a new block scope!
    collapseTextAcrossInlineNodes();
  }

  if (inline && preformatted) {
    // Entering an inline preformatted node: We push the node
    // onto the list of textNodes as a marker to notify
    // the collapsing function that space around the preformatted
    // node must not be erased, but instead collapsed to one space
    // on BOTH sides of the node.
    // We assign a new list to inlineTextNodes; this allows us to
    // handle inline, non-preformatted elements inside a preformatted
    // elements in an isolated environment.
    inlineTextNodes.push(node);
    // We assign to inlineTextNodes, but the current list will still
    // be used up the recursion chain
    inlineTextNodes = [];
  }

  // We copy the child nodes object to achieve iterator
  // stability since we are deleting elements
  each(Array.from(node.childNodes), (child) => {
    if (child.nodeName === '#text') {
      if (!preformatted) {
        // Text nodes in preformatted scopes are left alone
        inlineTextNodes.push(child);
      }
    } else if (child.nodeType === 1) { // Unknown nodes (not text, comment or tag)
      equalizeNode.impl(child, false, inlineTextNodes);
    }
  });

  if (preformatted) {
    // Exiting a preformatted element, we still need to deal with
    // non-preformatted, inline elements inside the preformatted
    // elements. This is what we do here.
    // In this case we must collapse spaces at the end and the beginning
    // of the non-preformatted, inline elements instead of eliminating
    // those spaces altogether.
    //
    // Take this for example where the white space obviously has to be
    // preserved:
    // `<pre>Hello<span style='white-space:normal'> World </span>dear Kittens!</pre>`
    // This html should be rendered as `Hello World dear Kittens!`; removing
    // the spaces would render this as: `HelloWorlddear Kittens!`.
    //
    // In order to achieve space preservation, we enclose the inlineTextNodes
    // list at the beginning and the end with a reference to the current
    // node.
    inlineTextNodes.unshift(node);
    inlineTextNodes.push(node);
    collapseTextAcrossInlineNodes();
  }

  if (!inline || root) {
    // This tag closes a block scope!
    collapseTextAcrossInlineNodes();
  }

  return node;
};

/**
 * Test whether two nodes are equivalent.
 *
 * This
 *
 * Invokes equalizeNode() on both given elements before
 * invoking .isEqualNode.
 * This means the equivalence model described in `equalizeNode()`
 * is employed. Please refer to it's documentation to learn more
 */
const nodeIsEquivalent = (a, b) => {
  // Work around JSDOM crashing if we call getComputedStyle on a cloned a #document
  if (!a.nodeName) {
    throw new TypeError(`nodeIsEquivalent expects two dom nodes, not ${a}`);
  } else if (!b.nodeName) {
    throw new TypeError(`nodeIsEquivalent expects two dom nodes, not ${b}`);
  } else if (a.nodeName !== b.nodeName) {
    return false;
  } else if (a.nodeName === '#document') {
    return nodeIsEquivalent(a.documentElement, b.documentElement);
  }
  return equalizeNode(a.cloneNode(true)).isEqualNode(equalizeNode(b.cloneNode(true)));
};

/**
 * Assert that two dom nodes are equivalent.
 * The implementation mostly defers to .isEqualNode,
 * but provides better error messages.
 */
const assertEquivalentNode = (actual, expected) => {
  const fail = ({ message }) => {
    throw new assert.AssertionError({
      message,
      actual,
      expected,
      operator: 'nodeIsEquivalent',
      stackStartFn: assertEquivalentNode,
    });
  };

  if (!expected.nodeName) {
    fail('Expected value is not a dom node');
  } else if (!actual.nodeName) {
    fail('Actual value is not a dom node');
  } else if (actual.nodeName !== expected.nodeName) {
    fail(`Node names differ; expected '${expected.nodeName}', got '${actual.nodeName}'`);
  } else if (actual.nodeName === '#document') {
    // We can not print the html on bare document elements
    // and work around JSDOM crashing if we call getComputedStyle on a cloned a #document
    assertEquivalentNode(actual.documentElement, expected.documentElement);
    return;
  }

  const a2 = equalizeNode(actual.cloneNode(true));
  const e2 = equalizeNode(expected.cloneNode(true));
  if (!a2.isEqualNode(e2)) {
    throw new assert.AssertionError({
      message: 'The DOM nodes are not equal.',
      actual: a2.outerHTML,
      expected: e2.outerHTML,
      operator: 'nodeIsEquivalent',
      stackStartFn: assertEquivalentNode,
    });
  }
};

/**
 * Divides HTML into sections.
 * Section boundaries are (1) in top level section tags
 * and (2) at `<hr>` tags.
 *
 * It is suggested that the caller use the result of this
 * function in the following ways:
 *
 * 1. `sections(...).innerHTML` will give you the fully sectionized html
 *    as a string.
 * 2. `sections.children` will give you a list of all sections
 * 3. `sections.childNodes` will give you a list of all sections and extra
 *   comments/whitespace text nodes between sections; be careful when using
 *   this, as text & comment nodes do NOT support innerHTML or outerHTML.
 *   Instead nodeValue has to be used.
 *
 * # Section generating rules
 *
 * ## Simple case I: Empty documents
 *
 * These are documents without sections; they contain comments and white-space
 * text-nodes. These are emitted precisely as they where passed to sections()
 *
 * Note that in this case, the output may yield text-nodes and comment nodes
 * in the sections().childNodes property and sections().innerHTML. The sections.children
 * property will be empty in this case.
 *
 * Examples:
 *
 * `   `
 * `<!-- Foo -->`
 *
 * ## Simple case II: Sections delimited by `<hr/>`
 *
 * These are any documents that contain at least one visible element
 * or <hr/> tag and no <section> tags at the root level.
 * Empty sections at the start or the end of the document are stripped.
 *
 * Have some examples:
 *
 * `<hr/>` => ``
 * `Hello` => `<section>Hello</section>`
 * `Foo<hr>` => `<section>Foo</section>`
 * `<hr>Foo` => `<section>Foo</section>`
 * `Bar<hr>Foo` => `<section>Bar</section><section>Foo</section>`
 * `Bar<hr><hr>Foo` => `<section>Bar</section><section></section><section>Foo</section>`
 * `<!-- Foo -->Hello` => `<section><!-- Foo -->Hello</section>`
 * `<hr/><!-- Bar -->` => `<section></section><section><!-- Bar --></section>`
 *
 * ## Simple case III: Explicit sections with `<section>`
 *
 * These are documents in which there is only white space text nodes,
 * comment nodes and `<section>` tags in the root of the document.
 *
 * Running `sections()` on those documents is – again – no-op.
 *
 * As with case I, there may be comment nodes and text nodes in `sections().childNodes`,
 * so be careful.
 *
 * Examples:
 *
 * `<section></section>`
 * `  <section></section>`
 * `  <section></section>\n`
 * `  <section>Hello World</section>\n`
 * `  <section>Hello World</section>\n<!-- Foobar --> <section></section>`
 *
 * ## The hard case IV: Everything else
 *
 * Essentially there are two ways of denoting sections this function enables:
 *
 * 1. Using <hr/> tags and content at the root of the document
 * 2. Using explicit sections and no content at the root of the document.
 *
 * Mixing those two cases is problematic; specifically any content bordering an
 * an explicit `<section>` is an edge case.
 *
 * ```
 * <!-- This stuff is weird. -->
 *
 * <section>
 *  Proper section!
 * </section>
 *
 * <!-- This stuff is weird. -->
 *
 * <section>
 *  Proper section!
 * </section>
 *
 * <!-- This stuff is weird. -->
 * ```
 *
 * ```
 * <!-- This stuff is weird. -->
 *
 * <hr/>
 *
 * <!-- This stuff is weird. -->
 *
 * <section>
 *  Proper section!
 * </section>
 *
 * <!-- This stuff is weird. -->
 * <hr/>
 * <!-- This stuff is weird. -->
 *
 * <section>
 *  Proper section!
 * </section>
 *
 * <!-- This stuff is weird. -->
 *
 * <hr/>
 *
 * <!-- This stuff is weird. -->
 * ```
 *
 * ```
 * <!-- This stuff is weird. -->
 * <hr/>
 * Proper section!
 * <hr/>
 * <!-- This stuff is weird. -->
 *
 * <section>
 *  Proper section!
 * </section>
 *
 * <!-- This stuff is weird. -->
 * <hr/>
 * Proper section!
 * <hr/>
 * <!-- This stuff is weird. -->
 *
 *
 * <section>
 *  Proper section!
 * </section>
 *
 * <!-- This stuff is weird. -->
 *
 * <hr/>
 * Proper section!
 *
 * <hr/>
 * <!-- This stuff is weird. -->
 * ```
 *
 * The authors of this function use the following basic design decisions in dealing
 * with these edge cases:
 *
 * 1) There should be no visible content (stuff that is not whitespace
 *    text or comment nodes) outside of sections
 * 2) Mixing both ways of declaring sections should not result in superfluous empty sections.
 *
 * In order to follow both guidelines, the following rules are used:
 *
 * 1) Any visible or invisible content that borders on a section, the beginning
 *    or the end of the document is considered an implicit section.
 * 2) Implicit sections are wrapped into a `<section>` tag in the output if and only if
 *    they have visible content.
 * 3) Implicit sections that carry no visible content are merged into the top level element
 *
 *
 * Take an example:
 *
 * ```
 * <h1> This is the proper start of our document</h1>
 * <hr/>
 * <!-- Just some stuff -->
 *
 * <section>
 *   Our content is the great banana
 * </section>
 *
 * <!-- Just some stuff -->
 * <hr/>
 * <p> And this is the end</p>
 * ```
 *
 * would be emitted like this:
 *
 * ```
 * <section>
 *   <h1> This is the proper start of our document</h1>
 * </section>
 * <!-- Just some stuff -->
 * <section>
 *   Our content is the great banana
 * </section>
 * <!-- Just some stuff -->
 * <section>
 *   <p> And this is the end</p>
 * </section>
 * ```
 *
 * (Note that whitespace would be preserved as well; indentation
 * in the example above is only for demonstration purposes.)
 *
 * @param {DomNode} node The DOM node to divide into sections; note that this
 *   may be any document node or DOM tag; dom nodes without children (comments; text)
 *   are invalid input
 * @returns {DomNode} The node parameter; the node parameter was mutated by this
 *   Returns a body element containing section elements referencing
 *   the original elements. The body node is fully virtual (not rendered
 *   in a document); section nodes we just created are also fully virtual;
 *   section nodes that where present in the input and the contents of sections
 *   are references to the input dom tree.
 */
const sections = (node) => {
  if (!node.nodeName) {
    throw TypeError(`${node} is not a dom node`);
  } else if (node.nodeName === '#document') {
    return sections(node.body);
  } else if (node.nodeName === 'HTML') {
    return sections(node.querySelector('body'));
  } else if (node.nodeName.startsWith('#')) {
    throw TypeError(`Cannot divide ${node.nodeName} dom node into sections`);
  }

  let previosSectionIsTag = true;

  const doc = node.ownerDocument;
  const body = doc.createElement('body');
  let childstack = [];

  const isvoid = n => false
      || n.nodeName === '#comment'
      || (n.nodeName === '#text' && n.nodeValue.match(/^\s*$/));

  const mksection = (isImplicit) => {
    const stackisvoid = all(map(childstack, isvoid));
    const discard = isImplicit && stackisvoid;
    let targ = body;
    if (!discard) {
      targ = doc.createElement('section');
      body.appendChild(targ);
    }
    each(childstack, child => targ.appendChild(child.cloneNode(true)));
    childstack = [];
  };

  each(node.childNodes, (child) => {
    const name = child.nodeName.toLowerCase();
    if (name === 'hr') {
      mksection(previosSectionIsTag);
      previosSectionIsTag = false;
    } else if (name === 'section') {
      mksection(true);
      body.appendChild(child.cloneNode(true));
      previosSectionIsTag = true;
    } else {
      childstack.push(child);
    }
  });

  mksection(true);

  return body;
};

/**
 * Tries to determine the title of a dom node.
 *
 * The title is the content of the first <h1>..<h6> tag
 * in the tree.
 *
 * @param {DomNode} node The DOM node to determine the title of; note that this
 *   may be any document node or DOM tag; dom nodes without children (comments; text)
 *   are invalid input
 * @param {Any} fallback The value that will be supplied in case no title is found.
 *   If this value is undefined, an exception will be raised if no title is found.
 *   This value may specifically be of any type; this serves to facilitate use cases
 *   like supplying `null` as a value and determining an appropriate default value later.
 * @returns {String|Any} The title (always a string) or whatever was supplied as default.
 */
const findTitle = (node, fallback) => {
  if (!node.nodeName) {
    throw TypeError(`${node} is not a dom node`);
  } else if (node.nodeName === '#document') {
    return findTitle(node.body, fallback);
  } else if (node.nodeName.startsWith('#')) {
    throw TypeError(`Cannot determine the title of ${node.nodeName} dom node.`);
  }

  const elm = node.querySelector('h1, h2, h3, h4, h5, h6');

  if (elm) {
    // https://github.com/jsdom/jsdom/issues/1245
    // innerText is not supported by JSDOM...
    // This is why sadly we just do some manual stripping here...
    return elm.textContent.trim().replace(/\s+/g, ' ');
  } else if (fallback !== undefined) {
    return fallback;
  } else {
    throw ReferenceError('No title found in the dom node');
  }
};

module.exports = {
  parentNodes,
  equalizeNode,
  nodeIsEquivalent,
  assertEquivalentNode,
  sections,
  findTitle,
};
