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
/* eslint-disable max-len,array-callback-return */

const assert = require('assert');
const { JSDOM } = require('jsdom');
const { each, concat } = require('../src/index.js').sequence;
const {
  parentNodes, equalizeNode,
  nodeIsEquivalent, assertEquivalentNode,
  sections, findTitle,
} = require('../src/index.js').dom;

describe('parentNodes', () => {
  const win = new JSDOM('<div><div><span><div><p>foo').window;

  const children = [win.document.documentElement];
  let elm = win.document.body;
  while (elm && elm.nodeName !== '#text') {
    children.push(elm);
    elm = elm.firstChild;
  }

  const ck = (element, expected) => {
    // parentNodes() endswith expected.reverse()
    const parents = Array.from(parentNodes(element));
    each(expected.reverse(), (node) => {
      assert(node.isSameNode(parents.shift()));
    });
  };

  it('Determines parents', () => {
    ck(win.document.querySelectorAll('p')[0].firstChild, children);
    ck(win.document, []);
    ck(win.document.documentElement, []);
    ck(win.document.body, [win.document.documentElement]);
    ck(win.document.createElement('div'), []);
  });

  it('Rejects invalid inputs', () => {
    const dom = new JSDOM('');
    each([dom.window, dom, '', {}, 22, undefined, null, '<p></p>'], (v) => {
      assert.throws(() => parentNodes(v).next());
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

describe('dom equivalence nodeIsEquivalent(), assertEquivalentNode()', () => {
  const docA = new JSDOM('<p b="23" a=42  >Hello World</p>');
  const docB = new JSDOM(' <p a="42" b=23>Hello World</p>');
  const docC = new JSDOM('<body>\n<p a=42 b=23>Hello World</p></body>');
  const docD = new JSDOM('<html><head></head><body>   <p b=23\n a=42>Hello World</p></body>');

  const assertEq = (actual, expected) => {
    assertEquivalentNode(actual, expected);
    assert(nodeIsEquivalent(actual, expected));
  };
  const assertNEq = (actual, expected) => {
    assert.throws(() => assertEquivalentNode(actual, expected));
    assert(!nodeIsEquivalent(actual, expected));
  };
  const assertThrows = (actual, expected) => {
    assert.throws(() => assertEquivalentNode(actual, expected));
    assert.throws(() => nodeIsEquivalent(actual, expected));
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

describe('sections()', () => {
  const ck = (desc, inp, exp) => {
    it(`works for ${desc}`, () => {
      // Explicitly wrapping the given html string into <body> tags
      // in order to prevent jsdom from trimming trailing/leading space
      const { document } = new JSDOM(`<body>${inp}</body>`).window;
      assert.strictEqual(sections(document).innerHTML, exp);
      // Courtesy of very strict coverage checks making our code slower
      assert.strictEqual(sections(document.documentElement).innerHTML, exp);
    });
    it(`works for ${desc} in nested element`, () => {
      const span = new JSDOM(`<span>${inp}</span>`).window.document.querySelector('span');
      assert.strictEqual(sections(span).innerHTML, exp);
    });
  };

  const ckNop = (desc, inp) => ck(desc, inp, inp);

  assert.throws(() => sections({}));
  assert.throws(() => sections({ nodeName: '#' }));

  ckNop('empty doc', '');
  ckNop('empty doc w space', '    ');
  ckNop('empty doc w space', '   \n ');
  ckNop('empty doc w comment', '   <!-- Hello --> ');
  ckNop('empty doc w comment', '   <!-- Hello       -->\t ');

  ckNop('explicit single section', '<section></section>');
  ckNop('explicit single section w content',
    '<section>  Hello \n</section>');
  ckNop('explicit single section w content and gunk',
    '\n   <!-- foo --> <section>  Hello \n</section>  \n');
  ckNop('multiple explicit sections w content and gunk',
    '\n   <!-- foo --> <section>  Hello \n</section>  \n'
        + '\n   <!-- foo --> <section>  Hello \n</section>  \n');
  ckNop('multiple explicit sections w decoys',
    '\n   <!-- foo --> <section>  Hello \n</section>  \n'
        + '\n <section></section>  \n'
        + '\n   <!-- foo --> <section>  <hr>Fnord          </section>  \n'
        + '\n   <!-- foo --> <section>  Hello <section></section> \n</section>  \n');

  ck('single <hr> section',
    'Helo',
    '<section>Helo</section>');
  ck('single <hr> section w space',
    'Helo  ',
    '<section>Helo  </section>');
  ck('single <hr> section w comment',
    '\nHelo  <!-- foo -->',
    '<section>\nHelo  <!-- foo --></section>');
  ck('single <hr> section of tags',
    '<br>',
    '<section><br></section>');

  ck('single <hr> being stripped',
    '  <hr>\n',
    '  \n');
  ck('single <hr> being stripped completely empty',
    '<hr>',
    '');
  ck('empty section stripped at start',
    '  <hr> foo \n',
    '  <section> foo \n</section>');
  ck('empty section stripped at end',
    'foo \n<hr> \n',
    '<section>foo \n</section> \n');
  ck('empty section stripped at start and at end',
    ' foo \n<hr> \n',
    '<section> foo \n</section> \n');
  ck('empty section stripped at start and at end',
    ' \n<hr><hr> \t',
    ' \n<section></section> \t');
  ck('empty section stripped at start and at end with content',
    ' \n<hr>foo \n<hr> \t',
    ' \n<section>foo \n</section> \t');
  ck('three <hr> delimited sections; two implicit',
    ' x\n<hr>foo \n<hr> \tk',
    '<section> x\n</section><section>foo \n</section><section> \tk</section>');
  ck('four <hr> delimited sections; two implicit',
    ' x\n<hr>foo \n<hr><hr> \tk',
    '<section> x\n</section><section>foo \n</section><section></section><section> \tk</section>');

  ck('visible implicit section at start',
    'Hello\n  <section> </section>',
    '<section>Hello\n  </section><section> </section>');
  ckNop('invisible implicit section at start',
    '  <section> </section>');

  ck('visible implicit section at end',
    '<section> </section>\t world',
    '<section> </section><section>\t world</section>');
  ckNop('invisible implicit section at end',
    '<section> </section>\t ');

  ck('visible implicit section between explicit sections',
    '<section> </section>\t world<section></section>',
    '<section> </section><section>\t world</section><section></section>');
  ckNop('invisible implicit section between explicit sections',
    '<section> </section>\t<section></section>');

  ck('implicit sections due to hr between explicit sections v/v',
    '<section> </section> Foo <hr> bar   <section></section>',
    '<section> </section><section> Foo </section><section> bar   </section><section></section>');
  ck('implicit sections due to hr between explicit sections _/v',
    '<section> </section> <!-- borg --><hr> bar   <section></section>',
    '<section> </section> <!-- borg --><section> bar   </section><section></section>');
  ck('implicit sections due to hr between explicit sections v/_',
    '<section> </section> xx<hr><!-- borg --><section></section>',
    '<section> </section><section> xx</section><!-- borg --><section></section>');
  ck('implicit sections due to hr between explicit sections _/_',
    '<section> </section> <hr><!-- borg --><section></section>',
    '<section> </section> <!-- borg --><section></section>');

  ck('implicit <hr> based implicit section between start and explicit _/_',
    '\t<hr>\n<section></section>',
    '\t\n<section></section>');
  ck('implicit <hr> based implicit section between start and explicit v/_',
    '\tfo<hr>\n<section></section>',
    '<section>\tfo</section>\n<section></section>');
  ck('implicit <hr> based implicit section between start and explicit _/v',
    '\t<hr>\n bar <section></section>',
    '\t<section>\n bar </section><section></section>');
  ck('implicit <hr> based implicit section between start and explicit v/v',
    'x\t<hr>\n bar <section></section>',
    '<section>x\t</section><section>\n bar </section><section></section>');

  ck('implicit <hr> based implicit section between end and explicit _/_',
    '<section>xx </section>\t<hr>\n',
    '<section>xx </section>\t\n');
  ck('implicit <hr> based implicit section between end and explicit v/_',
    '<section>xx </section>\tfo<hr>\n',
    '<section>xx </section><section>\tfo</section>\n');
  ck('implicit <hr> based implicit section between end and explicit _/v',
    '<section>xx </section>\t<hr>\n bar ',
    '<section>xx </section>\t<section>\n bar </section>');
  ck('implicit <hr> based implicit section between end and explicit v/v',
    '<section>xx </section>x\t<hr>\n bar ',
    '<section>xx </section><section>x\t</section><section>\n bar </section>');

  ck('implicit sections due to hr between explicit sections with extra hr in between v/v',
    '<section> </section> Foo <hr><hr> bar   <section></section>',
    '<section> </section><section> Foo </section><section></section><section> bar   </section><section></section>');
  ck('implicit sections due to hr between explicit sections with extra hr in between _/v',
    '<section> </section> <!-- borg --><hr> <hr> bar   <section></section>',
    '<section> </section> <!-- borg --><section> </section><section> bar   </section><section></section>');
  ck('implicit sections due to hr between explicit sections with extra hr in between v/_',
    '<section> </section> xx<hr>\n<hr><!-- borg --><section></section>',
    '<section> </section><section> xx</section><section>\n</section><!-- borg --><section></section>');
  ck('implicit sections due to hr between explicit sections with extra hr in between _/_',
    '<section> </section> <hr>\t<hr><!-- borg --><section></section>',
    '<section> </section> <section>\t</section><!-- borg --><section></section>');
});

describe('findTitle()', () => {
  const ck = (html, expected, selectors = [], action = 'Finds') => {
    const doc = new JSDOM(html).window.document;

    it(`${action} the value in the document`, () => {
      assert.equal(findTitle(doc, null), expected);
    });

    each(concat(['html', 'body'], selectors), (sel) => {
      it(`${action} the value in '${sel}'`, () => {
        assert.equal(findTitle(doc.querySelector(sel), null), expected);
      });
    });

    return doc;
  };

  const ckMissing = (html, selectors = []) => {
    const doc = ck(html, null, selectors, 'Returns default if it cannot find');

    it('Throws if it cannot find the value in the document', () => {
      assert.throws(() => findTitle(doc));
    });

    each(concat(['html', 'body'], selectors), (sel) => {
      it(`Throws if it cannot find the value in '${sel}'`, () => {
        assert.throws(() => findTitle(doc.querySelector(sel)));
      });
    });
  };

  assert.throws(() => findTitle({}));
  assert.throws(() => findTitle({ nodeName: '#' }));

  ck('<h6>', '');
  ck('<h1>Hello', 'Hello');
  ck('<h1>  Hello', 'Hello');
  ck('<h1>  Hello\n', 'Hello');
  ck('<h2>Hello', 'Hello');
  ck('<h3>Hello', 'Hello');
  ck('<h4>Hello', 'Hello');
  ck('<h5>Hello', 'Hello');
  ck('<h6>Hello', 'Hello');
  ck('<h6>Hello</h6><h1>World', 'Hello');
  ck('<div><h6>Hello</h6><h1>World', 'Hello', ['div']);
  ck('<em><h6>Hello</h6><h1>World</h1></em>', 'Hello', ['em']);
  ck('<span><h6>Hello</h6><h1>World', 'Hello', ['span']);
  ck('<span><pre><h6>Hello</h6><p><h1>World', 'Hello', ['span', 'pre']);
  ck('<span><pre><h6></h6><p><h1>World', '', ['span', 'pre']);

  ckMissing('');
  ckMissing('foo');
  ckMissing('<h7>foo');
  ckMissing('<h>foo');
  ckMissing('<header>foo');

  // Here are the more complex examples including
  // whitespace stripping and subtag stripping
  ck('<h3>  Hello </h3>', 'Hello');
  ck('<h3> \n Hello </h3>', 'Hello');
  ck('<h3> \n Hello <b></b>  </h3>', 'Hello');
  ck('<h3> \n Hello <b></b> <em>Foo</em> </h3>', 'Hello Foo');
});
