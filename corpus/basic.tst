==============
Headlines.1a - No eols
==============
* l1
----------

(document (section (headline (stars) (title))))

==============
Headlines.1b - pre eol
==============

* l1
----------

(document (body) (section (headline (stars) (title))))

==============
Headlines.1c - Post eols (body)
==============
* l1


----------

(document (section (headline (stars) (title)) (body)))

==============
Headlines.1d - More eols
==============

* l1


----------

(document (body) (section (headline (stars) (title)) (body)))

==============
Headlines.2  - level 2
==============
** l2

----------

(document (section (headline (stars) (title))))

==============
Headlines.3  - Two sections
==============
* l1
* l1

----------

(document
  (section (headline (stars) (title)))
  (section (headline (stars) (title)))
  )

==============
Headlines.3a - Two sections, eol
==============
* l1

* l1
----------

(document
  (section (headline (stars) (title)) (body))
  (section (headline (stars) (title)))
  )

==============
Headlines.4  - Subsection
==============
* l1
** l2

----------

(document
  (section
    (headline (stars) (title))
    (section (headline (stars) (title))))
  )

==============
Headlines.4a - Subsection eols
==============
* l1

** l2

----------

(document
  (section
    (headline (stars) (title))
    (body)
    (section (headline (stars) (title)))
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
    (headline (stars) (title))
    (section (headline (stars) (title))))
  (section (headline (stars) (title)))
  )

==============
Headlines.6  - Top high level section
==============
*** l3
* l1
----------

(document
  (section (headline (stars) (title)))
  (section (headline (stars) (title)))
  )

==============
Headlines.7a - Item/tag conflict (:)
==============
* a: b
----------

(document (section (headline (stars) (title))))

==============
Headlines.7b - Item/tag conflict (:)
==============
* a: b:
----------

(document (section (headline (stars) (title))))

==============
Headlines.8a - Tag
==============
* a :b:
----------

(document (section (headline (stars) (title) (tag))))

==============
Headlines.8b - Multitag
==============
* a :b:c:
----------

(document (section (headline (stars) (title) (tag) (tag))))

==============
Headlines.8c - Junk
==============
* a :b: c:
----------

(document (section (headline (stars) (title))))

==============
Headlines.9a - Non-markup
==============
* a *b
----------

(document
  (section
    (headline (stars) (title))
    ))

==============
Headlines.9b - Non-markup over newline
==============
* a *b
c*
----------

(document
  (section
    (headline (stars) (title))
    (body (paragraph))
    ))

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
      (title))
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
      (title))
    (property_drawer
      (property))
    ))

==========
Body.1
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
Body.3
==========
a

----------

(document (body (paragraph)))

==========
Body.4
==========

a

----------

(document (body (paragraph)))

==========
Body.5
==========
a
----------

(document (body (paragraph)))

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
* headline
words
words
words

words
words

----------

(document
  (section
    (headline (stars) (title))
    (body (paragraph) (paragraph))
    ))

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
Plan
==========
* headline
[1111-11-11 Day]
----------

(document
  (section
    (headline (stars) (title))
    (plan (timestamp (date)))
    ))

==========
Scheduled
==========
* headline
SCHEDULED: <1111-11-11 Day>

----------

(document
  (section
    (headline (stars) (title))
    (plan (scheduled (timestamp (date))))
    ))

=================
Multiple plan
=================
* headline
DEADLINE: <1111-11-11 Day> <1111-11-11 Day> CLOSED: [1111-11-11 Day]

-----------------

(document
  (section
    (headline (stars) (title))
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

(document (body (drawer (body (paragraph)))))

==========
Drawer.3
==========
:name:
a

a
:END:
----------

(document (body (drawer (body (paragraph) (paragraph)))))

==========
Drawer.4
==========
:name:
:name:
a
:END:
a
:END:
----------

(document
  (body
    (drawer
      (body
        (drawer (body (paragraph)))
        (paragraph))
      )))

==========
Drawer.5 - Junk
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

==========
Block.2  -
==========
#+BEGIN_SRC ABC
a
#+END_ABC
----------

(document (body (block (name) (parameters) )))

=================
DynamicBlock.1  -
=================
#+BEGIN: a b
#+END:
----------

(document (body (dynamic_block (name) (parameters))))

=================
DynamicBlock.2  -
=================
#+BEGIN: a
c
#+END:
----------

(document (body (dynamic_block (name) )))

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

==========
Footnote.1
==========
a [fn:b]
----------

(document (body (paragraph (footnote))))

==========
Footnote.2
==========
inline def [fn:name:definition]
----------

(document (body (paragraph (footnote))))

==========
Footnote.3
==========
[fn:name] definition
words
----------

(document (body (fndef)))

==========
Comment.1
==========
# Comment
----------

(document
  (body
    (comment)
    ))

==========
Comment.2
==========
text
# Comment
----------

(document
  (body
    (paragraph)
    (comment)
    ))

==========
Comment.3
==========
# Comment
text
----------

(document
  (body
    (comment)
    (paragraph)
    ))

==========
Comment.4
==========
text
# Comment
text

# Comment
# Comment
----------

(document
  (body
    (paragraph)
    (comment)
    (paragraph)
    (comment)
    ))


===========
Markup.1  - Ya basic
===========
a *b*
a /b/
a ~b~
a _b_
a =b=
a +b+

----------

(document
  (body
    (paragraph
      (bold)
      (italic)
      (code)
      (underline)
      (verbatim)
      (strikethrough))
    ))

===========
Markup.2a - start of line
===========
*b*
----------

(document (body (paragraph (bold))))

===========
Markup.2b - start of line
===========
/b/
----------

(document (body (paragraph (italic))))

===========
Markup.2c - start of line
===========
+b+
----------

(document (body (paragraph (strikethrough))))

==========
Markup.3a - Within
==========
a *b /c d/ e*
----------

(document (body (paragraph (bold (italic)))))

==========
Markup.3b - Within
==========
a _b ~c d~ e_
----------

(document (body (paragraph (underline (code)))))

==========
Markup.3c - Within
==========
a =b +c d+ e=
----------

(document (body (paragraph (verbatim))))

==========
Markup.4 - Multi
==========
+a /b/ b+
----------

(document (body (paragraph (strikethrough (italic)))))

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
  (section (headline (stars) (title)))
  )

===========
Markup.6 - Bold section
===========
* a
 *b*
----------

(document
  (section
    (headline (stars) (title))
    (body (paragraph (bold)))
    ))

==========
List.1a  - Basic: dash [-]
==========
 - a
----------

(document
  (body
    (list (listitem))
    ))

==========
List.1b  - Basic: plus [+]
==========
 + a
----------

(document
  (body
    (list (listitem))
    ))

==========
List.1c  - Basic: star [*]
==========
 * a
----------

(document
  (body
    (list (listitem))
    ))

==========
List.1d  - Basic: count dot [1.]
==========
 1. a
----------

(document
  (body
    (list (listitem))
    ))

==========
List.1e  - Basic: count paren [1)]
==========
 1) a
----------

(document
  (body
    (list (listitem))
    ))

==========
List.1f  - Basic: letter dot [a.]
==========
 1. a
----------

(document
  (body
    (list (listitem))
    ))

==========
List.1g  - Basic: letter paren [a)]
==========
 1) a
----------

(document
  (body
    (list (listitem))
    ))

==========
List.2a  - two items
==========

  - a
  - a

----------

(document
  (body
    (list (listitem) (listitem))
    ))

==========
List.2d  - two items
==========

  1. a
  2. a

----------

(document
  (body
    (list (listitem) (listitem))
    ))

==========
List.2b  - two items
==========

  - a

  - a

----------

(document
  (body
    (list (listitem) (listitem))
    ))

==========
List.2c  - two lists
==========

  - a


  - a

----------

(document
  (body
    (list (listitem))
    (list (listitem))
    ))

==========
List.3   - sublist
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
      (listitem
        (list (listitem)))
      (listitem)
      )))

==========
List.4a  - multiline item
==========

  - a
    b

----------

(document
  (body
    (list (listitem))
    ))

==========
List.4b  - multiline item
==========

  - a

    b

----------

(document
  (body
    (list (listitem))
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
    (list (listitem))
    (paragraph)
    (list (listitem))
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
      (listitem
        (list (listitem))))
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
    (list (listitem))
    (list (listitem))
    ))

==========
List.8   - Whitespace
==========
  - 
----------

(document (body (list (listitem))))

==============
Directive.1  - Document
==============
#+a: b
----------

(document (directive))

==============
Directive.2  - Bare
==============

#+a: b
----------

(document (body (directive)))

==============
Directive.3  - Doc & Bare
==============
#+a: b

#+a: b
----------

(document (directive) (body (directive)))

==============
Directive.4  - Attached
==============

#+a: b
hello there
----------

(document (body (paragraph (directive))))

==============
Directive.5  - No empty lines
==============
* a
#+a: b
c
----------

(document
  (section
    (headline (stars) (title))
    (body (paragraph (directive)))
    ))

==============
Directive.5  - Precedences
==============

c
#+a: b
d
----------

(document (body (paragraph) (paragraph (directive))))

==============
Directive.6a - List
==============

#+a: b
  - c
----------

(document (body (list (directive) (listitem))))

==============
Directive.6b - Sublist
==============

#+a: b
  - c
    #+a: b
    - c

----------

(document (body (list (directive) (listitem (list (directive) (listitem))))))

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

(document (body (latex_env )))

=============
LatexEnv.3  -
=============
\begin{a}

\end{a}
----------

(document (body (latex_env )))

=============
LatexEnv.4a -
=============
\begin{a}

a
\end{a}
----------

(document (body (latex_env )))

=============
LatexEnv.4b -
=============
\begin{a}
a

\end{a}
----------

(document (body (latex_env )))

=============
LatexEnv.4c -
=============
\begin{a}

a

\end{a}
----------

(document (body (latex_env )))

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
  (directive)
  (section
    (headline (stars) (title))
    (property_drawer (property))
    ))
