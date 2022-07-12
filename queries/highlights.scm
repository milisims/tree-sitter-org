(headline (stars) @symbol (item) @text.title)

(item . (_) @text.todo (#eq? @text.todo "TODO"))
(item . (_) @text.todo.checked (#eq? @text.todo.checked "DONE"))

(tag_list (tag) @tag) @punctuation.delimiter

(property_drawer) @punctuation.bracket

(property name: (_) @property (value)? @constant)

(timestamp "[") @comment
(timestamp "<" (_)* @string.special) @punctuation.special

(fndef label: (_) @identifier (description) @normal) @punctuation.bracket

(directive name: (_) @preproc (value)? @string) @punctuation.bracket

(comment) @comment

(drawer (name) @identifier (contents) @text) @punctuation.bracket

(block
  name: (name) @identifier
  parameter: (_)* @parameter
  contents: (contents)? @text
  ) @punctuation.bracket

(dynamic_block
  name: (name) @identifier.name
  parameter: (_)* @parameter
  contents: (contents)? @text
  ) @punctuation.bracket

(block
  name: (name) @_name
  end_name: (_) @text.danger (#not-eq? @_name @text.danger)
  )

(dynamic_block
  name: (name) @_name
  end_name: (_) @text.danger (#not-eq? @_name @text.danger)
  )

(bullet) @punctuation.special

(checkbox) @punctuation.delimiter
(checkbox status: (_) @text.todo.unchecked (#eq? @text.todo.unchecked "-"))
(checkbox status: (_) @text.todo.checked (#any-of? @text.todo.checked "x" "X"))
(checkbox status: (_) @text.danger (#not-any-of? @text.danger "x" "X" "-"))

(hr) @punctuation.delimiter

(paragraph) @spell
(fndef (description) @spell)
