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
    $._drawer_start,
    $._tag_start,
    $._checkbox_start,
    $._setstr,
    $._setnum,
    $._prevsym,
    $._prevnum,
    $._prevstr,
    $._nextsym,
    $._nextnum,
    $._nextstr,
  ],

  inline: $ => [
    $._nl,
    $._eol,
    $._ts_contents,
    $._directive_list,
    $._body_contents,
    $._multis,
    $._element,
    $.istr,
    $.inum,
    $.presym,
    $.midsym,
    $.postsym,
    $._ntype,
    $._ptype,
    $._iname,
    $._name,
  ],

  conflicts: $ => [
    [$.entry, $._isym],
    [$.timestamp, $._sym],
  ],

  rules: {

    document: $ => seq(
      optional(field('body', $.body)),
      repeat(field('subsection', $.section)),
    ),

    // Set up to prevent lexing conflicts of having two "multis" in a row.
    body: $ => $._body_contents,

    _body_contents: $ => choice(
      repeat1($._nl),
      seq(repeat($._nl), $._multis),
      seq(
        repeat($._nl),
        repeat1(seq(
          choice(
            seq($._multis, $._nl),
            seq(optional(choice($.paragraph, $.fndef, $.table)), $._element),
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
      $.table,
    ),

    _element: $ => choice(
      $.comment,
      // Have attached directive:
      $.drawer,
      $.list,
      $.block,
      $.dynamic_block,
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

    stars: $ => seq($._stars, repeat(field('sub', '*')), field('final', '*')),

    headline: $ => seq(
      field('stars', $.stars),
      /[ \t]+/, // so it's not part of (item), and is required
      optional(field('item', alias($._text_line, $.item))),
      optional(field('tags', $.tag_list)),
      $._eol
    ),

    tag_list: $ => seq(
      $._tag_start,
      ':',
      repeat1(seq(optional(field('tag', alias(token.immediate(/[^\p{Z}\t\n\r:]+/), $.tag))), ':')),
    ),

    property_drawer: $ => seq(
      $._drawer_start,
      caseInsensitive(':properties:'),  // priority over drawer, 1 longer token
      repeat1($._nl),
      repeat(seq($.property, repeat1($._nl))),
      caseInsensitive(':end:'),
      $._eol,
    ),

    property: $ => seq(
      ':',
      field('name', $._iname),
      token.immediate(':'),
      optional(field('value', alias($._text_line, $.value)))
    ),
    plan: $ => seq(repeat1($.entry), prec.dynamic(1, $._eol)),

    entry: $ => seq(
      optional(seq(
        field('name', alias($.str, $.name)),
        token.immediate(':'),
        $._prevstr,
      )),
      field('timestamp', $.timestamp)
    ),

    timestamp: $ => choice(
      // ntypes forces conflicts with paragraph parsing
      seq('<', optional($._nextnum), $._ts_contents, '>'),
      seq('<', optional($._nextnum), $._ts_contents, '>--<', $._ts_contents, '>'),
      seq('[', optional($._nextnum), $._ts_contents, ']'),
      seq('[', optional($._nextnum), $._ts_contents, ']--[', $._ts_contents, ']'),
      seq('<%%', alias($._tsexp_angle, $.tsexp), '>'),
      seq('[%%', alias($._tsexp_bracket, $.tsexp), ']'),
    ),

    _tsexp_angle: _ => repeat1(/[^\p{Z}\t\n\r<>]+/),
    _tsexp_bracket: _ => repeat1(/[^\p{Z}\t\n\r\[\]]+/),

    _ts_contents: $ => seq(
      field('date', $.date),
      repeat($._ts_element),
    ),

    date: _ => /\p{N}+(-\p{N}+)*/,

    _ts_element: $ => choice(
      field('day', alias(/\p{L}[^\]>\p{Z}\t\n\r]*/, $.day)),
      field('time', alias(/\p{N}?\p{N}[:.]\p{N}\p{N}( ?\p{L}{1,2})?/, $.time)),
      field('duration', alias(/\p{N}?\p{N}[:.]\p{N}\p{N}( ?\p{L}{1,2})?-\p{N}?\p{N}[:.]\p{N}\p{N}( ?\p{L}{1,2})?/, $.duration)),
      field('repeat', alias(/[.+]?\+\p{N}+\p{L}/, $.repeat)),
      field('delay', alias(/--?\p{N}+\p{L}/, $.delay)),
      alias(prec(-1, /[^\[<\]>\p{Z}\t\n\r]+/), $.expr),
    ),

    _directive_list: $ => repeat1(field('directive', $.directive)),
    directive: $ => seq(
      '#+',
      field('name', $._iname),
      token.immediate(':'),
      optional(field('value', alias($._text_line, $.value))),
      $._eol,
    ),

    comment: $ => prec.right(repeat1(seq(
      alias(/#[^+\n\r]/, "#"),
      optional($._text_line),
      $._eol,
    ))),

    drawer: $ => seq(
      optional($._directive_list),
      $._drawer_start,
      ':',
      field('name', $._iname),
      ':',
      $._nl,
      optional(field('contents', $.contents)),
      caseInsensitive(':end:'),
      $._eol,
    ),

    fndef: $ => seq(
      optional($._directive_list),
      seq(
        caseInsensitive('[fn:'),
        field('label', alias(/[^\p{Z}\t\n\r\]]+/, $.label)),
        ']',
      ),
      field('description', alias($._multiline_text, $.description))
    ),

    paragraph: $ => seq(optional($._directive_list), $._multiline_text),

    _multiline_text: $ => repeat1(seq($._text_line, alias($._eol, $.nl))),

    block: $ => seq(
      optional($._directive_list),
      caseInsensitive('#+begin_'),
      field('name', $._iname),
      field('parameter', optional($._text_line)),
      $._nl,
      optional(field('contents', $.contents)),
      caseInsensitive('#+end_'),
      field('end_name', $._iname),
      $._eol,
    ),

    dynamic_block: $ => seq(
      optional($._directive_list),
      caseInsensitive('#+begin:'),
      field('name', $._name),
      field('parameter', optional($._text_line)),
      $._nl,
      optional(field('contents', $.contents)),
      caseInsensitive('#+end:'),
      optional(field('end_name', $._name)),
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

    checkbox: $ => seq(
      $._checkbox_start,  // confirms interior is okay
      '[', // ]
      choice(' ', optional(field('status', alias(/[^\]]+/, $.status)))),
      ']',
    ),

    table: $ => seq(
      optional($._directive_list),
      repeat1(choice($.row, $.hr)),
      repeat($.formula),
    ),

    row: $ => seq('|', repeat1($.cell), $._eol),

    cell: $ => seq(
      optional(field('contents', alias($._text_line, $.contents))),
      '|',
    ),

    hr: $ => seq(
      token(seq(
        '|',
        token.immediate(/[-+]+/),
        token.immediate('|')
      )),
      $._eol
    ),

    formula: $ => seq(
      caseInsensitive('#+tblfm:'),
      field('formula', optional($._text_line)),
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
          token(seq(caseInsensitive('\\['), choice('\n', '\r'))),
          optional(field('contents', $.contents)),
          caseInsensitive('\\]'),
        ),
        seq(
          token(seq(caseInsensitive('\\('), choice('\n', '\r'))),
          optional(field('contents', $.contents)),
          caseInsensitive('\\)'),
        ),
      ),
      $._eol,
    ),

    contents: $ => seq(
      optional($._text_line),
      repeat1($.nl),
      repeat(seq($._text_line, repeat1($.nl))),
    ),

    _nl: _ => choice('\n', '\r'),
    _eol: $ => choice('\n', '\r', $._eof),
    nl: $ => $._nl,  // paragraphs, contents, fndef

    _text_line: $ => repeat1(choice(
      $.sym,
      seq(
        choice($.presym, $.str, $.num),
        repeat(choice($.midsym, $.istr, $.inum)),
        optional($.postsym),
      ),
    )),

    str: $ => seq(/\p{L}+/, optional($._setstr)),
    num: $ => seq(/\p{N}+/, optional($._setnum)),
    _istr: $ => seq(token.immediate(/\p{L}+/), optional($._setstr)),
    _inum: $ => seq(token.immediate(/\p{N}+/), optional($._setnum)),

    // inline defs:
    istr: $ => alias($._istr, $.str),
    inum: $ => alias($._inum, $.num),
    presym: $ => alias($._presym, $.sym),
    midsym: $ => alias($._midsym, $.sym),
    postsym: $ => alias($._postsym, $.sym),

    sym: $ => $._sym,
    _presym: $ => seq($._sym, field('next', $._ntypes)),
    _midsym: $ => seq($._isym, field('prev', $._ptypes), field('next', $._ntypes)),
    _postsym: $ => seq($._isym, field('prev', $._ptypes)),

    _ntypes: $ => choice(
      alias($._nextsym, 'sym'),
      alias($._nextnum, 'num'),
      alias($._nextstr, 'str'),
    ),

    _ptypes: $ => choice(
      alias($._prevsym, 'sym'),
      alias($._prevnum, 'num'),
      alias($._prevstr, 'str'),
    ),

    _sym: _ => choice(
      ...'!"#$%&\'()*+,-./:;<=>?@[]\\^_`{}~'.split(''),
      /[^\p{Z}\p{L}\p{N}\t\n\r]/,
    ),

    _isym: _ => choice(
      ...'!"#$%&\'()*+,-./:;<=>?@[]\\^_`{}~'.split('').map(token.immediate),
      token.immediate(/[^\p{Z}\p{L}\p{N}\t\n\r]/),
    ),

    _iname: $ => alias(token.immediate(/[^\p{Z}\t\n\r:]+/), $.name),
    _name: $ => alias(/[^\p{Z}\t\n\r:]+/, $.name),

  }
};

function regexEscape(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
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
  return regexEscape(char);
}

module.exports = grammar(org_grammar);
