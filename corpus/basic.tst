==============
Headlines.1a - No eols
==============
* l1
----------

(document (section (headline (stars) (item))))

==============
Headlines.1b - pre eol
==============

* l1
----------

(document (section (headline (stars) (item))))

==============
Headlines.1c - Post eols (body)
==============
* l1


----------

(document (section (headline (stars) (item))))

==============
Headlines.1d - More eols
==============

* l1


----------

(document (section (headline (stars) (item))))

==============
Headlines.2  - level 2
==============
** l2

----------

(document (section (headline (stars) (item))))

==============
Headlines.3a - Two sections
==============
* l1
* l1

----------

(document
  (section (headline (stars) (item)))
  (section (headline (stars) (item)))
  )

==============
Headlines.3b - Two sections, eol
==============
* l1

* l1
----------

(document
  (section (headline (stars) (item)))
  (section (headline (stars) (item)))
  )

==============
Headlines.4  - Subsection
==============
* l1
** l2

----------

(document
  (section
    (headline (stars) (item))
    (section (headline (stars) (item))))
  )

==============
Headlines.4a - Subsection eols
==============
* l1

** l2

----------

(document
  (section
    (headline (stars) (item))
    (section (headline (stars) (item)))
    ))

==============
Headlines.5  - Subsection & continued section
==============
* l1
** l2
* l1
----------

(document
  (section
    (headline (stars) (item))
    (section (headline (stars) (item))))
  (section (headline (stars) (item)))
  )

==============
Headlines.6  - Top high level section
==============
*** l3
* l1
----------

(document
  (section (headline (stars) (item)))
  (section (headline (stars) (item)))
  )

==============
Headlines.7a - Item/tag conflict (:)
==============
* a: b
----------

(document (section (headline (stars) (item))))

==============
Headlines.7b - Item/tag conflict (:)
==============
* a: b:
----------

(document (section (headline (stars) (item))))

==============
Headlines.8a - Tag
==============
* a :b:
----------

(document (section (headline (stars) (item) (tag))))

==============
Headlines.8b - Multitag
==============
* a :b:c:
----------

(document (section (headline (stars) (item) (tag) (tag))))

==============
Headlines.8c - Junk
==============
* a :b: c:
----------

(document (section (headline (stars) (item))))

==============
Headlines.9a - Non-markup
==============
* a *b
----------

(document
  (section
    (headline (stars) (item))
    ))

==============
Headlines.9b - Non-markup over newline
==============
* a *b
c*
----------

(document
  (section
    (headline (stars) (item))
    (body (paragraph))
    ))

==============
Headlines.10 - Precedences
==============
* a
  b

* c
  d
----------

(document
  (section
    (headline (stars) (item))
    (body (paragraph)))
  (section
    (headline (stars) (item))
    (body (paragraph)))
    )

===================
PropertyDrawer.1  -
===================
* b
:PROPERTIES:
:a: c
:END:
----------

(document
  (section
    (headline
      (stars)
      (item))
    (property_drawer
      (property))
    ))

===================
PropertyDrawer.2  -
===================
* C
:PROPERTIES:
:ab: [2021-02-21 Sun 13:30]
:END:

----------

(document
  (section
    (headline
      (stars)
      (item))
    (property_drawer
      (property))
    ))

==========
Body.1a
==========
a
----------

(document (body (paragraph)))

==========
Body.1b
==========
a
a
----------

(document (body (paragraph)))

==========
Body.1c
==========

a
----------

(document (body (paragraph)))

==========
Body.1d
==========
a

----------

(document (body (paragraph)))

==========
Body.1e
==========


a


----------

(document (body (paragraph)))

==========
Body.2
==========

# a
----------

(document (body (comment)))


==========
Body.6
==========
a

a
----------

(document (body (paragraph) (paragraph)))

==========
Body.7
==========

a

# a
----------

(document (body (paragraph) (comment)))

==========
Body.8
==========
# a

a

----------

(document (body (comment) (paragraph)))

==========
Body.9
==========

a

a

----------

(document (body (paragraph) (paragraph)))

==========
Paragraph.1
==========

a

----------

(document (body (paragraph)))

==========
Paragraph.2
==========
a

a
----------

(document (body (paragraph) (paragraph)))


==========
Paragraph.3a
==========
a
a

----------

(document (body (paragraph)))

==========
Paragraph.3b
==========
a
a

a

----------

(document (body (paragraph) (paragraph)))

==========
Paragraph.4
==========

a
a
a

a

----------

(document
    (body (paragraph) (paragraph))
    )

==========
Paragraph.5
==========

a
a
a

a
a

----------

(document
    (body (paragraph) (paragraph))
    )

==============
Timestamp.1  - Basic
==============
<1-1-1 a>
----------

(document
  (body
    (paragraph
      (timestamp (date)))
    ))

==============
Timestamp.2  - Repeater
==============
<1-1-1 a +1h>
----------

(document
  (body
    (paragraph
      (timestamp (date) (repeater)))
    ))

==============
Timestamp.3  - Delay
==============
<1-1-1 a -1d>
----------

(document
  (body
    (paragraph
      (timestamp (date) (delay)))
    ))

==============
Timestamp.4  - Repdel
==============
<1-1-1 a +1w -1m>
----------

(document
  (body
    (paragraph
      (timestamp (date) (repeater) (delay)))
    ))

==============
Timestamp.5  - Time
==============
<1-1-1 a 1:11>
----------

(document
  (body
    (paragraph
      (timestamp (date) (time)))
    ))

==============
Timestamp.6  - Time range
==============
<1-1-1 a 1:11-11:11>

----------

(document
  (body
    (paragraph
      (timestamp (date) (timerange (time) (time))))
    ))

==============
Timestamp.7  - Date range
==============
<1-1-1 a>--<1-1-1 a>
----------

(document (body (paragraph (timestamp (date) (date)))))

==============
Timestamp.8a - Junk
==============
[b]
---------------

(document
  (body
    (paragraph)
    ))

==============
Timestamp.8b - Junk
==============
<b>
---------------

(document
  (body
    (paragraph)
    ))

==========
Plan.1
==========
* headline
[1111-11-11 Day]
----------

(document
  (section
    (headline (stars) (item))
    (plan (timestamp (date)))
    ))

==========
Plan.2
==========
* headline
SCHEDULED: <1111-11-11 Day>

----------

(document
  (section
    (headline (stars) (item))
    (plan (scheduled (timestamp (date))))
    ))

=================
Plan.3
=================
* headline
DEADLINE: <1111-11-11 Day> <1111-11-11 Day> CLOSED: [1111-11-11 Day]

-----------------

(document
  (section
    (headline (stars) (item))
    (plan
      (deadline (timestamp (date)))
      (timestamp (date))
      (closed (timestamp (date))))
    ))

==========
Drawer.1
==========
:name:
:END:
----------

(document (body (drawer)))

==========
Drawer.2
==========
:name:
a
:END:
----------

(document (body (drawer)))

==========
Drawer.3 - Junk
==========
:l 1
----------

(document (body (paragraph)))

==========
Block.1  -
==========
#+BEGIN_A
#+END_B
----------

(document (body (block (name))))

====================
Block.1.lowercase  -
====================
#+begin_a
#+end_b
----------

(document (body (block (name))))

==========
Block.2  -
==========
#+BEGIN_SRC ABC
a
#+END_ABC
----------

(document (body (block (name) (parameters) (contents))))

====================
Block.2.lowercase  -
====================
#+begin_src abc
a
#+end_abc
----------

(document (body (block (name) (parameters) (contents))))

==========
Block.2  -
==========
* a

#+BEGIN_SRC ABC
a
#+END_ABC
----------

(document (section
            (headline (stars) (item))
            (body
              (block (name) (parameters) (contents))
              )))

=================
DynamicBlock.1  -
=================
#+BEGIN: a b
#+END:
----------

(document (body (dynamic_block (name) (parameters))))

===========================
DynamicBlock.1.lowercase  -
===========================
#+begin: a b
#+end:
----------

(document (body (dynamic_block (name) (parameters))))

=================
DynamicBlock.2  -
=================
#+BEGIN: a
c
#+END:
----------

(document (body (dynamic_block (name) (contents))))

===========================
DynamicBlock.2.lowercase  -
===========================
#+begin: a
c
#+end:
----------

(document (body (dynamic_block (name) (contents))))

==========
Link.1   - Description only
==========
[[link]]
----------

(document
  (body
    (paragraph (link (linktext)))
    ))

==========
Link.2   - Complete
==========
[[uri][link]]
----------

(document
  (body
    (paragraph (link (linktext) (linktext)))
    ))

==========
Link.3   - Junk
==========
[not [a link]]
----------

(document (body (paragraph)))

=============
Footnote.1  -
=============
a [fn:b]
----------

(document (body (paragraph (footnote))))

=============
Footnote.2  -
=============
inline def [fn:name:definition]
----------

(document (body (paragraph (footnote))))

=============
Footnote.3  -
=============
a [fn::b c]
----------

(document (body (paragraph (footnote))))


=============
Footnote.4  -
=============
[fn:name] definition
words
----------

(document (body (fndef)))

==========
Comment.1
==========
# a
----------

(document
  (body
    (comment)
    ))

==========
Comment.2
==========
# a

# a
----------

(document
  (body
    (comment)
    (comment)
    ))

===========
Markup.1a - markup
===========
a *b*
----------

(document
  (body
    (paragraph (markup))
    ))

===========
Markup.1b - markups
===========
a /b/
----------

(document
  (body
    (paragraph (markup))
    ))

===========
Markup.1c - markup
===========
a ~b~
----------

(document
  (body
    (paragraph (markup))
    ))

===========
Markup.1d - markup
===========
a _b_
----------

(document
  (body
    (paragraph (markup))
    ))

===========
Markup.1e - markup
===========
a =b=
----------

(document
  (body
    (paragraph (markup))
    ))

===========
Markup.1f - markup
===========
a +b+

----------

(document
  (body
    (paragraph (markup))
    ))

===========
Markup.2a - start of line
===========
*b*
----------

(document (body (paragraph (markup))))

===========
Markup.2b - start of line
===========
/b/
----------

(document (body (paragraph (markup))))

===========
Markup.2c - start of line
===========
+b+
----------

(document (body (paragraph (markup))))

==========
Markup.3a - Within
==========
a *b /c d/ e*
----------

(document (body (paragraph (markup (markup)))))

==========
Markup.3b - Within
==========
a _b ~c d~ e_
----------

(document (body (paragraph (markup (markup)))))

==========
Markup.3c - Within
==========
a =b +c d+ e=
----------

(document (body (paragraph (markup (markup)))))

==========
Markup.4 - Multi
==========
+a /b/ b+
----------

(document (body (paragraph (markup (markup)))))

===========
Markup.5a - Junk
===========
*b * a
----------

(document (body (paragraph)))

===========
Markup.5b - Junk
===========
+b + a
----------

(document (body (paragraph)))

===========
Markup.5c - Junk
===========
/b / a
----------

(document (body (paragraph)))

===========
Markup.5d - Junk
===========
b *a

* b* a
----------

(document
  (body (paragraph))
  (section (headline (stars) (item)))
  )

===========
Markup.6 - markup section
===========
* a
 *b*
----------

(document
  (section
    (headline (stars) (item))
    (body (paragraph (markup)))
    ))

===========
Markup.7 - Parens
===========
(/a/)
----------

(document (body (paragraph (markup))))

===========
Markup.8 - Not markup
===========
a/a/ b
----------

(document (body (paragraph)))

===========
Markup.9  - Together
===========
a _b_

a =b=
----------

(document
  (body
    (paragraph (markup))
    (paragraph (markup))
    ))

==========
List.1a  - Basic: dash [-]
==========
 - a
----------

(document
  (body
    (list (listitem (bullet) (itemtext)))
    ))

==========
List.1b  - Basic: plus [+]
==========
 + a
----------

(document
  (body
    (list (listitem (bullet) (itemtext)))
    ))

==========
List.1c  - Basic: star [*]
==========
 * a
----------

(document
  (body
    (list (listitem (bullet) (itemtext)))
    ))

==========
List.1d  - Basic: count dot [1.]
==========
 1. a
----------

(document
  (body
    (list (listitem (bullet) (itemtext)))
    ))

==========
List.1e  - Basic: count paren [1)]
==========
 1) a
----------

(document
  (body
    (list (listitem (bullet) (itemtext)))
    ))

==========
List.1f  - Basic: letter dot [a.]
==========
 1. a
----------

(document
  (body
    (list (listitem (bullet) (itemtext)))
    ))

==========
List.1g  - Basic: letter paren [a)]
==========
 1) a
----------

(document
  (body
    (list (listitem (bullet) (itemtext)))
    ))

==========
List.1h  - Basic: checkbox
==========
 - [ ] a
----------

(document
  (body
    (list (listitem (bullet) (checkbox) (itemtext)))
    ))

==========
List.1j  - Basic: description
==========
 - a :: description
----------

(document
  (body
    (list (listitem (bullet) (description) (itemtext)))
    ))
==========
List.2a  - two items
==========

  - a
  - a

----------

(document
  (body
    (list (listitem (bullet) (itemtext)) (listitem (bullet) (itemtext)))
    ))

==========
List.2d  - two items
==========

  1. a
  2. a

----------

(document
  (body
    (list (listitem (bullet) (itemtext)) (listitem (bullet) (itemtext)))
    ))

==========
List.2b  - two items
==========

  - a

  - a

----------

(document
  (body
    (list (listitem (bullet) (itemtext)) (listitem (bullet) (itemtext)))
    ))

==========
List.2c  - two lists
==========

  - a


  - a

----------

(document
  (body
    (list (listitem (bullet) (itemtext)))
    (list (listitem (bullet) (itemtext)))
    ))

==========
List.3a   - sublist
==========

  - a
    a
    - b
    a
  - a

----------

(document
  (body
    (list
      (listitem (bullet) (itemtext
        (list
          (listitem (bullet) (itemtext)))))
      (listitem (bullet) (itemtext))
    )))

==========
List.3b   - sublist with checkboxs
==========

  - [ ] a
    a
    - b
    - [ ] b
    a
  - a

==========
List.3b   - sublist with description and checkbox
==========

  - a :: description
    a
    - b :: description
    - [ ] b
    a
  - a

----------

(document
  (body
    (list
      (listitem (bullet) (description) (itemtext
        (list
          (listitem (bullet) (description) (itemtext))
          (listitem (bullet) (checkbox) (itemtext))
          )))
      (listitem (bullet) (itemtext))
    )))

==========
List.4a  - multiline item
==========

  - a
    b

----------

(document
  (body
    (list (listitem (bullet) (itemtext)))
    ))

==========
List.4b  - multiline item
==========

  - a

    b

----------

(document
  (body
    (list (listitem (bullet) (itemtext)))
    ))

==========
List.4c  - multiline item checkbox
==========

  - [ ] a
    b

----------

(document
  (body
    (list (listitem (bullet) (checkbox) (itemtext)))
    ))

==========
List.4d  - multiline item checkbox
==========

  - [ ] a

    b

----------

(document
  (body
    (list (listitem (bullet) (checkbox) (itemtext)))
    ))

==========
List.4e  - multiline item description
==========

  - a :: description
    b

----------

(document
  (body
    (list (listitem (bullet) (description) (itemtext)))
    ))

==========
List.4f  - multiline item description
==========

  - a :: description

    b

----------

(document
  (body
    (list (listitem (bullet) (description) (itemtext)))
    ))

==========
List.5   - dedent
==========

  - a
  b
  - a

----------

(document
  (body
    (list (listitem (bullet) (itemtext)))
    (paragraph)
    (list (listitem (bullet) (itemtext)))
    ))

==========
List.6   - multi dedent
==========

b
  - a
    - a
b

----------

(document
  (body
    (paragraph)
    (list
      (listitem (bullet) (itemtext
        (list (listitem (bullet) (itemtext))))))
    (paragraph)
    ))

==========
List.7a  - changing
==========

  - a
  + a

----------

(document
  (body
    (list (listitem (bullet) (itemtext)))
    (list (listitem (bullet) (itemtext)))
    ))

==========
List.8a  - Whitespace
==========
  - 
----------

(document (body (list (listitem (bullet)))))

==========
List.8b  - Whitespace after text
==========
  - a 
----------

(document (body (list (listitem (bullet) (itemtext)))))
==========
List.9   - With markup
==========
  - A *b* c
----------

(document (body (list (listitem (bullet) (itemtext (markup))))))

==============
Directive.1  - Document
==============
#+a: b

----------

(document (directive (name) (value)))

==============
Directive.2  - Bare
==============

#+a: b
----------

(document (body (directive (name) (value))))

==============
Directive.3  - Doc & Bare
==============
#+a: b

#+a: b
----------

(document (directive (name) (value)) (body (directive (name) (value))))

==============
Directive.4a - Attached
==============

#+a: b
c
----------

(document (body (paragraph (directive (name) (value)))))

==============
Directive.4b - Attached
==============
#+a: b
c
----------

(document (body (paragraph (directive (name) (value)))))

==============
Directive.5  - No empty lines
==============
* a
#+a: b
c
----------

(document
  (section
    (headline (stars) (item))
    (body (paragraph (directive (name) (value))))
    ))

==============
Directive.6a - List
==============

#+a: b
  - c
----------

(document (body (list (directive (name) (value)) (listitem (bullet) (itemtext)))))

==============
Directive.6b - Sublist
==============

#+a: b
  - c
    #+a: b
    - c

----------

(document (body (list (directive (name) (value)) (listitem (bullet) (itemtext (list (directive (name) (value)) (listitem (bullet) (itemtext))))))))

==============
Directive.7  - Directive unrelated to section
==============

#+a: b
* c
----------

(document (body (directive (name) (value))) (section (headline (stars) (item))))

=============
LatexEnv.1  -
=============
\begin{a}
\end{a}

----------

(document (body (latex_env)))

=============
LatexEnv.2  -
=============
\begin{a1}
a
\end{1a}
----------

(document (body (latex_env (contents))))

=============
LatexEnv.3  -
=============
\begin{a}

\end{a}
----------

(document (body (latex_env (contents))))

=============
LatexEnv.4a -
=============
\begin{a}

a
\end{a}
----------

(document (body (latex_env (contents))))

=============
LatexEnv.4b -
=============
\begin{a}
a

\end{a}
----------

(document (body (latex_env (contents))))

=============
LatexEnv.4c -
=============
\begin{a}

a

\end{a}
----------

(document (body (latex_env (contents))))

==================
LatexFragment.1  -
==================
a \b{c}{d}
----------

(document (body (paragraph (latex_fragment))))

==================
LatexFragment.2  -
==================
a $$b $ c$$ d
----------

(document (body (paragraph (latex_fragment))))

==================
LatexFragment.3  -
==================
a $$b
c$$ d
----------

(document (body (paragraph (latex_fragment))))

==================
LatexFragment.4  -
==================
a $b+c$ d
----------

(document (body (paragraph (latex_fragment))))

==================
LatexFragment.5  - Not a fragment -- use query
==================
a$b+c$d
----------

(document (body (paragraph)))

==================
LatexFragment.6  -
==================
\(a + b\)
----------

(document (body (paragraph (latex_fragment))))

==================
LatexFragment.7  -
==================
\[a + b\]
----------

(document (body (paragraph (latex_fragment))))

=============
Combined.1  -
=============
#+TITLE: A

* A
:PROPERTIES:
:l: 1
:END:
----------

(document
  (directive (name) (value))
  (section
    (headline (stars) (item))
    (property_drawer (property))
    ))

=============
Combined.2  -
=============
a
# a
----------

(document (body
  (paragraph)
  (comment)
  ))

=============
Combined.3  -
=============
a
# a
a
----------

(document (body
  (paragraph)
  (comment)
  (paragraph)
  ))

=============
Combined.4  -
=============
# a
a
----------

(document (body
  (comment)
  (paragraph)
  ))

=============
Combined.5  -
=============
# a
a
# a
----------

(document (body
  (comment)
  (paragraph)
  (comment)
  ))

=============
Combined.6a -
=============
[fn:a] b
a
----------

(document (body (fndef)))

=============
Combined.6b -
=============
a
[fn:a] b
----------

(document (body
  (paragraph
    (footnote))
  ))

=============
Combined.6c -
=============
a

[fn:a] b
----------

(document (body
  (paragraph)
  (fndef)
  ))

=============
Combined.7  -
=============
a
:AB:
c
:END:
----------

(document (body
  (paragraph)
  (drawer)
  ))

==================
Miscellaneous.1  -
==================
a_b
----------

(document (body (paragraph)))

==================
Miscellaneous.2  -
==================
a_b
a b+c
a c=a+d
----------

(document (body (paragraph)))

==========
Table.1  -
==========
|a|
----------

(document (body (table (row (cell)))))

==========
Table.2  -
==========
|a|b|
----------

(document (body (table
                  (row (cell) (cell))
                  )))

==========
Table.3  -
==========
|a|b|
|c|d|
----------

(document (body (table
                  (row (cell) (cell))
                  (row (cell) (cell))
                  )))

==========
Table.4  -
==========
|a|b|
| |d|
----------

(document (body (table
                  (row (cell) (cell))
                  (row (cell) (cell))
                  )))


==========
Table.5  -
==========
|| |
----------

(document (body (table
                  (row (cell) (cell))
                  )))

==========
Table.6  -
==========
|-|
----------

(document (body (table)))

==========
Table.7  -
==========
|a | b |  c|
|--+---+---|
|Some words about | something |
----------

(document (body (table
                  (row (cell) (cell) (cell))
                  (row (cell) (cell))
                  )))


==========
Table.8  -
==========
|a|b|
|c|d|
#+TBLFM: ab cd ef gh

----------

(document (body (table
                  (row (cell) (cell))
                  (row (cell) (cell))
                  (formula)
                  )))

==========
Table.9  -
==========
|a|b|
|c|d|
#+TBLFM: ab cd ef gh1
#+TBLFM: ab cd ef gh2
#+TBLFM: ab cd ef gh3

----------

(document (body (table
                  (row (cell) (cell))
                  (row (cell) (cell))
                  (formula)
                  (formula)
                  (formula)
                  )))
