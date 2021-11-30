// Dynamic precedence constants ========================== {{{1
DYN = {
  multiline: -1,
  hltags: 1,
  listtag: 1,
  conflicts: -1,
}

org_grammar = {
  name: 'org',
  // Treat newlines explicitly, all other whitespace is extra
  extras: _ => [/[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/],

  // Externals =========================================== {{{1

  externals: $ => [
    $._liststart,
    $._listend,
    $._listitemend,
    $.bullet,
    $._stars,
    $._sectionend,
    $._markup,
    $._eof,  // Basically just '\0', but allows multiple to be matched
  ],

  // Inline ============================================== {{{1

  inline: $ => [
    $._nl,
    $._eol,
    $._body_body,
    $._ts_contents,
    $._ts_contents_range,
    $._fnref_label,
    $._fnref_definition,
    $._start_of_paragraph,
    $._start_of_textline,
  ],

  // Precedences ========================================= {{{1

  precedences: _ => [
    ['fn_definition', 'footnote'],
    ['document_directive', 'body_directive'],
  ],

  // Conflicts =========================================== {{{1

  conflicts: $ => [
    [$.description, $._textelement], // textelement in $.itemtext
    [$.item],                        // :tags: in headlines

    // Unresolved markup: _markup  '*'  •  '_active_start'  …
    // Unfinished markup is not an error
    [$._te_conflicts, $.markup],

    // Subscript and underlines: _markup  '_'  _text  •  '_'  …
    [$._textelement, $.subscript, $._te_conflicts],
  ],

  rules: {
    // Document ============================================ {{{1

    document: $ => prec('document_directive', seq(
      optional(choice(
        seq($._directive_list, repeat(prec('document_directive', $._nl))),
        seq(repeat($._nl), $.body),
        seq($._directive_list, $._nl, $.body),
        repeat1($._nl),
      )),
      repeat($.section),
    )),

    _nl: _ => choice('\n', '\r'),
    _eol: $ => choice('\n', '\r', $._eof),

    // Body ================================================ {{{1

    // Set up to prevent lexing conflicts of having two paragraphs in a row
    body: $ => prec('body_directive', choice(
      seq($._body_body, optional(choice($.paragraph, $._directive_list))),
      seq(choice($.paragraph, $._directive_list)),
    )),

    _body_body: $ => repeat1(prec('body_directive', seq(
      choice(
        seq($.paragraph, $._nl),
        seq($._directive_list, $._nl),
        seq(optional($.paragraph), $._element),
      ),
      prec('body_directive', repeat($._nl)),
    ))),

    // Section ============================================= {{{1

    section: $ => seq(
      $.headline, $._eol,
      optional($.plan),
      optional($.property_drawer),
      repeat($._nl),
      optional($.body),
      repeat($.section),
      $._sectionend,
    ),

    // Element ============================================= {{{1

    _element: $ => choice(
      $.comment,
      // Have attached directive:
      $.fndef,
      $.drawer,
      $.list,
      $.block,
      $.dynamic_block,
      $.table,
      $.latex_env,
    ),

    // Textelement ========================================= {{{1

    _textelement: $ => choice(
      $._text,
      $._te_conflicts,
      $.timestamp,

      $.footnote,
      $.link,

      $.markup,
      $.subscript,
      $.superscript,
      $.latex_fragment,
    ),

    // Paragraph =========================================== {{{1

    paragraph: $ => prec.right(seq(
      optional($._directive_list),
      $._start_of_paragraph, repeat($._textelement), $._eol,
      repeat(seq($._start_of_textline, repeat($._textelement), $._eol)),
    )),

    _start_of_paragraph: $ => choice(
      $._sol_conflicts,
      $._te_conflicts,
      $._text,
      $.timestamp,

      $.link,

      $.markup,
      $.subscript,
      $.superscript,
      $.latex_fragment,
    ),

    _start_of_textline: $ => choice(
      $._sol_conflicts,
      $._te_conflicts,
      $._text,
      $.timestamp,

      $.footnote,
      $.link,

      $.markup,
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
      optional($.cookie),
      optional(field('tags', $._taglist)),
    ),

    stars: $ => seq(prec.dynamic(10, $._stars), /\*+/),

    // the choice with ':' allows for the conflict of $.title to operate
    item: $ => seq(
      alias(choice($._text, /[ \t]:/), 'keyword?'),
      repeat(choice($._text, /[ \t]:/)),
    ),

    _taglist: $ => prec.dynamic(DYN.hltags,  // over title text
      seq(/[ \t]:/,
        repeat1(seq(
          $.tag,
          token.immediate(':')
        )))),

    tag: _ => token.immediate(/[\p{L}\p{N}_@#%]+/),

    property_drawer: $ => seq(
      caseInsensitive(':PROPERTIES:'),
      sep1(repeat1($._nl), $.property),
      caseInsensitive(':END:'),
      $._eol,
    ),

    property: $ => seq(
      ':',
      token.immediate(/[^\p{Z}\n\r:]+/),
      token.immediate(':'),
      repeat($._text),
    ),

    // Planning ============================================ {{{1

    _scheduled:     _ => caseInsensitive('SCHEDULED:'),
    _deadline:      _ => caseInsensitive('DEADLINE:'),
    _closed:        _ => caseInsensitive('CLOSED:'),

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

    _fn_textline: $ => prec.right(repeat1(seq(repeat1($._textelement), $._eol))),
    _fn: $ => caseInsensitive('[fn:'),

    fndef: $ => seq(
      optional($._directive_list),
      seq(
        $._fn,
        /[\p{L}\p{N}_-]+/,
        ']'
      ),
      $._fn_textline
    ),

    footnote: $ => seq(
      $._fn,
      choice(
        seq(':', sep1(repeat1($._textelement), $._nl)),
        seq(
          /[\p{L}\p{N}_-]+/,
          optional(seq(':', sep1(repeat1($._textelement), $._nl)))
        ),
      ),
      ']'
    ),

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

    drawer: $ => seq(
      optional($._directive_list),
      $._drawer_begin,
      repeat($._nl),
      repeat(seq(repeat1($._textelement), repeat1($._nl))),
      $._drawer_end,
    ),

    _drawer_begin: $ => seq(/:[\p{L}\p{N}\p{Pd}\p{Pc}]+:/, $._nl),
    _drawer_end: $ => seq(caseInsensitive(':END:'), $._eol),

    // Block =============================================== {{{1

    block: $ => seq(
      optional($._directive_list),
      $._block_begin,
      optional($.contents),
      $._block_end,
    ),

    _block_begin: $ => seq(
      caseInsensitive('#+BEGIN_'),
      alias($._name, $.name),
      optional(alias(repeat1($._text), $.parameters)),
      $._eol,
    ),

    _block_end: $ => seq(caseInsensitive('#+END_'), $._name, $._eol),

    _name: _ => token.immediate(/[^\p{Z}\n\r]+/),

    // Dynamic block ======================================= {{{1

    dynamic_block: $ => seq(
      optional($._directive_list),
      $._dynamic_begin,
      optional($.contents),
      $._dynamic_end,
    ),

    _dynamic_begin: $ => seq(
      caseInsensitive('#+BEGIN:'),
      alias(/[^\p{Z}\n\r]+/, $.name),
      optional(alias(repeat1($._text), $.parameters)),
      $._eol,
    ),

    _dynamic_end: $ => seq(
      caseInsensitive('#+END:'),
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
      $.bullet,
      optional($.checkbox),
      optional($.description),
      optional($.itemtext),
    ),

    checkbox: _ => /\[[ xX-]\]/,
    cookie: _ => /\[(\d*\/\d*|\d*%)\]/,
    description: $ => seq(
      repeat($._text),
      prec.dynamic(DYN.listtag, '::'), // precedence over itemtext
    ),

    itemtext: $ => seq(
      repeat1($._textelement),
      optional($.cookie),
      repeat(seq(
        $._nl,
        optional($._nl),
        choice(repeat1($._textelement), $.list)
      )),
    ),


    // Table =============================================== {{{1

    // prec so a new row is higher precedence than a new table
    table: $ => prec.right(seq(
      optional($._directive_list),
      repeat1(choice($.row, $.hr)),
      repeat($.formula),
    )),

    row: $ => seq(repeat1($.cell), '|', $._eol),
    cell: $ => seq('|', field('contents', repeat($._text))),
    hr: $ => seq(
      '|',
      repeat1(seq(/[-+]+/, '|')),
      $._eol,
    ),

    formula: $ => seq(caseInsensitive('#+TBLFM:'), field('formula', repeat($._text)), $._eol),

    // Latex environment =================================== {{{1

    latex_env: $ => seq(
      optional($._directive_list),
      $._env_begin,
      optional($.contents),
      $._env_end,
    ),

    _env_begin: $ => seq(
      caseInsensitive('\\begin{'),
      field('name', /[\p{L}\p{N}]+/),
      token.immediate('}'),
      $._eol
    ),

    _env_end: $ => seq(
      caseInsensitive('\\end{'),
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

    _te_conflicts: $ => prec.dynamic(DYN.conflicts, choice(
      $._active_start,
      $._inactive_start,
      seq($._markup, choice('*', '/', '_', '+', '~', '=', '`')),
      seq($._text, '^', /[^{]/),
      seq('$', token.immediate(/[^\p{Z}\n\r$]+/)),
      // seq($._text, '^', /[^{]/),
      seq($._text, token.immediate('_'), token.immediate(/[^\p{Z}]/)),
    )),

    _sol_conflicts: $ => prec.dynamic(DYN.conflicts, choice(
      /:[\p{L}\p{N}\p{Pd}\p{Pc}]+/,
      seq('\\', /[^\p{L}]+/),
    )),

    contents: $ => seq(
      repeat($._text),
      sep1(repeat1($._nl), repeat1($._text)),
    ),

  }
}; // }}}

function sep1(rule, separator) {                 // === {{{1
  return seq(rule, repeat(seq(separator, rule)))
}

function caseInsensitive(str) {                 // === {{{1
  return new RegExp(str
    .split('')
    .map(caseInsensitiveChar)
    .join('')
  )
}

function caseInsensitiveChar(char) {
  if (/[a-zA-Z]/.test(char)) return `[${char.toUpperCase()}${char.toLowerCase()}]`;
  return char.replace(/[\[\]^$.|?*+()\\\{\}]/, '\\$&');
}
// }}}

module.exports = grammar(org_grammar);
