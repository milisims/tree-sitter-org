asciiSymbols = [ '!', '"', '#', '$', '%', '&', "'", '(', ')', '*',
  '+', ',', '-', '.', '/',  ':', ';', '<', '=', '>', '?', '@', '[', ']',
  '\\', '^', '_', '`', '{', '|', '}', '~' ]

org_grammar = {
  name: 'org',
  // Treat newlines explicitly, all other whitespace is extra
  extras: _ => [/[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/],

  externals: $ => [
    $._liststart,
    $._listend,
    $._listitemend,
    $.bullet,
    $._stars,
    $._sectionend,
    $._eof,  // Basically just '\0', but allows multiple to be matched
  ],

  inline: $ => [
    $._nl,
    $._eol,
    $._ts_contents,
    $._directive_list,
    $._body_contents,
  ],

  precedences: _ => [
    ['document_directive', 'body_directive'],
    ['special', 'immediate', 'non-immediate'],
  ],

  conflicts: $ => [

    // stars  'headline_token1'  item_repeat1  •  ':'  …
    // Should we start the tag?
    [$.item],

    [$._tag_expr_start, $.expr],

    // _multiline_text  •  ':'  …
    // Is the ':' continued multiline text or is it a drawer?
    [$.paragraph],
    [$.fndef],
    // ':'  'str'  …
    // Continue the conflict from above
    [$.expr, $.drawer],

    // headline  'entry_token1'  ':'  •  '<'  …
    [$.entry, $.expr],

  ],

  rules: {

    document: $ => seq(
      optional(field('body', $.body)),
      repeat(field('subsection', $.section)),
    ),

    // Set up to prevent lexing conflicts of having two paragraphs in a row
    body: $ => $._body_contents,

    _body_contents: $ => choice(
      repeat1($._nl),
      seq(repeat($._nl), $._multis),
      seq(
        repeat($._nl),
        repeat1(seq(
          choice(
            seq($._multis, $._nl),
            seq(optional(choice($.paragraph, $.fndef)), $._element),
          ),
          repeat($._nl),
        )),
        optional($._multis)
      ),
    ),

    // Can't have multiple in a row
    _multis: $ => choice(
      $.paragraph,
      $._directive_list,
      $.fndef,
    ),

    _element: $ => choice(
      $.comment,
      // Have attached directive:
      $.drawer,
      $.list,
      $.block,
      $.dynamic_block,
      $.table,
      $.latex_env,
    ),

    section: $ => seq(
      field('headline', $.headline),
      optional(field('plan', $.plan)),
      optional(field('property_drawer', $.property_drawer)),
      optional(field('body', $.body)),
      repeat(field('subsection', $.section)),
      $._sectionend,
    ),

    stars: $ => seq($._stars, /\*+/),

    headline: $ => seq(
      field('stars', $.stars),
      /[ \t]+/, // so it's not part of (item)
      optional(field('item', $.item)),
      optional(field('tags', $.tag_list)),
      $._eol,
    ),

    item: $ => repeat1($.expr),

    tag_list: $ => prec.dynamic(1, seq(
      $._tag_expr_start,
      repeat1(seq(
        field('tag', alias($._noc_expr, $.tag)),
        token.immediate(prec('special', ':')),
      )),
    )),

    // This is in another node to ensure a conflict with headline (item)
    _tag_expr_start: _ => token(prec('non-immediate', ':')),

    property_drawer: $ => seq(
      caseInsensitive(':properties:'),
      repeat1($._nl),
      repeat(seq($.property, repeat1($._nl))),
      prec.dynamic(1, caseInsensitive(':end:')),
      $._eol,
    ),

    property: $ => seq(
      ':',
      field('name', alias($._immediate_expr, $.expr)),
      token.immediate(':'),
      field('value', optional(alias($._expr_line, $.value)))
    ),

    plan: $ => seq(repeat1($.entry), prec.dynamic(1, $._eol)),

    entry: $ => seq(
      optional(seq(
        field('name', alias(token(prec('non-immediate', /\p{L}+/)), $.entry_name)),
        token.immediate(prec('immediate', ':'))
      )),
      field('timestamp', $.timestamp)
    ),

    timestamp: $ => choice(
      seq(token(prec('non-immediate', '<')), $._ts_contents, '>'),
      seq(token(prec('non-immediate', '<')), $._ts_contents, '>--<', $._ts_contents, '>'),
      seq(token(prec('non-immediate', '[')), $._ts_contents, ']'),
      seq(token(prec('non-immediate', '[')), $._ts_contents, ']'),
      seq(token(prec('non-immediate', '[')), $._ts_contents, ']--[', $._ts_contents, ']'),
      seq('<%%', $.tsexp, token(prec('special', '>'))),
      seq('[%%', $.tsexp, token(prec('special', ']'))),
    ),
    tsexp: $ => repeat1(alias($._ts_expr, $.expr)),

    _ts_contents: $ => seq(
      repeat($._ts_element),
      field('date', $.date),
      repeat($._ts_element),
    ),

    date: $ => /\p{N}{1,4}-\p{N}{1,4}-\p{N}{1,4}/,

    _ts_element: $ => choice(
      field('day', alias(/\p{L}[^\]>\p{Z}\n\r]*/, $.day)),
      field('time', alias(/\p{N}?\p{N}[:.]\p{N}\p{N}( ?\p{L}{1,2})?/, $.time)),
      field('duration', alias(/\p{N}?\p{N}[:.]\p{N}\p{N}( ?\p{L}{1,2})?-\p{N}?\p{N}[:.]\p{N}\p{N}( ?\p{L}{1,2})?/, $.duration)),
      field('repeat', alias(/[.+]?\+\p{N}+\p{L}/, $.repeat)),
      field('delay', alias(/--?\p{N}+\p{L}/, $.delay)),
      alias(prec(-1, /[^\[<\]>\p{Z}\n\r]+/), $.expr),
    ),

    paragraph: $ => seq(optional($._directive_list), $._multiline_text),

    fndef: $ => seq(
      optional($._directive_list),
      seq(
        caseInsensitive('[fn:'),
        field('label', alias(/[^\p{Z}\n\r\]]+/, $.expr)),
        ']',
      ),
      field('description', alias($._multiline_text, $.description))
    ),

    _directive_list: $ => repeat1(field('directive', $.directive)),
    directive: $ => seq(
      '#+',
      field('name', alias($._immediate_expr, $.expr)),
      token.immediate(':'),
      field('value', optional(alias($._expr_line, $.value))),
      $._eol,
    ),

    comment: $ => prec.right(repeat1(seq(/#[^+\n\r]/, repeat($.expr), $._eol))),

    drawer: $ => seq(
      optional($._directive_list),
      token(prec('non-immediate', ':')),
      field('name', alias($._noc_expr, $.expr)),
      token.immediate(prec('special', ':')),
      $._nl,
      optional(field('contents', $.contents)),
      prec.dynamic(1, caseInsensitive(':end:')),
      $._eol,
    ),

    block: $ => seq(
      optional($._directive_list),
      caseInsensitive('#+begin_'),
      field('name', $.expr),
      optional(repeat1(field('parameter', $.expr))),
      $._nl,
      optional(field('contents', $.contents)),
      caseInsensitive('#+end_'),
      $._immediate_expr,
      $._eol,
    ),

    dynamic_block: $ => seq(
      optional($._directive_list),
      caseInsensitive('#+begin:'),
      field('name', $.expr),
      repeat(field('parameter', $.expr)),
      $._nl,
      optional(field('contents', $.contents)),
      caseInsensitive('#+end:'),
      $._eol,
    ),

    list: $ => seq(
      optional($._directive_list),
      $._liststart,  // captures indent length and bullet type
      repeat(seq($.listitem, $._listitemend, repeat($._nl))),
      seq($.listitem, $._listend)
    ),

    listitem: $ => seq(
      field('bullet', $.bullet),
      optional(field('checkbox', $.checkbox)),
      choice(
        $._eof,
        field('contents', $._body_contents),
      ),
    ),

    checkbox: $ => choice(
      '[ ]',
      seq(
        token(prec('non-immediate', '[')),
        field('status', alias($._checkbox_status_expr, $.expr)),
        token.immediate(prec('special', ']')),
      ),
    ),

    table: $ => prec.right(seq(
      optional($._directive_list),
      repeat1(choice($.row, $.hr)),
      repeat($.formula),
    )),

    row: $ => prec(1, seq(
      repeat1($.cell),
      optional(token(prec(1, '|'))),
      $._eol,
    )),

    cell: $ => seq(
      token(prec(1, '|')), // Table > paragraph (expr)
      optional(field('contents', alias($._expr_line, $.contents))),
    ),
    hr: $ => seq(
      token(prec(1, '|')),
      repeat1(seq(token.immediate(prec(1, /[-+]+/)), optional('|'))),
      $._eol,
    ),

    formula: $ => seq(
      caseInsensitive('#+tblfm:'),
      field('formula', optional($._expr_line)),
      $._eol,
    ),

    latex_env: $ => seq(
      optional($._directive_list),
      choice(
        seq(
          caseInsensitive('\\begin{'),
          field('name', alias(/[\p{L}\p{N}*]+/, $.name)),
          token.immediate('}'),
          $._nl,
          optional(field('contents', $.contents)),
          caseInsensitive('\\end{'),
          alias(/[\p{L}\p{N}*]+/, $.name),
          token.immediate('}'),
        ),
        seq(
          caseInsensitive('\\['),
          $._nl,
          optional(field('contents', $.contents)),
          caseInsensitive('\\]'),
        ),
        seq(
          caseInsensitive('\\('),
          $._nl,
          optional(field('contents', $.contents)),
          caseInsensitive('\\)'),
        ),
      ),
      $._eol,
    ),

    contents: $ => seq(
      optional($._expr_line),
      repeat1($._nl),
      repeat(seq($._expr_line, repeat1($._nl))),
    ),

    _nl: _ => choice('\n', '\r'),
    _eol: $ => choice('\n', '\r', $._eof),

    _expr_line: $ => repeat1($.expr),
    _multiline_text: $ => repeat1(seq(repeat1($.expr), $._eol)),

    _immediate_expr: $ => repeat1(expr('immediate', token.immediate)),
    _noc_expr: $ => repeat1(expr('immediate', token.immediate, ':')),

    _checkbox_status_expr: $ => expr('immediate', token.immediate, ']'),

    _ts_expr: $ => seq(
      expr('non-immediate', token, '>]'),
      repeat(expr('immediate', token.immediate, '>]'))
    ),

    expr: $ => seq(
      expr('non-immediate', token),
      repeat(expr('immediate', token.immediate))
    ),

  }
};

function expr(pr, tfunc, skip = '') {
  skip = skip.split("")
  return choice(
    ...asciiSymbols.filter(c => !skip.includes(c)).map(c => tfunc(prec(pr, c))),
    alias(tfunc(prec(pr, /\p{L}+/)), 'str'),
    alias(tfunc(prec(pr, /\p{N}+/)), 'num'),
    alias(tfunc(prec(pr, /[^\p{Z}\p{L}\p{N}\n\r]/)), 'sym'),
     // for checkboxes: ugly, but makes them work..
    // alias(tfunc(prec(pr, 'x')), 'str'),
    // alias(tfunc(prec(pr, 'X')), 'str'),
  )
}

function caseInsensitive(str) {
  return alias(new RegExp(str
    .split('')
    .map(caseInsensitiveChar)
    .join('')
  ), str.toLowerCase())
}

function caseInsensitiveChar(char) {
  if (/[a-zA-Z]/.test(char))
    return `[${char.toUpperCase()}${char.toLowerCase()}]`;
  return char.replace(/[\[\]^$.|?*+()\\\{\}]/, '\\$&');
}

module.exports = grammar(org_grammar);
