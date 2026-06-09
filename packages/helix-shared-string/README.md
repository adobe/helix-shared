# Helix Shared - String

A collection of utility functions for string manipulation, including multiline string handling, filename sanitization, path processing, and edit distance calculation.

## Installation

```bash
npm install @adobe/helix-shared-string
```

## Usage

```js
import {
  multiline,
  splitByExtension,
  sanitizeName,
  sanitizePath,
  editDistance
} from '@adobe/helix-shared-string';
```

## Functions

### multiline(str)

Declares multiline strings with proper indentation handling. This function strips empty first and last lines, and removes common whitespace prefixes from all lines.

```js
const text = multiline(`
  Hello
  World
    Indented
  Back
`);
// Result: "Hello\nWorld\n  Indented\nBack"
```

The function automatically detects and removes the common indentation level, making it perfect for template strings in code.

### splitByExtension(name)

Splits a filename at the last dot, returning the base name and extension as a two-element array.

```js
splitByExtension('document.txt');
// Returns: ['document', 'txt']

splitByExtension('archive.tar.gz');
// Returns: ['archive.tar', 'gz']

splitByExtension('README');
// Returns: ['README', '']

splitByExtension('.gitignore');
// Returns: ['.gitignore', '']
```

### sanitizeName(name)

Sanitizes a string by:
- Converting to lowercase
- Normalizing all Unicode characters
- Replacing all non-alphanumeric characters with dashes
- Removing consecutive dashes
- Removing leading and trailing dashes

```js
sanitizeName('My Document');
// Returns: 'my-document'

sanitizeName('Föhren Smürd');
// Returns: 'fohren-smurd'

sanitizeName('.My 2. Document-');
// Returns: 'my-2-document'
```

### sanitizePath(filepath, opts)

Sanitizes a file path using the same rules as `sanitizeName`, but only affects the basename. The directory path and extension are preserved.

```js
sanitizePath('/Untitled Folder/My Document.docx');
// Returns: '/Untitled Folder/my-document.docx'

sanitizePath('Föhren Smürd.txt');
// Returns: 'fohren-smurd.txt'

sanitizePath('.My 2. Document!.docx');
// Returns: 'my-2-document.docx'
```

**Options:**

- `ignoreExtension` (boolean): If `true`, treats the entire filename as the basename without preserving any extension

```js
sanitizePath('.MyDocument', { ignoreExtension: true });
// Returns: 'mydocument'
```

### editDistance(s0, s1)

Computes the Levenshtein edit distance between two strings using a recursive algorithm. Returns the minimum number of single-character edits (insertions, deletions, or substitutions) required to transform one string into another.

```js
editDistance('foo', 'foo');
// Returns: 0

editDistance('foo', 'foo123');
// Returns: 3

editDistance('My Document', 'my-document');
// Returns: 3

editDistance('My 1. Document', 'my-1-document');
// Returns: 5
```

This function is optimized for relatively short strings like filenames and performs well even with moderately long inputs.
