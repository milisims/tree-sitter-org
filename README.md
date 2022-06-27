# tree-sitter-org

Org grammar for tree-sitter. Here, the goal is to implement a grammar that can
usefully parse org files to be used in any library that uses tree-sitter
parsers. It is not meant to implement emacs' orgmode parser exactly, which is
inherently more dynamic than tree-sitter easily allows.

## Overview

This section is meant to be a quick reference, not a thorough description.
Refer to the tests in `corpus` for examples.

- Top level node: `(document)`
- Document contains: `(directive)* (body)? (section)*`
- Section contains: `(headline) (plan)? (property_drawer)? (body)?`
- headline contains: `((stars), (item)?, (tag_list)?)`
- body contains: `(element)+`
- element contains: `(directive)* choose(paragraph, drawer, comment, footnote def, list, block, dynamic block, table)` or a bare `(directive)`
- paragraph contains: `(expr)+`
- expr contains: anonymous nodes for 'str', 'num', 'sym', and any ascii symbol that is not letters or numbers. (See top of grammar.js and queries for details)

Like in many regex systems, `*/+` is read as "0/1 or more", and `?` is 0 or 1.

## Example

``` org
#+TITLE: Example

Some *marked up* words

* TODO Title
<2020-06-07 Sun>

  - list a
  - [-] list a
    - [ ] list b
    - [x] list b
  - list a

** Subsection :tag:

Text
```

Parses as:
```
(document [0, 0] - [16, 0]
  body: (body [0, 0] - [4, 0]
    directive: (directive [0, 0] - [1, 0]
      name: (expr [0, 2] - [0, 7])
      value: (value [0, 9] - [0, 16]
        (expr [0, 9] - [0, 16])))
    (paragraph [2, 0] - [3, 0]
      (expr [2, 0] - [2, 4])
      (expr [2, 5] - [2, 12])
      (expr [2, 13] - [2, 16])
      (expr [2, 17] - [2, 22])))
  subsection: (section [4, 0] - [16, 0]
    headline: (headline [4, 0] - [5, 0]
      stars: (stars [4, 0] - [4, 1])
      item: (item [4, 2] - [4, 12]
        (expr [4, 2] - [4, 6])
        (expr [4, 7] - [4, 12])))
    plan: (plan [5, 0] - [6, 0]
      (entry [5, 0] - [5, 16]
        timestamp: (timestamp [5, 0] - [5, 16]
          date: (date [5, 1] - [5, 11])
          day: (day [5, 12] - [5, 15]))))
    body: (body [6, 0] - [13, 0]
      (list [7, 0] - [12, 0]
        (listitem [7, 2] - [8, 0]
          bullet: (bullet [7, 2] - [7, 3])
          contents: (paragraph [7, 4] - [8, 0]
            (expr [7, 4] - [7, 8])
            (expr [7, 9] - [7, 10])))
        (listitem [8, 2] - [11, 0]
          bullet: (bullet [8, 2] - [8, 3])
          checkbox: (checkbox [8, 4] - [8, 7]
            status: (expr [8, 5] - [8, 6]))
          contents: (paragraph [8, 8] - [9, 0]
            (expr [8, 8] - [8, 12])
            (expr [8, 13] - [8, 14]))
          contents: (list [9, 0] - [11, 0]
            (listitem [9, 4] - [10, 0]
              bullet: (bullet [9, 4] - [9, 5])
              checkbox: (checkbox [9, 6] - [9, 9])
              contents: (paragraph [9, 10] - [10, 0]
                (expr [9, 10] - [9, 14])
                (expr [9, 15] - [9, 16])))
            (listitem [10, 4] - [11, 0]
              bullet: (bullet [10, 4] - [10, 5])
              checkbox: (checkbox [10, 6] - [10, 9]
                status: (expr [10, 7] - [10, 8]))
              contents: (paragraph [10, 10] - [11, 0]
                (expr [10, 10] - [10, 14])
                (expr [10, 15] - [10, 16])))))
        (listitem [11, 2] - [12, 0]
          bullet: (bullet [11, 2] - [11, 3])
          contents: (paragraph [11, 4] - [12, 0]
            (expr [11, 4] - [11, 8])
            (expr [11, 9] - [11, 10])))))
    subsection: (section [13, 0] - [16, 0]
      headline: (headline [13, 0] - [14, 0]
        stars: (stars [13, 0] - [13, 2])
        item: (item [13, 3] - [13, 13]
          (expr [13, 3] - [13, 13]))
        tags: (tag_list [13, 14] - [13, 19]
          tag: (tag [13, 15] - [13, 18])))
      body: (body [14, 0] - [16, 0]
        (paragraph [15, 0] - [16, 0]
          (expr [15, 0] - [15, 4]))))))
```

## Install

For manual install, use `make`.

For neovim, using `nvim-treesitter/nvim-treesitter`, add to your configuration:

``` lua
local parser_config = require "nvim-treesitter.parsers".get_parser_configs()
parser_config.org = {
  install_info = {
    url = 'https://github.com/milisims/tree-sitter-org',
    revision = 'main',
    files = { 'src/parser.c', 'src/scanner.cc' },
  },
  filetype = 'org',
}
```

To build the parser using npm and run tests:

1. Install node.js as described in the [tree-sitter documentation](https://tree-sitter.github.io/tree-sitter/creating-parsers#dependencies)
2. Clone this repository: `git clone https://github.com/milisims/tree-sitter-org` and `cd` into it
3. Install tree-sitter using npm: `npm install`
4. Run tests: `./node_modules/.bin/tree-sitter generate && ./node_modules/.bin/tree-sitter test`
