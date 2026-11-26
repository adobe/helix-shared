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
  editDistance,
  globToRegExp,
  isValidGlobRule,
  matchesGlob,
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

### Globs: globToRegExp(glob), isValidGlobRule(glob), matchesGlob(path, glob)

Path globbing without Node.js dependencies (e.g. usable in Cloudflare Workers).

| Syntax | Matches | Example |
|---|---|---|
| `*` | any characters except `/` | `/blog/*` matches `/blog/a`, not `/blog/a/b` |
| `**` | any characters, including `/` | `/blog/**` matches `/blog/a/b`, not `/blog` |
| `(/*)?` | nothing or one child segment | `/en(/*)?` matches `/en` and `/en/a` |
| `(/**)?` | nothing or any descendants | `/en(/**)?` matches `/en`, `/en/a` and `/en/a/b` |

- All other characters match literally (e.g. `.` only matches a dot).
- `/*` or `/**` segments directly following a `/**` are collapsed into it (`/a/**/*` is the same as `/a/**`).
- A glob can contain at most `MAX_GLOB_WILDCARDS` (2) wildcards, which keeps matching fast for long paths.
  Globs with more wildcards are invalid.
- `(/*)?` and `(/**)?` must be followed by `/` or the end of the glob (e.g. `/a(/*)?b` is invalid).

```js
globToRegExp('/en(/**)?');
// Returns: /^\/en(?:\/.*)?$/

globToRegExp('/*a*b*c');
// Returns: null (too many wildcards)

isValidGlobRule('**/blog/**');
// Returns: true

matchesGlob('/en', '/en(/**)?');
// Returns: true
```

`matchesGlob` compiles the glob on every call; use `globToRegExp` and reuse the regexp when matching many paths.

### Globs below folders: globMayMatchBelow(glob, folderPath), createBelowMatcher(glob)

Checks if a glob may match a folder or a path below it, i.e. if the folder path (ending with `/`) is a prefix
of some path matched by the glob. This is useful to decide if a folder should be visible in a listing.
Invalid globs never match.

```js
globMayMatchBelow('/jp/**', '/');
// Returns: true

globMayMatchBelow('/*/docs/*', '/jp/other/');
// Returns: false

const matcher = createBelowMatcher('/en(/*)?'); // `null` if the glob is invalid
matcher('/en/');
// Returns: true
matcher('/en/a/');
// Returns: false
```
