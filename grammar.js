org_grammar = {
  // EXTERNALS, INLINE =================================== {{{1
  name: 'org',
  extras: _ => [' '],  // Treat newlines explicitly

  externals: $ => [
    $._liststart,
    $._listend,
    $._listitemend,
    $._bullet,
    $.stars,
    $._sectionend,
    $._markup,
  ],

  // inline: $ => [$._word, $._numbers, $._junk],
  // inline: $ => [ $._activeStart, $._activeEnd, $._inactiveStart, $._inactiveEnd,
  //   $._tsSeparator, $._ymd, $._dayname,],


  // PRECEDENCES, CONFLICT =============================== {{{1
  precedences: _ => [
    ['section', 'element', 'paragraph', 'textelement'],
    ['plan', 'textelement'],
    ['fn_definition', 'footnote'],
  ],

  conflicts: $ => [
    [$._text, $.bold],
    [$._text, $.italic],
    [$._text, $.underline],
    [$._text, $.strikethrough],
    [$._text, $.code],
    [$._text, $.verbatim],
    [$.item],
    [$._lastitem],
  ],

  rules: {
    // DOCUMENT, SECTIONS, BODY, & PARAGRAPH =============== {{{1

    document: $ => seq(
      optional($.body),
      repeat($.section),
    ),

    // SECTIONS, BODY, PARAGRAPH =========================== {{{1

    section: $ => prec.dynamic(1, prec('section',
      seq(
        $.headline, $._eol,
        optional(seq(
          optional(seq($.plan, $._eol)),
          optional(seq($.property_drawer, $._eol)),
          optional($.body),
          repeat($.section),
        )),
        $._sectionend,
      ))),

    _eol: _ => choice('\0', '\n', '\r'),
    _nl: _ => choice('\n', '\r'),

    body: $ => choice(
      repeat1($._eol),
      seq(
        repeat($._eol),
        repeat1(seq(
          choice(
            $._element,
            $.paragraph
          ),
          repeat($._eol),
        )),
      )),

    paragraph: $ => prec.right('paragraph',
      repeat1(seq(
        repeat1($._textelement),
        $._eol)
      )),

    // ELEMENT AND TEXTELEMENT ============================= {{{1

    _element: $ => choice(
        $.drawer,
        $.comment,
        $.fndef,
        $.directive,
        $.list,
        $.block,
        $.dynamic_block,
        // $.table,
      ),

    _textelement: $ => prec('textelement',
      choice(
        $._text,
        $.timestamp,
        $.footnote,
        $.link,
        $.bold,
        $.code,
        $.italic,
        $.verbatim,
        $.underline,
        $.strikethrough,
        // $.subscript
        // $.superscript
        // $.latexfragment
      )),

    // HEADLINES =========================================== {{{1

    headline: $ => seq(
      $.stars,
      $.item,
      optional($._taglist),
    ),

    item: $ => repeat1(choice($._text, ':')),

    _taglist: $ => prec.dynamic(1,  // otherwise just item
      seq(':',
        repeat1(seq(
          $.tag,
          token.immediate(':')
        )))),

    tag: _ => token.immediate(/[\p{L}\p{N}_@#%]+/),

    _propertyName:  _ => /:\p{Z}*:/,

    property_drawer: $ => seq(
      ':PROPERTIES:', $._eol,
      repeat(prec.right(seq(optional($.property), repeat1($._eol)))),
      ':END:',
    ),

    property: $ => seq(
      $._propertyName,
      repeat($._text),
    ),

    // PLANNING ============================================ {{{1

    _scheduled:     _ => 'SCHEDULED:',
    _deadline:      _ => 'DEADLINE:',
    _closed:        _ => 'CLOSED:',

    plan: $ => repeat1(prec('plan',
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
        $._inactiveTimestamp,
        $._inactiveTimestampRange,
      ), $.timestamp),
    ),

    // TIMESTAMP =========================================== {{{1

    _activeStart:   _ => '<',
    _activeEnd:     _ => '>',
    _inactiveStart: _ => '[',
    _inactiveEnd:   _ => ']',
    _tsSeparator:   _ => '--',
    _ymd:           _ => /\p{N}{1,4}-\p{N}{1,2}-\p{N}{1,4}/,
    time:           _ => /\p{N}?\p{N}:\p{N}\p{N}/,
    repeater:       _ => /[.+]?\+\p{N}+\p{L}/,
    delay:          _ => /--?\p{N}+\p{L}/,

    date: $ => seq($._ymd, optional(/\p{L}+/)),

    timestamp: $ => choice(
      $._activeTimestamp,
      $._activeTimestampRange,
      $._inactiveTimestamp,
      $._inactiveTimestampRange,
    ),

    _activeTimestamp: $ => seq(
      $._activeStart,
      $.date,
      optional($.time),
      optional($.repeater),
      optional($.delay),
      $._activeEnd,
    ),

    _inactiveTimestamp: $ => seq(
      $._inactiveStart,
      $.date,
      optional($.time),
      optional($.repeater),
      optional($.delay),
      $._inactiveEnd,
    ),

    _activeTimestampRange: $ => choice(
      seq(
        alias($._activeTimestamp, $.timestamp),
        $._tsSeparator,
        alias($._activeTimestamp, $.timestamp)),
      seq(
        $._activeStart,
        $.date,
        $.time, '-', $.time,
        optional($.repeater),
        optional($.delay),
        $._activeEnd,
      )
    ),

    _inactiveTimestampRange: $ => choice(
      seq($._inactiveTimestamp, $._tsSeparator, $._inactiveTimestamp),
      seq(
        $._inactiveStart,
        $.date,
        $.time, '-', $.time,
        optional($.repeater),
        optional($.delay),
        $._inactiveEnd,
      )
    ),

    // MARKUP ============================================== {{{1

    bold:          make_markup('*'),
    italic:        make_markup('/'),
    underline:     make_markup('_'),
    strikethrough: make_markup('+'),
    code:          make_markup('~', true),
    verbatim:      make_markup('=', true),

    // LINK ================================================ {{{1

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

    // FOOTNOTE ============================================ {{{1

    _fn_label: _ => /[^\p{Z}\[\]]+/,
    _fn: _ => '[fn:',

    fndef: $ => prec('fn_definition',
      seq(
        $._fn,
        $._fn_label,
        ']',
        $.paragraph,
      )),

    footnote: $ => prec('footnote',
      seq(
        $._fn,
        choice(
          $._fn_label,
          seq(optional($._fn_label), ':', repeat1($._fn_label)),
        ),
        ']',
      )),

    // DIRECTIVE =========================================== {{{1

    directive: $ => seq(
      '#+',
      token.immediate(/[^\p{Z}:]+/), // name
      token.immediate(':'),
      repeat($._text),
      $._eol,
    ),

    // COMMENTS ============================================ {{{1

    comment: $ => prec.right(repeat1(seq(
      '# ', repeat($._text), $._eol
    ))),

    // DRAWER ============================================== {{{1

    drawer: $ => seq(
      ':',
      token.immediate(/[\p{L}\p{N}\p{Pd}\p{Pc}]+/),
      token.immediate(':'),
      $._eol,
      optional($.body),
      ':END:',
      $._eol,
    ),

    // BLOCK =============================================== {{{1

    block: $ => seq(
      '#+BEGIN_',
      alias($._name, $.name),
      optional($.parameters),
      $._nl,
      alias(
        repeat(seq(
          repeat($._textonly),
          $._nl,
        )),
        $.contents),
      '#+END_', $._name, // \P{Z} does not match newlines
      repeat($._junk), // FIXME
      $._eol,
    ),

    _name: _ => token.immediate(/[^\p{Z}\n\r]+/),

    // DYNAMIC BLOCK ======================================= {{{1

    dynamic_block: $ => prec(1, seq( // FIXME why is this precedence required?
      '#+BEGIN:',
      optional(alias($._text, $.name)),
      optional($.parameters),
      // optional(alias(repeat1(/\S+/), $.parameters)),
      $._eol,
      alias(repeat(seq(
        repeat($._textonly),
        $._nl,
      )), $.contents),
      '#+END:',
      repeat($._junk), // FIXME
      $._eol,
    )),

    parameters: $ => repeat1($._text),

    // LISTS =============================================== {{{1

    list: $ => seq(
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
      optional($._eol),
    ),

    _checkbox: _ => /\[[ xX-]\]/,
    _itemtag: $ => seq(repeat($._textelement), '::'),

    _itemtext: $ => seq(
      repeat1($._textelement),
      repeat(seq(
        $._eol,
        optional($._eol),
        choice(repeat1($._textelement), $.list)
      )),
    ),


    // TEXT ================================================ {{{1

    // TODO: inline word/numbers/junk. Causes precedence issues
    // A repeat would also be nice.
    _textonly: $ => choice($._word,
      $._numbers,
      $._junk,
    ),

    _text: $ => choice(
      $._word,
      $._numbers,
      $._junk,

      $._activeStart, // Causes conflicts, so they get marked as text.
      $._inactiveStart,

      seq($._markup, '*'),
      seq($._markup, '/'),
      seq($._markup, '_'),
      seq($._markup, '+'),
      seq($._markup, '~'),
      seq($._markup, '='),

      '#', // comment collision
    ),


    _word:          _ => /\p{L}+/,
    _numbers:       _ => /\p{N}+/,
    _junk:          _ => /[^\p{Z}\p{L}\p{N}]/,

  }
};

function make_markup(delim, textonly = false) {      // {{{1
  return $ => prec.left(seq(
    $._markup,
    delim,
    repeat1(textonly ? $._text : $._textelement),
    repeat(seq($._eol, repeat1(textonly ? $._text : $._textelement))),
    token.immediate(delim),
  ))
}

// }}}

module.exports = grammar(org_grammar);
