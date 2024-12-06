/*
 * Copyright 2021 Adobe. All rights reserved.
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

import assert from 'assert';
import {
  multiline, editDistance, sanitizeName, sanitizePath, splitByExtension,
} from '../src/string.js';

describe('String tests', () => {
  it('multiline()', () => {
    const ck = (ref, str) => assert.strictEqual(multiline(str), ref);

    ck('', '');
    ck('Hello', 'Hello');
    ck('Hello', `
    Hello`);
    ck('Hello', `
      Hello`);
    ck('Hello\nWorld', `
      Hello
      World`);
    ck('Hello\nWorld', `
      Hello
      World
  `);
    ck('Hello\n  Foo\nWorld', `
      Hello
        Foo
      World
  `);
  });
});

describe('splitByExtension Tests', () => {
  it('extension split works for empty string', () => {
    assert.deepStrictEqual(['', ''], splitByExtension(''));
  });

  it('extension split works for string w/o extension', () => {
    assert.deepStrictEqual(['foo', ''], splitByExtension('foo'));
  });

  it('extension split works for string with extension', () => {
    assert.deepStrictEqual(['foo', 'txt'], splitByExtension('foo.txt'));
  });

  it('extension split works for string with dots and extension', () => {
    assert.deepStrictEqual(['foo.bar', 'txt'], splitByExtension('foo.bar.txt'));
  });

  it('extension split works for string ending with a dot', () => {
    assert.deepStrictEqual(['foo.', ''], splitByExtension('foo.'));
  });

  it('extension split works for string starting with a dot', () => {
    assert.deepStrictEqual(['.foo', ''], splitByExtension('.foo'));
  });
});

describe('sanitize Tests', () => {
  it('sanitize works for empty string', () => {
    assert.strictEqual(sanitizeName(''), '');
  });

  it('sanitize transform string to lower case', () => {
    assert.strictEqual(sanitizeName('MyDocument'), 'mydocument');
  });

  it('sanitize transforms non-alpha to dashes', () => {
    assert.strictEqual(sanitizeName('My 2. Document'), 'my-2-document');
  });

  it('sanitize removes leading dashes', () => {
    assert.strictEqual(sanitizeName('.My 2. Document'), 'my-2-document');
  });

  it('sanitize removes trailing dashes', () => {
    assert.strictEqual(sanitizeName('.My 2. Document-'), 'my-2-document');
  });

  it('sanitize normalizes unicode', () => {
    assert.strictEqual(sanitizeName('Föhren Smürd'), 'fohren-smurd');
  });
});

describe('editDistance Tests', () => {
  it('editDistances works for empty strings', () => {
    assert.strictEqual(0, editDistance('', ''));
  });

  it('editDistances works for equal strings', () => {
    assert.strictEqual(0, editDistance('foo', 'foo'));
  });

  it('editDistances works for appended characters', () => {
    assert.strictEqual(3, editDistance('foo', 'foo123'));
  });

  it('editDistances works for removed characters from the end', () => {
    assert.strictEqual(3, editDistance('foo123', 'foo'));
  });

  it('editDistances works for replaced characters', () => {
    assert.strictEqual(3, editDistance('My Document', 'my-document'));
  });

  it('editDistances works for more complicate replacements', () => {
    assert.strictEqual(5, editDistance('My 1. Document', 'my-1-document'));
  });

  it('editDistances works for more complicate replacements (2)', () => {
    assert.strictEqual(10, editDistance('my-1-document', 'My 1. Document.docx'));
  });

  it('editDistances is reasonably fast for long names)', () => {
    const t0 = Date.now();
    assert.strictEqual(66, editDistance(
      'my-1-document my-1-document my-1-document my-1-document my-1-document my-1-document my-1-document my-1-document my-1-document my-1-document my-1-document my-1-document ',
      'My 1. Document My 1. Document My 1. Document My 1. Document My 1. Document My 1. Document My 1. Document My 1. Document My 1. Document My 1. Document My 1. Document .docx',
    ));
    const t1 = Date.now();
    assert.ok(t1 - t0 < 100);
  });
});

describe('sanitizePath Tests', () => {
  it('sanitizePath works for empty string', () => {
    assert.strictEqual(sanitizePath(''), '');
  });

  it('sanitizePath transform string to lower case', () => {
    assert.strictEqual(sanitizePath('MyDocument'), 'mydocument');
  });

  it('sanitizePath can ignore extension', () => {
    assert.strictEqual(sanitizePath('.MyDocument', {
      ignoreExtension: true,
    }), 'mydocument');
  });

  it('sanitizePath works with dots in path and no extension', () => {
    assert.strictEqual(sanitizePath('/foo.bar/My Document'), '/foo.bar/my-document');
  });

  it('sanitizePath only transforms last path segment', () => {
    assert.strictEqual(sanitizePath('/Untitled Folder/MyDocument'), '/Untitled Folder/mydocument');
  });

  it('sanitizePath only transforms root segment', () => {
    assert.strictEqual(sanitizePath('/MyDocument'), '/mydocument');
  });

  it('sanitizePath transforms non-alpha to dashes', () => {
    assert.strictEqual(sanitizePath('My 2. Document.docx'), 'my-2-document.docx');
  });

  it('sanitizePath removes leading dashes', () => {
    assert.strictEqual(sanitizePath('.My 2. Document.docx'), 'my-2-document.docx');
  });

  it('sanitizePath removes trailing dashes', () => {
    assert.strictEqual(sanitizePath('.My 2. Document!.docx'), 'my-2-document.docx');
  });

  it('sanitizePath normalizes unicode', () => {
    assert.strictEqual(sanitizePath('Föhren Smürd'), 'fohren-smurd');
  });
});
