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

(document (body) (section (headline (stars) (item))))

==============
Headlines.1c - Post eols (body)
==============
* l1


----------

(document (section (headline (stars) (item)) (body)))

==============
Headlines.1d - More eols
==============

* l1


----------

(document (body) (section (headline (stars) (item)) (body)))

==============
Headlines.2  - level 2
==============
** l2

----------

(document (section (headline (stars) (item))))

==============
Headlines.3  - Two sections
==============
* l1
* l1

----------

(document
  (section (headline (stars) (item)))
  (section (headline (stars) (item)))
  )

==============
Headlines.3a - Two sections, eol
==============
* l1

* l1
----------

(document
  (section (headline (stars) (item)) (body))
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
    (body)
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
Headlines.8  - Tag
==============
* a :b:
----------

(document (section (headline (stars) (item) (tag))))

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
    (headline (stars) (item))
    (body (paragraph) (paragraph))
    ))

==========
Timestamp.1
==========
<1111-11-11 day>

----------

(document
  (body
    (paragraph
      (timestamp (date)))
    ))

==========
Timestamp.2
==========
<1111-11-11 day +1h>

----------

(document
  (body
    (paragraph
      (timestamp (date) (repeater)))
    ))

==========
Timestamp.3
==========
<1111-11-11 day -1d>

----------

(document
  (body
    (paragraph
      (timestamp (date) (delay)))
    ))

==========
Timestamp.4
==========
<1111-11-11 day +1w -1m>

----------

(document
  (body
    (paragraph
      (timestamp (date) (repeater) (delay)))
    ))

==========
Timestamp.5
==========
<1111-11-11 day 11:11>

----------

(document
  (body
    (paragraph
      (timestamp (date) (time)))
    ))

==========
Timestamp.6
==========
<1111-11-11 day 11:11-11:11>

----------

(document
  (body
    (paragraph
      (timestamp (date) (time) (time)))
    ))

==========
Timestamp.7
==========
<1111-11-11 day 11:11>--<1111-11-11 day 11:11 +1d>

----------

(document
  (body
    (paragraph
      (timestamp
        (timestamp (date) (time))
        (timestamp (date) (time) (repeater)))
      )))

===============
Timestamp.8   - Junk
===============
[b]
---------------

(document
  (body
    (paragraph)
    ))

===============
Timestamp.9   - Junk
===============
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
    (headline (stars) (item))
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
    (headline (stars) (item))
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

(document (body (block (name) (parameters) (contents))))

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

(document (body (fndef (paragraph))))

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
Markup.5  - Junk
===========

*b * a

* b* a

----------

(document (body (paragraph)) (section (headline (stars) (item))))


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

==============
Directive.1  -
==============
#+a: b
----------

(document (body (directive)))
