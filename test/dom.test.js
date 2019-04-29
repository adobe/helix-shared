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

/* eslint-env mocha */
/* eslint-disable max-len,array-callback-return,no-param-reassign */

const assert = require('assert');
const { JSDOM } = require('jsdom');
const { each } = require('../src/index.js').sequence;
const {
  ancestryNodes, equalizeNode,
  nodeIsEquivalent, assertEquivalentNode,
  isNode, assertNode, nodeName, nodeMatches,
} = require('../src/index.js').dom;

describe('isNode, assertNode, nodeName', () => {
  const doc = new JSDOM('<foo></foo><div></div>Hello<!-- Fnord -->').window.document;
  const nope = [undefined, null, 0, '', { nodeName: undefined }, { nodeName: 42 }];
  const yep = {
    '': { nodeName: '' },
    fnord: { nodeName: 'fnord' },
    '#document': doc,
    html: doc.documentElement,
    body: doc.body,
    foo: doc.body.childNodes[0],
    div: doc.body.childNodes[1],
    '#text': doc.body.childNodes[2],
    '#comment': doc.body.childNodes[3],
  };

  each(nope, (ex) => {
    assert(!isNode(ex));
    assert.throws(() => assertNode(ex), TypeError);
    assert.throws(() => nodeName(ex), TypeError);
  });
  each(yep, ([name, ex]) => {
    assert(isNode(ex));
    assertNode(ex);
    assert.strictEqual(nodeName(ex), name);
  });
});

describe('ancestryNodes', () => {
  const win = new JSDOM('<div><div><span><div><p>foo').window;
  const doc = win.document;
  const { body } = win.document;

  const children = [
    doc, doc.documentElement, body, body.firstChild,
    body.firstChild.firstChild,
    body.firstChild.firstChild.firstChild,
    body.firstChild.firstChild.firstChild.firstChild,
    body.firstChild.firstChild.firstChild.firstChild.firstChild,
  ];

  const ck = (element, expected) => {
    const parents = ancestryNodes(element);
    each(expected, (node) => {
      assert(node.isSameNode(parents.shift()));
    });
  };

  it('Determines parents', () => {
    ck(win.document.querySelectorAll('p')[0].firstChild, children);
    ck(win.document, []);
    ck(win.document.documentElement, []);
    ck(win.document.body, [doc, doc.documentElement]);
    ck(win.document.createElement('div'), []);
  });

  it('Rejects invalid inputs', () => {
    const dom = new JSDOM('');
    each([dom.window, dom, '', {}, 22, undefined, null, '<p></p>'], (v) => {
      assert.throws(() => ancestryNodes(v).next());
    });
  });
});

describe('equalizeNode()', () => {
  const ck = (msg, ...rest) => {
    const inputs = rest;
    const expected = rest.pop();
    each(inputs, (inp) => {
      it(msg, () => {
        const dom = new JSDOM(inp).window.document;
        equalizeNode(dom);
        assert.strictEqual(dom.body.innerHTML, expected);
      });
    });
  };

  ck('empty dom is noop', '', '');
  ck('empty dom containing space has space trimmed', '   \n  ', '');
  ck('removes comments',
    '<!-- Hello World -->',
    '');
  ck('normalizes class names',
    '<div class="foo bar"></div>',
    '<div class="bar foo"></div>');
  ck('normalizes spaces in class names',
    '<div class="foo  bar"></div>',
    '<div class="bar foo"></div>');
  ck('normalizes tabs in class names',
    '<div class="foo\tbar"></div>',
    '<div class="bar foo"></div>');
  ck('normalizes line breaks in class names',
    '<div class="foo\nbar"></div>',
    '<div class="bar foo"></div>');
  ck('normalizes duplicates in class names',
    '<div class="foo foo foo bar"></div>',
    '<div class="bar foo"></div>');
  ck('removes comments buried deep',
    '<div><span><div><!-- Hello World --></div></span></div>',
    '<div><span><div></div></span></div>');
  ck('space in text is collapsed',
    'Foo\n  \n \tBar',
    'Foo Bar');
  ck('text is trimmed',
    '   Foo\n  \n \tBar   ',
    'Foo Bar');
  ck('collapses whitespace inside elements',
    '<div>   foo <div>\n   bar <div\n> baz   \n bang',
    '<div>foo<div>bar<div>baz bang</div></div></div>');
  ck('preserves one collapsed space across inline elements (left)',
    '<div>   foo <b> hello  </b> </div>   ',
    '<div>foo<b> hello',
    '<div>foo <b>hello',
    '<div>foo<b>\nhello',
    '<div>foo\n<b>\nhello',
    '<div>foo\n<b>hello',
    '<div>foo\t<b>hello',
    '<div>foo\t<b>\thello',
    '<div>foo <b>hello</b></div>');
  ck('preserves one collapsed space across inline elements (right)', '<div>   <em> hello</em> foo ',
    '<div><em> hello </em>  foo',
    '<div> <em>hello\n</em> foo',
    '<div><em>\nhello</em>\nfoo',
    '<div>\n<em>\nhello\n</em>\nfoo',
    '<div>\n<em>hello</em>\tfoo',
    '<div>\t<em>hello\n</em> foo',
    '<div><em>hello</em> foo</div>');
  ck('preserves one collapsed space across inline elements (both)',
    '<div> foo   <span> hello</span> foo ',
    '<div> foo<span> hello </span>  foo',
    '<div> foo <span>hello\n</span> foo',
    '<div> foo<span>\nhello</span>\nfoo',
    '<div> foo\n<span>\nhello\n</span>\nfoo',
    '<div> foo\n<span>hello</span>\tfoo',
    '<div> foo\t<span>hello\n</span> foo',
    '<div>foo <span>hello</span> foo</div>');
  ck('preserves one collapsed space across inline elements (parent)',
    '<a>Hello \t\n </a>   \n   <span>  \n\t  world',
    '<a>Hello \t\n </a><span>  \n\t  world',
    '<a>Hello</a><span>  \n\t  world',
    '<a>Hello </a><span>world',
    '<a>Hello</a>  <span>world',
    '<a>Hello</a><span>  world',
    '<a>Hello</a><span>\nworld',
    '<a>Hello\n</a><span>\nworld',
    '<a>Hello</a> <span>world</span>');
  ck('preserves one collapsed space across inline elements (parent, unbalanced, nested)',
    '<a><span><b>foo</b>\n</span></a><b>hello</b>',
    '<a><span><b>foo</b></span></a> <b>hello</b>');
  ck('cuts space around block elements',
    ' foo \n<div></div> bar',
    'foo<div></div>bar');
  ck('leaves <pre> alone',
    ' foo <pre> \n \t   </pre> bar ',
    'foo<pre> \n \t   </pre>bar');
  ck('can deal with inline css',
    'foo <span style="display: block; white-space: pre;"> \n \t   </span> bar',
    'foo<span style="display: block; white-space: pre;"> \n \t   </span>bar');
  ck('can deal with external css',
    '<style>.foo { white-space: pre; }</style>'
     + '   <span class="foo">     hello world   </span> ',
    '<span class="foo">     hello world   </span>');
  ck('preserves collapsed space around inline pre',
    ' foo \n<pre style="display: inline"> \n \t   </pre>\tbar ',
    'foo <pre style="display: inline"> \n \t   </pre> bar');
  ck('preserves collapsed space inside non-pre inside pre',
    '   <pre><span style="white-space: normal">    \t hello \n</span></pre> \n',
    '<pre><span style="white-space: normal"> hello </span></pre>');
  ck('strips spaces between two divs',
    '<div> foo </div> \n <div> bar \n </div>',
    '<div>foo</div><div>bar</div>');
  ck('strips spaces after nested div',
    '<div>   <div> Hello World </div>    </div>',
    '<div><div>Hello World</div></div>');
  ck('strips spaces between inline elements inside div',
    '<div>  <a > foo </a><span>  \n<em> borg</em></span><b>  <em> baz </em>  </b> </div>',
    '<div><a>foo</a> <span><em>borg</em></span> <b><em>baz</em></b></div>');
  ck('allows empy inline element inside pre',
    '<pre> <span></span> </pre>',
    '<pre> <span></span> </pre>');
  ck('collapses spaces inside inline element inside pre',
    '<pre> <span>   \n </span> </pre>',
    '<pre> <span> </span> </pre>');
  // ck('collapses spaces between inline pre and text at the end of a div',
  //   '<div>foo</foo><div>   <pre style="display: inline"> hello</pre>  \n \n \t foo </div>',
  //   '<div>foo</foo><div><pre style="display: inline"> hello</a> foo</div>');

  const style = `
    <style>
      mypro {
        display: inline;
        white-space: pre;
      }
      mynom {
        display: inline;
        white-space: normal;
      }
    </style>`;

  const grandBody = `
    <div> Hello    World </div>
    <div> Hello
        World </div>
    <div> Hello    World </div>
    <div>
      <!-- Hello World -->
      <span     >Hello</span>
      world
      <div
      > xxx </div>
      <pre>   </pre>
      <a>you are my </a>
      <a> <span>


          sunshine</span> </a>

      <mypro> <!-- foo --> <mynom>
        <!-- Nomnomnom -->
        <!-- Nomnomnom -->
        Hello                       World
        <pre style="display: inline"> Fofofo <mynom>
          We are the borg
        </mynom> my dear </pre></mynom>fnord</mypro>
      foo
      <!-- Nomnomnom -->
      <!-- Nomnomnom -->
    </div>`;

  const grandResult = ''
    + '<div>Hello World</div>'
    + '<div>Hello World</div>'
    + '<div>Hello World</div>'
    + '<div>'
      + '<span>Hello</span> world'
      + '<div>xxx</div>'
      + '<pre>   </pre>'
      + '<a>you are my</a> <a><span>sunshine</span></a> <mypro>  '
        + '<mynom> Hello World '
          + '<pre style="display: inline"> Fofofo '
            + '<mynom> We are the borg </mynom> '
          + 'my dear '
        + '</pre>'
      + '</mynom>fnord</mypro> foo'
    + '</div>';

  ck('grand test with all features combined', `
      <head>${style}</head>
      <body>${grandBody}  ${grandBody} ${grandBody}  </body>  `,
  `${grandResult}${grandResult}${grandResult}`);

  it('Rejects invalid inputs', () => {
    const dom = new JSDOM('');
    each([dom.window, dom, '', {}, 22, undefined, null, '<p></p>'], (v) => {
      assert.throws(() => equalizeNode(v));
    });
  });
});

describe('dom equivalence nodeIsEquivalent(), assertEquivalentNode(), nodeMatches()', () => {
  const docA = new JSDOM('<p b="23" a=42  >Hello World</p>');
  const docB = new JSDOM(' <p a="42" b=23>Hello World</p>');
  const docC = new JSDOM('<body>\n<p a=42 b=23>Hello World</p></body>');
  const docD = new JSDOM('<html><head></head><body>   <p b=23\n a=42>Hello World</p></body>');

  const assertEq = (actual, expected) => {
    assertEquivalentNode(actual, expected);
    assert(nodeIsEquivalent(actual, expected));
    assert(nodeMatches(actual, expected));
  };
  const assertNEq = (actual, expected) => {
    assert.throws(() => assertEquivalentNode(actual, expected));
    assert(!nodeIsEquivalent(actual, expected));
    assert(!nodeMatches(actual, expected));
  };
  const assertThrows = (actual, expected) => {
    assert.throws(() => assertEquivalentNode(actual, expected));
    assert.throws(() => nodeIsEquivalent(actual, expected));
    assert.throws(() => nodeMatches(actual, expected));
  };

  it('Can compare empty documents', () => {
    assertEq(new JSDOM('').window.document, new JSDOM('').window.document);
    assertEq(new JSDOM('   ').window.document, new JSDOM('').window.document);
    assertEq(new JSDOM('   ').window.document, new JSDOM().window.document);
  });

  it('Can compare multiple string representations of the same dom', () => {
    each([docB, docC, docD], (v) => {
      assertEq(v.window.document, docA.window.document);
      assertEq(v.window.document.body, docA.window.document.body);
      assertEq(v.window.document.documentElement, docA.window.document.documentElement);
    });
  });

  it('Rejects unequal dom trees', () => {
    assertNEq(docA.window.document.documentElement, docA.window.document);
    assertNEq(docA.window.document.body, docA.window.document.documentElement);
    assertNEq(docA.window.document.body, docA.window.document);
  });

  it('Rejects objects that are not dom nodes', () => {
    each([docA.window, docB, '', {}, 22, undefined, null, '<p></p>'], (v) => {
      assertThrows(v, docA.window.document);
      assertThrows(docB.window.document, v);
      assertThrows(v, v);
    });
  });

  it('Compares whitespace in <pre></pre> elements', () => {
    const preA = new JSDOM('<pre></pre>');
    const preB = new JSDOM('<pre> </pre>');
    const preC = new JSDOM('<pre>\t</pre>');
    each([preB, preC], v => assertNEq(v.window.document, preA.window.document));

    // Firefox, JSDOM and Chromium consider <pre></pre>
    // to be equal <pre>\n<pre>
    const preD = new JSDOM('<pre>\n</pre>');
    assertEq(preA.window.document, preD.window.document);
  });
});

describe('nodeMatches()', () => {
  const ck = (node, pat) => {
    node = new JSDOM(`<body>${node}</body>`).window.document;
    pat = new JSDOM(`<body>${pat}</body>`).window.document;
    assert(nodeMatches(node, pat));
    assert(nodeMatches(node.documentElement, pat.documentElement));
    assert(nodeMatches(node.body, pat.body));
  };

  const ckNot = (node, pat) => {
    node = new JSDOM(`<body>${node}</body>`).window.document;
    pat = new JSDOM(`<body>${pat}</body>`).window.document;
    assert(!nodeMatches(node, pat));
    assert(!nodeMatches(node.documentElement, pat.documentElement));
    assert(!nodeMatches(node.body, pat.body));
  };

  const content = [
    '<p></p><div></div>', 'Foobar',
    'Xfoobar <!-- Foo --> <div></div> hello <p></p>',
  ];

  const wildcard = [
    '<match:any></match:any>'.repeat(2),
  ];

  const containers = [x => `<div>${x}</div>`];

  it('Supports multiple wildcards with text and normalized space', () => {
    ck('  Hello  World Foo  Bar',
      'Hello<match:any></match:any>\tWorld F'
       + '<match:any></match:any>oo<match:any></match:any><match:any></match:any>'
       + '\nBar<match:any></match:any>');
    ckNot('  Hello  World Foo  Bar',
      'Hello<match:any></match:any>\tWorld F'
       + '<match:any></match:any>oXo<match:any></match:any><match:any></match:any>'
       + '\nBar<match:any></match:any>');
  });

  it('Supports wildcard at root', () => {
    each(wildcard, (wild) => {
      ck('', wild);
      each(content, cont => ck(cont, wild));
    });
  });

  it('Supports wildcard at root plus content', () => {
    each(content, (extra) => {
      each(content, (cont) => {
        each(wildcard, (wild) => {
          ck(`${cont}${extra}`, `${wild}${extra}`);
          ck(`${extra}${cont}${extra}`, `${extra}${wild}${extra}`);
          if (!cont.startsWith(extra)) {
            ckNot(`${cont}`, `${extra}${wild}`);
          }
        });
      });
    });
  });

  it('Supports wildcard in node', () => {
    each(containers, (contain) => {
      each(wildcard, (wild) => {
        each(content, (cont) => {
          each(content, (extra) => {
            ck(contain(`${cont}${extra}`), contain(`${wild}${extra}`));
            ck(contain(`${extra}${cont}${extra}`), contain(`${extra}${wild}${extra}`));
            if (!cont.endsWith(extra)) {
              ckNot(contain(`${cont}`), contain(`${wild}${extra}`));
            }
          });
        });
      });
    });
  });
});
