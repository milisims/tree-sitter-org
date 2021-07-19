// Dynamic precedence constants ========================== {{{1
DYN = {
  multiline: -10,
  tablefm: 1,       // over directive
  paragraphnl: -1,
  paragraphtext: 1,
  nonparagraph: 10, // not sure why this needs to be so high
  hltags: 1,
  listtag: 1,
  conflicts: -1,
  footnote: 1,      // paragraph\nfn -> continued paragraph (footnote) instead of fndef
}

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
    $._docbody,
    $._directive_list,
  ],

  // Precedences, conflict =============================== {{{1

  precedences: _ => [
    ['fn_definition', 'footnote'],
    ['eol', 'nl'],
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

    // For deciding where the newlines go
    [$._nl, $._eol],
    [$.body],
    [$._paragraph_body],
    [$._text_body],
    [$.paragraph],
    [$.comment],
    [$.section],
    [$.table],

    // _text_body conflicts
    [$.drawer],
    [$.block],
    [$.dynamic_block],
    [$.latex_env],
    [$.fndef],

    // directives
    // [$.document, $.paragraph, $._element, $.fndef, $.drawer, $.block, $.dynamic_block, $.list, $.table, $.latex_env],
    // [$.paragraph, $._element, $.fndef, $.drawer, $.block, $.dynamic_block, $.list, $.table, $.latex_env],

    // Subscript and underlines
    [$._textelement, $.subscript, $._conflicts],

  ],

  rules: {
    // Document, sections, body, & paragraph =============== {{{1

    document: $ => prec(1, seq(
      optional(choice(
        seq($._directive_list, $._eol),
        seq($._directive_list, $._nl, repeat1($._nl), $.body),
        seq(repeat($._nl), $.body),
      )),
      repeat($._nl),
      optional(sep1($.section, $._nl))
    )),

    _nl: _ => choice('\n', '\r'),
    _eol: _ => choice('\n', '\r', '\0'),

    section: $ => seq(
      $.headline,
      optional(seq($._nl, field('plan', $.plan))),
      optional(seq($._nl, field('property_drawer', $.property_drawer))),
      optional(seq(repeat1($._nl), $.body)),
      optional(choice(
        repeat1($._nl),
        repeat1(seq(repeat1($._nl), $.section)),
      )),
      $._sectionend,
    ),

    body: $ =>  sep1($._element, repeat1($._nl)),
    _paragraph_body: $ => sep1(repeat1($._textelement), $._nl),
    // _paragraph_body: $ => sep1(prec.dynamic(1, repeat1($._textelement)), prec.dynamic(-1, $._nl)),
    _text_body: $ => sep1(repeat1($._text), $._nl),

    // Element and textelement ============================= {{{1

    _element: $ => choice(
      seq($._directive_list, $._eol),
      $.comment,

      // Have attached directive
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

    // Paragraph =========================================== {{{1

    // Prec prefers one paragraph over multiple for multi-line
    paragraph: $ => prec.dynamic(DYN.multiline, seq(
      optional(seq($._directive_list, $._nl)),
      sep1(
        prec.dynamic(DYN.paragraphtext, repeat1($._textelement)),
        prec.dynamic(DYN.paragraphnl, $._nl)
      ),
    )),

    // Headlines =========================================== {{{1

    headline: $ => seq(
      $.stars,
      optional(seq(
        /[ \t]+/, // so it's not part of title
        $.item,
      )),
      optional(field('tags', $._taglist)),
    ),

    // the choice with ':' allows for the conflict of $.title to operate
    item: $ => seq(
      field('first', choice($._text, /[ \t]:/)),
      field('rest', repeat(choice($._text, /[ \t]:/))),
    ),

    _taglist: $ => prec.dynamic(DYN.hltags,  // over title text
      seq(/[ \t]:/,
        repeat1(seq(
          $.tag,
          token.immediate(':')
        )))),

    tag: _ => token.immediate(/[\p{L}\p{N}_@#%]+/),

    property_drawer: $ => seq(
      ':PROPERTIES:',
      sep1(repeat1($._nl), $.property),
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
      optional(sep1(repeat1($._text), $._nl)),
      '}',
    ),

    // Latex fragments ===================================== {{{1

    latex_fragment: $ => choice(
      $._latex_named,
      $._latex_expr,
      $._latex_snip,
      $._latex_round,
      $._latex_square,
    ),

    _latex_expr: $ => seq('$$', sep1(repeat1($._text), $._nl), '$$'),
    _latex_snip: _ => seq('$', token.immediate(/[^\p{Z}\n\r$]+/), token.immediate('$')),
    _latex_round: $ => seq('\\(', sep1(repeat1($._text), $._nl), '\\)'),
    _latex_square: $ => seq('\\[', sep1(repeat1($._text), $._nl), '\\]'),

    _latex_named: $ => seq(
      '\\',
      token.immediate(/[\p{L}]+/),
      repeat($._bracket_expr),
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
        optional(seq($._directive_list, $._nl)),
        $._fn,
        $._fn_label,
        ']',
        $._paragraph_body,
    )),

    footnote: $ => prec('footnote',
      prec.dynamic(DYN.footnote, seq(
        $._fn,
        choice(
          $._fn_label,
          seq(optional($._fn_label), token.immediate(':'), $._paragraph_body),
        ),
        ']',
      ))),

    // Directive & Comments================================= {{{1

    _directive_list: $ => sep1($.directive, $._nl),

    directive: $ => seq(
      '#+',
      field('name', alias(token.immediate(/[^\p{Z}\n\r:]+/), $.name)),
      token.immediate(':'),
      field('value', alias(repeat($._text), $.value)),
    ),

    comment: $ => sep1(seq(prec.dynamic(DYN.nonparagraph, /#[^+\n\r]/), repeat($._text)), $._nl),

    // Drawer ============================================== {{{1

    drawer: $ => seq(
      optional(seq($._directive_list, $._nl)),
      $._drawer_begin,
      sep1(repeat1($._nl), $._paragraph_body),
      $._drawer_end,
    ),

    _drawer_begin: $ => seq( ':', $._drawername, token.immediate(':')),
    // FIXME: report bug about optional(':')
    _drawer_end: $ => seq( ':END:', optional(':')),
    _drawername: _ => token.immediate(/[\p{L}\p{N}\p{Pd}\p{Pc}]+/),

    // Block =============================================== {{{1

    block: $ => seq(
      optional(seq($._directive_list, $._nl)),
      $._block_begin,
      sep1(repeat1($._nl), $._text_body),
      $._block_end,
    ),

    _block_begin: $ => seq(
      '#+BEGIN_',
      alias($._name, $.name),
      optional(alias(repeat1($._text), $.parameters)),
    ),

    _block_end: $ => seq(
      '#+END_', $._name,
      optional('_'), // FIXME: report bug
    ),

    _name: _ => token.immediate(/[^\p{Z}\n\r]+/),

    // Dynamic block ======================================= {{{1

    dynamic_block: $ => seq(
      optional(seq($._directive_list, $._nl)),
      $._dynamic_begin,
      sep1(repeat1($._nl), $._text_body),
      $._dynamic_end,
    ),

    _dynamic_begin: $ => seq(
      '#+BEGIN:',
      alias(/[^\p{Z}\n\r]+/, $.name),
      optional(alias(repeat1($._text), $.parameters)),
    ),

    _dynamic_end: $ => seq(
      '#+END:',
      optional(':'), // FIXME: report bug
    ),

    // Lists =============================================== {{{1

    list: $ => seq(
      optional(seq($._directive_list, $._nl)),
      $._liststart,  // captures indent length and bullet
      repeat(seq($.listitem, $._listitemend, repeat1($._nl))),
      seq($.listitem, $._listend)
    ),

    listitem: $ => seq(
      $._bullet,
      optional($._checkbox),
      optional($._itemtag),
      optional($._itemtext),
    ),

    _checkbox: _ => /\[[ xX-]\]/,
    _itemtag: $ => seq(
      repeat($._text),
      prec.dynamic(DYN.listtag, '::'), // precedence over itemtext
    ),

    _itemtext: $ => seq(
      repeat1($._textelement),
      repeat(seq(
        $._nl,
        optional($._nl),
        choice(repeat1($._textelement), $.list)
      )),
    ),


    // Table =============================================== {{{1

    // prec so a new row is higher precedence than a new table
    table: $ => prec.dynamic(DYN.multiline, seq(
      optional(seq($._directive_list, $._nl)),
      sep1(choice($.row, $._hrule), $._nl),
      repeat(seq($._nl, $.formula)),
    )),

    row: $ => seq(repeat1($.cell), '|'),
    cell: $ => seq('|', field('contents', repeat($._text))),
    _hrule: _ => seq(
      '|',
      repeat1(seq(/[-+]+/, '|')),
      optional('-'), // FIXME
    ),

    // prec over directive. Not sure why it needs to be 2 over 1.
    formula: $ => prec.dynamic(DYN.tablefm, seq('#+TBLFM:', field('formula', repeat($._text)))),

    // Latex environment =================================== {{{1

    latex_env: $ => seq(
      optional(seq($._directive_list, $._nl)),
      $._env_begin,
      sep1(repeat1($._nl), $._text_body),
      $._env_end,
    ),

    _env_begin: $ => seq(
      '\\begin{',
      field('name', /[\p{L}\p{N}]+/),
      token.immediate('}'),
    ),

    _env_end: $ => seq(
      '\\end{',
      /[\p{L}\p{N}]+/,
      token.immediate('}'),
      optional('}'), // FIXME: report bug
    ),

    // Text ================================================ {{{1

    _text: _ => choice(
      /\p{L}+/,                   // Letters
      /\p{N}+/,                   // Numbers
      /[^\p{Z}\p{L}\p{N}\n\r]/,   // Everything else, minus whitespace
    ),

    _conflicts: $ => prec.dynamic(DYN.conflicts, choice(
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
    )),

  }
};

function make_markup(delim, textonly = false) {  // {{{1
  return $ => prec.left(seq(
    $._markup,
    delim,
    sep1(repeat1(textonly ? $._text : $._textelement), $._nl),
    token.immediate(delim),
    // delim == '_' ? prec.dynamic(1, token.immediate(delim)) : token.immediate(delim),
  ))  // Dynamic prec on _ deals with subscript conflicts
}

function sep1(rule, separator) {                 // {{{1
  return seq(rule, repeat(seq(separator, rule)))
}
// }}}

module.exports = grammar(org_grammar);
// vim: set fm=marker sw=2
