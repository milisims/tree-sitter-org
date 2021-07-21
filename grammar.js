// Dynamic precedence constants ========================== {{{1
DYN = {
  multiline: -1,
  hltags: 1,
  listtag: 1,
  conflicts: -1,
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
    $._stars,
    $._sectionend,
    $._markup,
    $._eof,  // Basically just '\0', but allows multiple to be matched
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
  ],

  conflicts: $ => [
    [$._itemtag, $._textelement], // textelement in $._itemtext
    [$.item],                    // :tags: in headlines

    // Markup
    [$._conflicts, $.markup],

    // Multiline -- continue the item or start a new one?
    [$.body],
    [$.paragraph],
    [$.table],
    [$.fndef],

    // Subscript and underlines
    [$._textelement, $.subscript, $._conflicts],

  ],

  rules: {
    // Document, sections, body, & paragraph =============== {{{1

    // prec over body -> element for directive list
    document: $ => prec(1, seq(
      optional(choice(
        $._directive_list,              // required in combination with:
        seq($._directive_list, $._eof), // equal precedence with _element
        seq(repeat($._nl), $.body),
        seq($._directive_list, repeat1($._nl), $.body),
      )),
      repeat($._nl),
      repeat($.section),
    )),

    _nl: _ => choice('\n', '\r'),
    _eol: $ => choice('\n', '\r', $._eof),

    section: $ => seq(
      $.headline, $._eol,
      optional(seq($.plan)),
      optional(seq($.property_drawer)),
      repeat($._nl),
      optional(seq($.body, repeat($._nl))),
      repeat($.section),
      $._sectionend,
    ),

    body: $ => choice(
      seq(sep1($._element, repeat($._nl))),
      seq(sep1($._element, repeat($._nl)), $._directive_list),
      $._directive_list,
    ),  // the directive list + choice Solves Directive.7

    // Element and textelement ============================= {{{1

    _element: $ => choice(
      seq($._directive_list, $._eof),
      $.comment,

      // Have attached directive
      $.paragraph,
      $.fndef,
      $.drawer,
      $.list,
      $.block,
      $.dynamic_block,
      $.table,
      $.latex_env,
    ),

    _textelement: $ => choice(
      $._text,
      $._conflicts,
      $.timestamp,

      $.footnote,
      $.link,

      $.markup,
      $.subscript,
      $.superscript,
      $.latex_fragment,
    ),

    // Paragraph =========================================== {{{1

    // Prec prefers one paragraph over multiple for multi-line
    paragraph: $ => prec.dynamic(DYN.multiline, seq(
      optional($._directive_list),
      repeat1(seq(repeat1($._textelement), $._eol)),
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

    stars: $ => seq(prec.dynamic(10, $._stars), /\*+/),

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
      $._eol,
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

    plan: $ => seq(
      repeat1(prec(1, // precedence over paragraph→timestamp
        choice(
          $.timestamp,
          $.scheduled,
          $.deadline,
          $.closed,
        ))),
      $._eol,
    ),

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

    markup: $ => seq(prec(1, $._markup), choice(
      seq(field('type', '*'), sep1(repeat1($._textelement), $._nl), token.immediate('*')),
      seq(field('type', '/'), sep1(repeat1($._textelement), $._nl), token.immediate('/')),
      seq(field('type', '_'), sep1(repeat1($._textelement), $._nl), token.immediate('_')),
      seq(field('type', '+'), sep1(repeat1($._textelement), $._nl), token.immediate('+')),
      seq(field('type', '~'), sep1(repeat1($._textelement), $._nl), token.immediate('~')),
      seq(field('type', '='), sep1(repeat1($._textelement), $._nl), token.immediate('=')),
      seq(field('type', '`'), sep1(repeat1($._textelement), $._nl), token.immediate('`')),
    )),

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
        optional($._directive_list),
        $._fn,
        $._fn_label,
        ']',
        repeat1(seq(repeat1($._textelement), $._eol)),
      )),

    footnote: $ => prec('footnote', seq(
      $._fn,
      choice(
        $._fn_label,
        seq(
          optional($._fn_label),
          token.immediate(':'),
          sep1(repeat1($._textelement), $._eol)
        ),
      ),
      ']',
    )),

    // Directive & Comment ================================= {{{1

    _directive_list: $ => repeat1($.directive),

    directive: $ => seq(
      '#+',
      field('name', alias(token.immediate(/[^\p{Z}\n\r:]+/), $.name)),
      token.immediate(':'),
      field('value', alias(repeat($._text), $.value)),
      $._eol
    ),

    comment: $ => prec.right(repeat1(seq(/#[^+\n\r]/, repeat($._text), $._eol))),

    // Drawer ============================================== {{{1

    // precedence over :
    drawer: $ => seq(
      optional($._directive_list),
      $._drawer_begin,
      repeat($._nl),
      repeat(seq(repeat1($._textelement), repeat1($._nl))),
      $._drawer_end,
    ),

    _drawer_begin: $ => seq(':', $._drawername, token.immediate(':'), $._nl),
    _drawer_end: $ => seq(':END:', $._eol),
    _drawername: _ => token.immediate(/[\p{L}\p{N}\p{Pd}\p{Pc}]+/),

    // Block =============================================== {{{1

    block: $ => seq(
      optional($._directive_list),
      $._block_begin,
      repeat($._nl),
      repeat(seq(repeat1($._text), repeat1($._nl))),
      $._block_end,
    ),

    _block_begin: $ => seq(
      '#+BEGIN_',
      alias($._name, $.name),
      optional(alias(repeat1($._text), $.parameters)),
      $._eol,
    ),

    _block_end: $ => seq(
      '#+END_', $._name,
      $._eol,
    ),

    _name: _ => token.immediate(/[^\p{Z}\n\r]+/),

    // Dynamic block ======================================= {{{1

    dynamic_block: $ => seq(
      optional($._directive_list),
      $._dynamic_begin,
      repeat($._nl),
      repeat(seq(repeat1($._text), repeat1($._nl))),
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
      $._eol,
    ),

    // Lists =============================================== {{{1

    list: $ => seq(
      optional($._directive_list),
      $._liststart,  // captures indent length and bullet type
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
      optional($._directive_list),
      repeat1(choice($.row, $._hrule)),
      repeat($.formula),
    )),

    row: $ => seq(repeat1($.cell), '|', $._eol),
    cell: $ => seq('|', field('contents', repeat($._text))),
    _hrule: $ => seq(
      '|',
      repeat1(seq(/[-+]+/, '|')),
      $._eol,
    ),

    formula: $ => seq('#+TBLFM:', field('formula', repeat($._text)), $._eol),

    // Latex environment =================================== {{{1

    latex_env: $ => seq(
      optional($._directive_list),
      $._env_begin,
      repeat($._nl),
      repeat(seq(repeat1($._text), repeat1($._nl))),
      $._env_end,
    ),

    _env_begin: $ => seq(
      '\\begin{',
      field('name', /[\p{L}\p{N}]+/),
      token.immediate('}'),
      $._eol
    ),

    _env_end: $ => seq(
      '\\end{',
      /[\p{L}\p{N}]+/,
      token.immediate('}'),
      $._eol
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
      seq($._markup, choice('*', '/', '_', '+', '~', '=', '`')),
      seq(':', optional($._drawername)),
      seq('\\', /[^\p{L}]+/),
      seq($._text, '^', /[^{]/),
      seq('$', token.immediate(/[^\p{Z}\n\r$]+/)),
      // seq($._text, '^', /[^{]/),
      seq($._text, token.immediate('_'), token.immediate(/[^\p{Z}]/))
    )),

  }
};

function sep1(rule, separator) {                 // {{{1
  return seq(rule, repeat(seq(separator, rule)))
}
// }}}

module.exports = grammar(org_grammar);
// vim: set fm=marker sw=2
