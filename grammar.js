org_grammar = {
  // Externals, inline =================================== {{{1
  name: 'org',
  // Treat newlines explicitly, all other whitespace is extra
  extras: _ => [/[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/],

  externals: $ => [
    $._liststart,
    $._listend,
    $._listitemend,
    $._bullet,
    $.stars,
    $._sectionend,
    $._markup,
  ],

  inline: $ => [
    $._ts_contents,
    $._ts_contents_range,
    $._directives,
    $._docbody,
  ],

  // Precedences, conflict =============================== {{{1

  precedences: _ => [
    ['fn_definition', 'footnote'],
    ['attached_directive', 'bare_directive'],
  ],

  conflicts: $ => [
    [$._itemtag, $._textelement], // textelement in $._itemtext
    [$.item], // :tags: in headlines

    // Markup
    [$._conflicts, $.bold],
    [$._conflicts, $.italic],
    [$._conflicts, $.underline],
    [$._conflicts, $.strikethrough],
    [$._conflicts, $.code],
    [$._conflicts, $.verbatim],

    // Multiple lastitems from nested lists
    [$._lastitem],

    // Subscript and underlines
    [$._textelement, $.subscript, $._conflicts],
  ],

  rules: {
    // Document, sections, body, & paragraph =============== {{{1

    document: $ => seq(
      optional($._docbody),
      repeat($.section),
    ),

    _docbody: $ => choice(
      $.body,
      seq($._directives, optional($._nl)),
      seq($._directives, $._nl, $.body),
    ),

    // Sections, body, paragraph =========================== {{{1

    section: $ => seq(
      $.headline, $._eol,
      optional(seq(
        optional(seq($.plan, $._eol)),
        optional(seq($.property_drawer, $._eol)),
        optional($.body),
        repeat($.section),
      )),
      $._sectionend,
    ),

    _eol: _ => choice('\0', '\n', '\r'), // repeat($._eol) is bad
    _nl: _ => choice('\n', '\r'),

    body: $ => choice(
      repeat1($._nl),
      seq(
        repeat($._nl),
        repeat1(seq($._element, repeat($._nl))),
      ),
    ),

    paragraph: $ => seq(
      optional($._directives),
      prec.right(
        repeat1(seq(
          repeat1($._textelement),
          $._eol)
        ))),

    _text_body: $ => choice(
      repeat1($._nl),
      seq(
        repeat($._nl),
        repeat1(seq(
          repeat1($._text),
          repeat1($._nl),
        )),
      ),
    ),


    // Element and textelement ============================= {{{1

    _element: $ => choice(
      prec('bare_directive', $.directive),
      $.comment,
      $.fndef,

      $.drawer,
      $.list,
      $.block,
      $.dynamic_block,
      $.paragraph,
      $.table,
      $.latex_env,
    ),

    _textelement: $ => choice(
      $._text,
      $._conflicts,
      $.timestamp,

      $.footnote,
      $.link,

      $.bold,
      $.code,
      $.italic,
      $.verbatim,
      $.underline,
      $.strikethrough,

      $.subscript,
      $.superscript,
      $.latex_fragment,
    ),

    // Headlines =========================================== {{{1

    headline: $ => seq(
      $.stars,
      optional(seq(
        /[ \t]+/, // so it's not part of title
        $.item,
      )),
      optional($._taglist),
    ),

    // the choice with ':' allows for the conflict of $.title to operate
    item: $ => repeat1(choice($._text, /[ \t]:/)),

    _taglist: $ => prec.dynamic(1,  // over title text
      seq(/[ \t]:/,
        repeat1(seq(
          $.tag,
          token.immediate(':')
        )))),

    tag: _ => token.immediate(/[\p{L}\p{N}_@#%]+/),

    property_drawer: $ => seq(
      ':PROPERTIES:', repeat1($._nl),
      repeat(seq($.property, repeat1($._nl))),
      ':END:',
      optional(':'), // FIXME: report bug
    ),

    property: $ => seq(
      ':',
      token.immediate(/[^\p{Z}\n\r:]+/),
      token.immediate(':'),
      repeat($._text),
    ),

    // Planning ============================================ {{{1

    _scheduled:     _ => 'SCHEDULED:',
    _deadline:      _ => 'DEADLINE:',
    _closed:        _ => 'CLOSED:',

    plan: $ => repeat1(prec(1, // precedence over paragraph→timestamp
      choice(
        $.timestamp,
        $.scheduled,
        $.deadline,
        $.closed,
      ))),

    scheduled: $ => seq($._scheduled, $.timestamp),
    deadline: $ => seq($._deadline, $.timestamp),
    closed: $ => seq(
      $._closed,
      alias(choice(
        $._inactive_ts,
        $._inactive_ts_trange,
        $._inactive_ts_range,
      ), $.timestamp),
    ),

    // Timestamp =========================================== {{{1

    _active_start:        _ => '<',
    _active_end:          _ => '>',
    _inactive_start:      _ => '[',
    _inactive_end:        _ => ']',
    _active_separator:   _ => '>--<',
    _inactive_separator: _ => ']--[',
    _day:                _ => /\p{L}+/,
    _ymd:                _ => /\p{N}{1,4}-\p{N}{1,4}-\p{N}{1,4}/,
    time:                _ => /\p{N}?\p{N}:\p{N}\p{N}/,
    repeater:            _ => /[.+]?\+\p{N}+\p{L}/,
    delay:               _ => /--?\p{N}+\p{L}/,

    date: $ => seq($._ymd, optional($._day)),

    timerange: $ => seq($.time, '-', $.time),

    timestamp: $ => choice(
      $._active_ts,
      $._active_ts_trange,
      $._active_ts_range,
      $._inactive_ts,
      $._inactive_ts_trange,
      $._inactive_ts_range,
    ),

    _ts_contents: $ => seq(
      $.date,
      optional($.time),
      optional($.repeater),
      optional($.delay),
    ),

    _ts_contents_range: $ => seq(
      $.date,
      $.timerange,
      optional($.repeater),
      optional($.delay),
    ),

    _active_ts: $ => seq($._active_start, $._ts_contents, $._active_end),
    _active_ts_trange: $ => seq($._active_start, $._ts_contents_range, $._active_end),

    _active_ts_range: $ => seq(
      $._active_start,
      $._ts_contents,
      $._active_separator,
      $._ts_contents,
      $._active_end
    ),

    _inactive_ts: $ => seq($._inactive_start, $._ts_contents, $._inactive_end),
    _inactive_ts_trange: $ => seq($._inactive_start, $._ts_contents_range, $._inactive_end),

    _inactive_ts_range: $ => seq(
      $._inactive_start,
      $._ts_contents,
      $._inactive_separator,
      $._ts_contents,
      $._inactive_end
    ),

    // Markup ============================================== {{{1

    bold:          make_markup('*'),
    italic:        make_markup('/'),
    underline:     make_markup('_'),
    strikethrough: make_markup('+'),
    code:          make_markup('~', true),
    verbatim:      make_markup('=', true),

    subscript: $ => seq(
      $._text,
      token.immediate('_'),
      choice(
        /\p{L}+/,
        /\p{N}+/,
        $._bracket_expr,
      ),
    ),

    superscript: $ => seq(
      $._text,
      token.immediate('^'),
      choice(
        token.immediate(/\p{L}+/),
        token.immediate(/\p{N}+/),
        $._bracket_expr
      ),
    ),

    _bracket_expr: $ => seq(
      token.immediate('{'),
      optional(seq(
        repeat1($._text),
        repeat(seq($._nl, repeat1($._text)))
      )),
      token.immediate('}'),
    ),

    // Latex fragments ===================================== {{{1

    latex_fragment: $ => choice(
      $._latex_named,
      $._latex_expr,
      $._latex_snip,
      $._latex_round_brackets,
      $._latex_square_brackets,
    ),

    _latex_named: $ => seq(
      '\\',
      token.immediate(/[\p{L}]+/),
      repeat($._bracket_expr),
    ),

    _latex_expr: $ => seq(
      '$$',
      repeat1($._text),
      repeat(seq($._nl, repeat1($._text))),
      '$$',
    ),

    _latex_snip: _ => seq(
      '$',
      token.immediate(/[^\p{Z}\n\r$]+/),
      token.immediate('$'),
    ),

    _latex_round_brackets: $ => seq(
      '\\(',
      repeat1($._text),
      repeat(seq($._nl, repeat1($._text))),
      '\\)',
    ),

    _latex_square_brackets: $ => seq(
      '\\[',
      repeat1($._text),
      repeat(seq($._nl, repeat1($._text))),
      '\\]',
    ),

    // Link ================================================ {{{1

    _linkstart:     _ => '[[',
    _linksep:       _ => '][',
    _linkend:       _ => ']]',

    link: $ => seq(
      $._linkstart,
      optional(seq(field('uri', $.linktext), $._linksep)),
      field('description', $.linktext),
      $._linkend,
    ),
    linktext: _ => /[^\]]*/,

    // Footnote ============================================ {{{1

    _fn_label: _ => /[\p{L}\p{N}_-]+/,
    _fn: _ => '[fn:',

    fndef: $ => prec('fn_definition',
      seq(
        $._fn,
        $._fn_label,
        ']',
        $._fn_def,
        $._eol,
      )),

    _fn_def: $ => prec.right(seq(
      repeat1($._textelement),
      repeat(seq($._nl, repeat1($._textelement))),
    )),

    footnote: $ => prec('footnote',
      seq(
        $._fn,
        choice(
          $._fn_label,
          seq(optional($._fn_label), token.immediate(':'), $._fn_def),
        ),
        ']',
      )),

    // Directive =========================================== {{{1

    _directives: $ => repeat1(prec('attached_directive', $.directive)),

    directive: $ => seq(
      '#+',
      field('name', token.immediate(/[^\p{Z}\n\r:]+/)), // name
      token.immediate(':'),
      field('value', repeat($._text)),
      $._eol,
    ),

    // Comments ============================================ {{{1

    comment: $ => prec.right(repeat1(seq(
      '# ', repeat($._text), $._eol
    ))),

    // Drawer ============================================== {{{1

    drawer: $ => seq(
      optional($._directives),
      $._drawer_begin,
      optional($._text_body),
      $._drawer_end,
    ),

    _drawer_begin: $ => seq(
      ':',
      $._drawername,
      token.immediate(':'),
      $._nl,
    ),

    _drawer_end: $ => seq(
      ':END:',
      optional(':'), // FIXME: report bug
      $._eol,
    ),

    _drawername: _ => token.immediate(/[\p{L}\p{N}\p{Pd}\p{Pc}]+/),

    // Block =============================================== {{{1

    block: $ => seq(
      optional($._directives),
      $._block_begin,
      optional($._text_body),
      $._block_end,
    ),

    _block_begin: $ => seq(
      '#+BEGIN_',
      alias($._name, $.name),
      optional(alias(repeat1($._text), $.parameters)),
      $._nl,
    ),

    _block_end: $ => seq(
      '#+END_', $._name,
      optional('_'), // FIXME: report bug
      $._eol,
    ),

    _name: _ => token.immediate(/[^\p{Z}\n\r]+/),

    // Dynamic block ======================================= {{{1

    dynamic_block: $ => seq(
      optional($._directives),
      $._dynamic_begin,
      optional($._text_body),
      $._dynamic_end,
    ),

    _dynamic_begin: $ => seq(
      '#+BEGIN:',
      alias(/[^\p{Z}\n\r]+/, $.name),
      optional(alias(repeat1($._text), $.parameters)),
      $._eol,
    ),

    _dynamic_end: $ => seq(
      '#+END:',
      optional(':'), // FIXME: report bug
      $._eol,
    ),

    // Lists =============================================== {{{1

    list: $ => seq(
      optional($._directives),
      $._liststart,
      repeat(seq($.listitem, optional($._eol))),
      alias($._lastitem, $.listitem),
    ),

    listitem: $ => seq(
      $._bullet,
      optional($._checkbox),
      optional($._itemtag),
      optional($._itemtext),
      $._listitemend,
      $._eol,
    ),

    _lastitem: $ => seq(
      $._bullet,
      optional($._checkbox),
      optional($._itemtag),
      optional($._itemtext),
      $._listend,
      optional($._eol), // Multiple lastitems consume the eol once
    ),

    _checkbox: _ => /\[[ xX-]\]/,
    _itemtag: $ => seq(
      repeat($._text),
      prec.dynamic(1, '::'), // precedence over itemtext
    ),

    _itemtext: $ => seq(
      repeat1($._textelement),
      repeat(seq(
        $._eol,
        optional($._eol),
        choice(repeat1($._textelement), $.list)
      )),
    ),


    // Table =============================================== {{{1

    table: $ => prec.right(seq(
      optional($._directives),
      repeat1(seq(choice($.row, $._hrule), $._eol)),
      repeat($.formula),
    )),

    row: $ => seq(repeat1($.cell), '|'),
    cell: $ => seq('|', repeat($._text)),
    _hrule: _ => seq(
      '|',
      repeat1(seq(/[-+]+/, '|')),
      optional('-'), // FIXME
    ),

    // _hrule: $ => seq(
    //   '|', '-', '|',
    //   optional('-'),
    //   ), Good test!

    formula: $ => seq('#+TBLFM:', field('formula', repeat($._text)), $._eol),

    // Latex environment =================================== {{{1

    latex_env: $ => seq(
      optional($._directives),
      $._env_begin,
      optional($._text_body),
      $._env_end,
    ),

    _env_begin: $ => seq(
      '\\begin{',
      field('name', /[\p{L}\p{N}]+/),
      token.immediate('}'),
      $._nl,
    ),

    _env_end: $ => seq(
      '\\end{',
      /[\p{L}\p{N}]+/,
      token.immediate('}'),
      optional('}'), // FIXME: report bug
      $._eol,
    ),

    // Text ================================================ {{{1

    _text: _ => choice(
      /\p{L}+/,                   // Letters
      /\p{N}+/,                   // Numbers
      /[^\p{Z}\p{L}\p{N}\n\r]/,   // Everything else, minus whitespace
    ),

    _conflicts: $ => choice(
      $._active_start,
      $._inactive_start,
      seq($._markup, '*'),
      seq($._markup, '/'),
      seq($._markup, '_'),
      seq($._markup, '+'),
      seq($._markup, '~'),
      seq($._markup, '='),
      seq(':', optional($._drawername)),
      seq('\\', /[^\p{L}]+/),
      seq($._text, '^', /[^{]/),
      seq('$', token.immediate(/[^\p{Z}\n\r$]+/)),
      // seq($._text, '^', /[^{]/),
      seq($._text, token.immediate('_'), token.immediate(/[^\p{Z}]/))
    ),

  }
};

function make_markup(delim, textonly = false) {      // {{{1
  return $ => prec.left(seq(
    $._markup,
    delim,
    repeat1(textonly ? $._text : $._textelement),
    repeat(seq($._nl, repeat1(textonly ? $._text : $._textelement))),
    delim == '_' ? prec.dynamic(1, token.immediate(delim)) : token.immediate(delim),
  ))  // Dynamic prec on _ deals with subscript conflicts
}

// }}}

module.exports = grammar(org_grammar);
