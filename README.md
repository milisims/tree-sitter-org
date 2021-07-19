# tree-sitter-org

Org grammar for tree-sitter. It is not meant to implement emacs' orgmode
parser, but to implement a grammar that can usefully parse org files to be used
in neovim and any library that uses tree-sitter parsers.

## Overview

This section is meant to be a quick reference, not a thorough description.
Refer to the tests in `corpus` for examples.

- Top level node: `(document)`
- Document contains: `(directive)* (body)? (section)*`
- Section contains: `(headline) (plan)? (property_drawer)? (body)?`
- headline contains: (stars, title, tag?+)
- body contains: `(element)+`
- element contains: `(directive)* choose(paragraph, drawer, comment, footnote def, list, block, dynamic block, table)`
- paragraph contains: (textelement)+
- text element: choose(unmarked text, markup text, timestamps, footnotes, links, latex fragments)

Like in many regex systems, `*/+` is read as "0/1 or more", and `?` is 0 or 1.

## Example

``` org
#+TITLE: Example

Some *marked up* words

* TODO Title
<2020-06-07 Sun>

  - list a
  - [ ] list a
    - [ ] list b
    - [ ] list b
  - list a

** Subsection :tag:

Text
```

Parses as:
```
(document [0, 0] - [16, 0]
  (directive [0, 0] - [0, 16]
    name: (name [0, 2] - [0, 7])
    value: (value [0, 9] - [0, 16]))
  (body [2, 0] - [2, 22]
    (paragraph [2, 0] - [2, 22]
      (bold [2, 5] - [2, 16])))
  (section [4, 1] - [16, 0]
    (headline [4, 1] - [4, 12]
      (stars [4, 1] - [4, 1])
      (item [4, 2] - [4, 12]))
    plan: (plan [5, 0] - [5, 16]
      (timestamp [5, 0] - [5, 16]
        (date [5, 1] - [5, 15])))
    (body [7, 0] - [11, 10]
      (list [7, 0] - [11, 10]
        (listitem [7, 3] - [7, 10])
        (listitem [8, 3] - [10, 16]
          (list [9, 0] - [10, 16]
            (listitem [9, 5] - [9, 16])
            (listitem [10, 5] - [10, 16])))
        (listitem [11, 3] - [11, 10])))
    (section [13, 2] - [16, 0]
      (headline [13, 2] - [13, 19]
        (stars [13, 2] - [13, 2])
        (item [13, 3] - [13, 13])
        tags: (tag [13, 15] - [13, 18]))
      (body [15, 0] - [15, 4]
        (paragraph [15, 0] - [15, 4])))))
```

## Install

To compile the parser library for use in neovim & others:

`gcc -o org.so -I./src src/parser.c src/scanner.cc -shared -Os -lstdc++`


To build the parser using npm and run tests:

1. Install node.js as mentioned in the [tree-sitter documentation](https://tree-sitter.github.io/tree-sitter/creating-parsers#dependencies)
2. Clone this repository: `git clone https://github.com/milisims/tree-sitter-org` and `cd` into it
2. Install tree-sitter using npm: `npm install tree-sitter-cli`


## TODO

  - Use generic markup instead of types of markup
    For example: *a b c* should be `(markup type: *)`, where type is a field, instead of `(bold)` .
    Allows users to more clearly use markup as they see fit.
  - Fix textelements within list items
  - Fix other tests -- mostly dynamic priority issues with paragraphs
  - Add more fields where appropriate. Note: it's easy to query for a _missing_ field
