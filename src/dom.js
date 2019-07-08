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

/**
 * Generic library for programming with the HTML DOM.
 *
 * Provides implementations for Deepclone and Equals for dom nodes.
 */

// This file contains a lot of complex algorithms...
// Avoiding continue often would be tedious and slow
/* eslint-disable no-continue */
const assert = require('assert');
const {
  withFunctionName, exec, pipe, identity, Deepclone, deepclone, Equals, type,
  each, enumerate, reverse, takeUntilVal, extend1, uniq, mapSort, join, map, all,
} = require('ferrum');

/** Check whether the given type is the type of a dom node.  Note that, in
 * order to support various dom implementations, this function uses a heuristic
 * and there might be some false positives.
 */
const isNodeType = typ => typ && typ.prototype && pipe(
  ['nodeName', 'nodeValue', 'cloneNode', 'childNodes'],
  map(prop => prop in typ.prototype),
  all,
);

/*
 * Check whether the given type is the type of a dom node.
 * Note that, in order to support various dom implementations,
 * this function uses a heuristic and there might be some false
 * positives.
 */
const isNode = node => isNodeType(type(node));

/** Ensure that the given node is a domNode. Checks with isNode() */
const assertNode = (node) => {
  if (!isNode(node)) {
    throw TypeError(`${node.constructor} ${node} is not a DOM node`);
  }
};

/**
 * Determine the name of a node.
 * The result is always in lower case.
 */
const nodeName = (node) => {
  assertNode(node);
  return node.nodeName.toLowerCase();
};

/**
 * Retrieve all the parent nodes of a dom node.
 *
 * @param {DomNode} node
 * @returns {DomNode[]} All the ancestor dom nodes to the given
 *   dom node, starting with the most distant dom node.
 */
const ancestryNodes = (node) => {
  assertNode(node);
  return reverse(takeUntilVal(extend1(node, n => n.parentNode), null));
};

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
  // We need to assign to parameters in order to reset inlineTextNodes
  // without recursing unnecessarily
  /* eslint-disable no-param-reassign */

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

  assertNode(node);
  if (nodeName(node) === '#document') {
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
      const isText = nodeName(elm) === '#text';
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
        const prevParents = ancestryNodes(prev);
        const elmParents = ancestryNodes(elm);

        while (prevParents.length > 0 && elmParents.length > 0
               && prevParents[0].isSameNode(elmParents[0])) {
          prevParents.shift();
          elmParents.shift();
        }

        if (nodeName(prev) === '#text' && (prevParents.length === 0 || elm.contains(prev))) {
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
    if (nodeName(nod) === '#comment') {
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
    if (nodeName(child) === '#text') {
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

  if (node.className) {
    node.className = pipe(node.classList, uniq, mapSort(identity), join(' '));
  }

  return node;
};

/**
 * Test whether two nodes are equivalent.
 *
 * `equals()` over two dom nodes is an alias for this.
 *
 * Invokes equalizeNode() on both given elements before
 * invoking .isEqualNode.
 * This means the equivalence model described in `equalizeNode()`
 * is employed. Please refer to it's documentation to learn more
 * @param {DomNode} a
 * @param {DomNode} b
 * @returns {Boolean}
 */
const nodeIsEquivalent = (a, b) => {
  // Work around JSDOM crashing if we call getComputedStyle on a cloned a #document
  if (nodeName(a) !== nodeName(b)) {
    return false;
  } else if (nodeName(a) === '#document') {
    return nodeIsEquivalent(a.documentElement, b.documentElement);
  }
  return equalizeNode(deepclone(a)).isEqualNode(equalizeNode(deepclone(b)));
};

/**
 * Node equivalence testing with wildcard support.
 *
 * This is mostly like nodeIsEquivalent, except that the
 * pattern may contain wildcard nodes. Wildcard nodes are nodes
 * with the name `match:any`.
 *
 * Wildcards in the pattern will lazily (meaning non greedily)
 * match zero, one or many dom nodes in the given node to test.
 *
 * `<match:any></match:any>` matches anything
 *   ``
 *   `foo`
 *   `<div></div>`
 *
 * `<match:any></match:any>Hello<match:any></match:any>`
 *   matches any node that contains `Hello` as a child:
 *     `HelloHello`
 *     `Foo Hello Foo`
 *     `<div></div> Foo Hello`
 *   but not this example, because here hello is in a subnode.
 *     `<div>Hello</div>`
 *
 *  `<div class='xxx' id='Borg'><matches:any></matches:any>Foo</div>`
 *    matches:
 *      `<div class='xxx' id='Borg'>Foo</div>`
 *      `<div class='xxx' id='Borg'>Hello Foo</div>`
 *      `<div id='Borg' class='xxx'>borg Foo</div>`
 *    but not
 *      `Foo`
 *      `<div id='Borg' class='xxx'></div>`
 *
 * @param {DomNode} node
 * @param {DomNode} pattern
 * @returns {Boolean}
 */
const nodeMatches = exec(() => {
  // We need to assign to parameters in order to avoid tail recursion:
  /* eslint-disable no-param-reassign */

  const isText = n => n && nodeName(n) === '#text';
  const isWild = n => n && nodeName(n) === 'match:any';

  // We need to perform partial matching on text nodes, meaning we need
  // to split some nodes into two, but we want to avoid actually mutating
  // the dom tree.
  // For this reason, we use this class as a thin view on a substring of
  // a text node.
  class PartialTextNode {
    // This rule makes sense for classes in the basic sense ("data+methods").
    // This classes' purpose is to implement a generic interface; holding data
    // is just a secondary function
    /* eslint-disable class-methods-use-this */
    constructor(backer, off) {
      this.backer = backer;
      this.off = off;
    }

    get nodeValue() {
      return this.backer.nodeValue.slice(this.off);
    }

    get nodeName() {
      return '#text';
    }

    get childNodes() {
      return [];
    }

    get nextSibling() {
      return this.backer.nextSibling;
    }

    get nextTextSibling() {
      return new PartialTextNode(this.backer, this.off);
    }

    cloneNode() {
      // Not implemented, because in the context of nodeMatechs
      // clone node is just used to ensure the node being compared
      // is shallow and text nodes/virtual text nodes never contain children
      return this;
    }

    isEqualNode(otr) {
      return nodeName(otr) === '#text';
    }

    good() {
      return this.off !== -1;
    }
  }

  // This is the actual recursive dom node matching algorithm
  const recursiveMatch = (node, pattern) => {
    // The algorithm used in here is designed to be fully recursive;
    // unfortunately implementing this as a fully recursive algorithm
    // gives us in the worst case roughly a number of stack frames
    // O(n+m+k) where n is the
    // depth of the dom tree; m is the number of adjacent nodes and k is
    // the number of wildcards; (the actual stack frame complexity is a bit more complex)
    //
    // This is a problem, because most JS engines limit the number of stack frames
    // to a couple of thousand.
    // We assume that this is sufficient to cover the number of wildcards
    // and the depth of the node tree, but we may encounter doms with multiple
    // thousand sibling elements, so we might run into a stack overflow.
    //
    // To remedy this issue and reduce the worst case stack depths to roughly O(n+k)
    // manual tail recursion is implemented by using this while loop; we
    // recurse by just assigning to the function parameters and calling continue.
    while (true) {
      // We're at the end of both pattern and node! Successfully matched \o/
      if (!node && !pattern) {
        return true;
      }

      // Try matching the rest of the nodes without skipping stuff
      // due to the wild card
      if (isWild(pattern) && recursiveMatch(node, pattern.nextSibling)) {
        return true;
      }

      // Special case! We must attempt to partially match text nodes;
      // Wildcards can match text nodes partially
      if (isWild(pattern) && isText(node) && isText(pattern.nextSibling)) {
        const expect = pattern.nextSibling.nodeValue;
        const val = node.nodeValue;
        const fake = new PartialTextNode(node, val.indexOf(expect));

        // Try starting further matching from the section of text we found
        // to match the next text node
        if (fake.good() && recursiveMatch(fake, pattern.nextSibling)) {
          return true;
        // OK; so the first match inside the textNode of the expected pattern
        // did not work out, but maybe the pattern occurs multiple times?
        // Like with normal nodes we just keep going and see what happens if
        // we let the wildcard match increasingly large sections of the text node...
        } else if (fake.good() && recursiveMatch(fake.nextTextSibling, pattern.nextSibling)) {
          return true;
        }
      }

      // Got a wildcard but the rest of the pattern did not match if we include
      // the current node. Now as a fallback we just assume the wildcard is to
      // match the current node and we just keep going...
      if (isWild(pattern) && node) {
        node = node.nextSibling;
        continue;
      }

      // Special case! We have two text nodes; normally this is straightforward
      // except if the next pattern node is a wild card; in this case - again -
      // we must attempt partial matching.
      const successfulLookahead = true
        && isText(node) && isText(pattern) && isWild(pattern.nextSibling)
        && node.nodeValue.startsWith(pattern.nodeValue)
        && recursiveMatch(new PartialTextNode(node, pattern.nodeValue.length), pattern.nextSibling);
      if (successfulLookahead) {
        return true;
      }

      // Either pattern XOR node is at the end. Different length
      // means a mismatch!
      // XOR because we checked for the !node && !pattern case above
      if (!node || !pattern) {
        return false;
      // The current nodes are not equal. Terminate early.
      } else if (!node.cloneNode().isEqualNode(pattern.cloneNode())) {
        return false;
      // Compare all the child nodes!
      } else if (!recursiveMatch(node.childNodes[0], pattern.childNodes[0])) {
        return false;
      }

      // All right! Just advance to the next child node.
      node = node.nextSibling;
      pattern = pattern.nextSibling;
      continue;
    }
  };

  // The wrapper function; this is the entry point doing argument
  // checking and preprocessing our nodes for recursive matching
  const preprocess = (node, pattern) => {
    const nodeIsDoc = nodeName(node) === '#document';
    const patIsDoc = nodeName(pattern) === '#document';
    if (nodeIsDoc && patIsDoc) {
      return preprocess(node.documentElement, pattern.documentElement);
    } else if (nodeIsDoc || patIsDoc) {
      return false;
    } else {
      return recursiveMatch(
        equalizeNode(deepclone(node)),
        equalizeNode(deepclone(pattern)),
      );
    }
  };

  withFunctionName('nodeMatches', preprocess);
  preprocess.impl = {
    isText, isWild, PartialTextNode, recursiveMatch, preprocess,
  };

  return preprocess;
});

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

  assertNode(expected);
  assertNode(actual);
  if (nodeName(actual) !== nodeName(expected)) {
    fail(`Node names differ; expected '${expected.nodeName}', got '${actual.nodeName}'`);
  } else if (nodeName(actual) === '#document') {
    // We can not print the html on bare document elements
    // and work around JSDOM crashing if we call getComputedStyle on a cloned a #document
    assertEquivalentNode(actual.documentElement, expected.documentElement);
    return;
  }

  const a2 = equalizeNode(deepclone(actual));
  const e2 = equalizeNode(deepclone(expected));
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


// Provide traits for nodes
Deepclone.implWild(Typ => (isNodeType(Typ) ? (x => x.cloneNode(true)) : undefined));
Equals.implWild(Typ => (isNodeType(Typ) ? ((a, b) => nodeIsEquivalent(a, b)) : undefined));

module.exports = {
  isNode,
  isNodeType,
  assertNode,
  nodeName,
  ancestryNodes,
  equalizeNode,
  nodeIsEquivalent,
  nodeMatches,
  assertEquivalentNode,
};
