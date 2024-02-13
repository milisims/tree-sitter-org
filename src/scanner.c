#include "./unicode_type.h"
#include "tree_sitter/parser.h"
#include <assert.h>

#define MAX(a, b) ((a) > (b) ? (a) : (b))

#define VEC_RESIZE(vec, _cap)                                                  \
  {                                                                            \
    (vec)->data = realloc((vec)->data, (_cap) * sizeof((vec)->data[0]));       \
    assert((vec)->data != NULL);                                               \
    (vec)->cap = (_cap);                                                       \
  }

#define VEC_PUSH(vec, el)                                                      \
  {                                                                            \
    if ((vec)->cap == (vec)->len) {                                            \
      VEC_RESIZE((vec), MAX(16, (vec)->len * 2));                              \
    }                                                                          \
    (vec)->data[(vec)->len++] = (el);                                          \
  }

#define VEC_POP(vec) (vec)->len--;

#define VEC_BACK(vec) ((vec)->data[(vec)->len - 1])

#define VEC_FREE(vec)                                                          \
  {                                                                            \
    if ((vec)->data != NULL)                                                   \
      free((vec)->data);                                                       \
  }

#define VEC_CLEAR(vec)                                                         \
  { (vec)->len = 0; }

#define CHECK(valid, cond, current)                                            \
  if (valid_symbols[valid] && cond) {                                          \
    scanner->lookbehind = (lookahead == NONE) ? NONE : current;                \
    lexer->result_symbol = valid;                                              \
    return true;                                                               \
  }

enum TokenType {
  LISTSTART,
  LISTEND,
  LISTITEMEND,
  BULLET,
  HLSTARS,
  SECTIONEND,
  ENDOFFILE,
  DRAWER_START,
  TAG_START,
  CHECKBOX_START,
  SETSTR,
  SETNUM,
  PREVSYM,
  PREVNUM,
  PREVSTR,
  NEXTSYM,
  NEXTNUM,
  NEXTSTR,
};

typedef enum {
  NOTABULLET,
  DASH,
  PLUS,
  STAR,
  LOWERDOT,
  UPPERDOT,
  LOWERPAREN,
  UPPERPAREN,
  NUMDOT,
  NUMPAREN,
} Bullet;

typedef struct {
  uint32_t len;
  uint32_t cap;
  int16_t *data;
} stack;

typedef struct {
  stack *indent_length_stack;
  stack *bullet_stack;
  stack *section_stack;
  TextNode lookbehind;
} Scanner;

bool isnl(unsigned int lookahead) {
  return (lookahead == '\n' || lookahead == '\0' || lookahead == '\r');
}

bool isuspace(unsigned int lookahead) {
  // see https://en.cppreference.com/w/cpp/string/wide/iswspace
  // removed newline characters
  return ((lookahead == ' ') || (lookahead == '\t') || (lookahead == '\v') ||
          (lookahead == '\f') || (lookahead == 5760) || (lookahead == 6158) ||
          (lookahead >= 8192 && lookahead <= 8198) ||
          (lookahead >= 8200 && lookahead <= 8202) || (lookahead == 8232) ||
          (lookahead == 8233) || (lookahead == 8287) || (lookahead == 12288));
}

bool iswsnl(unsigned int lookahead) {
  return (isuspace(lookahead) || isnl(lookahead));
}

static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

unsigned serialize(Scanner *scanner, char *buffer) {
  size_t i = 0;

  size_t indent_count = scanner->indent_length_stack->len - 1;
  if (indent_count > UINT8_MAX)
    indent_count = UINT8_MAX;
  buffer[i++] = indent_count;

  int iter = 1;
  for (; iter < scanner->indent_length_stack->len &&
         i < TREE_SITTER_SERIALIZATION_BUFFER_SIZE;
       ++iter) {
    buffer[i++] = scanner->indent_length_stack->data[iter];
  }

  iter = 1;
  for (; iter < scanner->bullet_stack->len &&
         i < TREE_SITTER_SERIALIZATION_BUFFER_SIZE;
       ++iter) {
    buffer[i++] = scanner->bullet_stack->data[iter];
  }

  if (i < TREE_SITTER_SERIALIZATION_BUFFER_SIZE)
    buffer[i++] = scanner->lookbehind;

  iter = 1;
  for (; iter < scanner->section_stack->len &&
         i < TREE_SITTER_SERIALIZATION_BUFFER_SIZE;
       ++iter) {
    buffer[i++] = scanner->section_stack->data[iter];
  }

  return i;
}

void deserialize(Scanner *scanner, const char *buffer, unsigned length) {
  VEC_CLEAR(scanner->section_stack);
  VEC_PUSH(scanner->section_stack, 0);
  VEC_CLEAR(scanner->indent_length_stack);
  VEC_PUSH(scanner->indent_length_stack, -1);
  VEC_CLEAR(scanner->bullet_stack);
  VEC_PUSH(scanner->bullet_stack, NOTABULLET);

  if (length == 0)
    return;

  size_t i = 0;

  size_t indent_count = (uint8_t)buffer[i++];

  for (; i <= indent_count; i++)
    VEC_PUSH(scanner->indent_length_stack, buffer[i]);
  for (; i <= 2 * indent_count; i++)
    VEC_PUSH(scanner->bullet_stack, buffer[i]);

  scanner->lookbehind = (TextNode)buffer[i++];
  for (; i < length; i++)
    VEC_PUSH(scanner->section_stack, buffer[i]);
}

static bool dedent(Scanner *scanner, TSLexer *lexer) {
  VEC_POP(scanner->indent_length_stack);
  VEC_POP(scanner->bullet_stack);
  lexer->result_symbol = LISTEND;
  return true;
}

static bool in_error_recovery(const bool *valid_symbols) {
  return (valid_symbols[LISTSTART] && valid_symbols[LISTEND] &&
          valid_symbols[LISTITEMEND] && valid_symbols[BULLET] &&
          valid_symbols[HLSTARS] && valid_symbols[SECTIONEND] &&
          valid_symbols[ENDOFFILE] && valid_symbols[DRAWER_START] &&
          valid_symbols[TAG_START] && valid_symbols[CHECKBOX_START] &&
          valid_symbols[SETSTR] && valid_symbols[SETNUM] &&
          valid_symbols[PREVSYM] && valid_symbols[PREVNUM] &&
          valid_symbols[PREVSTR] && valid_symbols[NEXTSYM] &&
          valid_symbols[NEXTNUM] && valid_symbols[NEXTSTR]);
}

Bullet getbullet(TSLexer *lexer) {
  if (lexer->lookahead == '-') {
    advance(lexer);
    if (isuspace(lexer->lookahead))
      return DASH;
  } else if (lexer->lookahead == '+') {
    advance(lexer);
    if (isuspace(lexer->lookahead))
      return PLUS;
  } else if (lexer->lookahead == '*') {
    advance(lexer);
    if (isuspace(lexer->lookahead))
      return STAR;
  } else if ('a' <= lexer->lookahead && lexer->lookahead <= 'z') {
    advance(lexer);
    if (lexer->lookahead == '.') {
      advance(lexer);
      if (isuspace(lexer->lookahead))
        return LOWERDOT;
    } else if (lexer->lookahead == ')') {
      advance(lexer);
      if (isuspace(lexer->lookahead))
        return LOWERPAREN;
    }
  } else if ('A' <= lexer->lookahead && lexer->lookahead <= 'Z') {
    advance(lexer);
    if (lexer->lookahead == '.') {
      advance(lexer);
      if (isuspace(lexer->lookahead))
        return UPPERDOT;
    } else if (lexer->lookahead == ')') {
      advance(lexer);
      if (isuspace(lexer->lookahead))
        return UPPERPAREN;
    }
  } else if ('0' <= lexer->lookahead && lexer->lookahead <= '9') {
    do {
      advance(lexer);
    } while ('0' <= lexer->lookahead && lexer->lookahead <= '9');
    if (lexer->lookahead == '.') {
      advance(lexer);
      if (isuspace(lexer->lookahead))
        return NUMDOT;
    } else if (lexer->lookahead == ')') {
      advance(lexer);
      if (isuspace(lexer->lookahead))
        return NUMPAREN;
    }
  }
  return NOTABULLET;
}

bool scan(Scanner *scanner, TSLexer *lexer, const bool *valid_symbols) {
  if (in_error_recovery(valid_symbols))
    return false;

  // Check for sym fields, next and prev.
  const TextNode lookahead = unicodetypeof[lexer->lookahead];
  CHECK(PREVSYM, scanner->lookbehind == SYM, SYM)
  CHECK(PREVNUM, scanner->lookbehind == NUM, SYM)
  CHECK(PREVSTR, scanner->lookbehind == STR, SYM)
  CHECK(NEXTSYM, lookahead == SYM, SYM)
  CHECK(NEXTNUM, lookahead == NUM, SYM)
  CHECK(NEXTSTR, lookahead == STR, SYM)
  // As well as setting str and num for the "lookbehind"
  CHECK(SETSTR, lookahead == SYM, STR)
  CHECK(SETNUM, lookahead == SYM, NUM)

  // - Section ends
  int16_t indent_length = 0;
  lexer->mark_end(lexer);
  for (;;) {
    if (lexer->lookahead == ' ') {
      indent_length++;
    } else if (lexer->lookahead == '\t') {
      indent_length += 8;
    } else if (lexer->lookahead == '\0') {
      if (valid_symbols[LISTEND]) {
        lexer->result_symbol = LISTEND;
      } else if (valid_symbols[SECTIONEND]) {
        lexer->result_symbol = SECTIONEND;
      } else if (valid_symbols[ENDOFFILE]) {
        lexer->result_symbol = ENDOFFILE;
      } else
        return false;

      return true;
    } else {
      break;
    }
    skip(lexer);
  }

  // - Listiem ends
  // Listend -> end of a line, looking for:
  // 1. dedent
  // 2. same indent, not a bullet
  // 3. two eols
  int16_t newlines = 0;
  if (valid_symbols[LISTEND] || valid_symbols[LISTITEMEND]) {
    for (;;) {
      if (lexer->lookahead == ' ') {
        indent_length++;
      } else if (lexer->lookahead == '\t') {
        indent_length += 8;
      } else if (lexer->lookahead == '\0') {
        return dedent(scanner, lexer);
      } else if (lexer->lookahead == '\n') {
        if (++newlines > 1)
          return dedent(scanner, lexer);
        indent_length = 0;
      } else {
        break;
      }
      skip(lexer);
    }

    if (indent_length < VEC_BACK(scanner->indent_length_stack)) {
      return dedent(scanner, lexer);
    } else if (indent_length == VEC_BACK(scanner->indent_length_stack)) {
      if (getbullet(lexer) == VEC_BACK(scanner->bullet_stack)) {
        lexer->result_symbol = LISTITEMEND;
        return true;
      }
      return dedent(scanner, lexer);
    }
  }

  if (valid_symbols[CHECKBOX_START] && lexer->lookahead == '[') {
    skip(lexer);
    lexer->result_symbol = CHECKBOX_START;
    if (lexer->lookahead == ' ') {
      skip(lexer);
      return lexer->lookahead == ']';
    }
    for (;;) {
      if (iswsnl(lexer->lookahead) || lexer->lookahead == '[') {
        return false;
      } else if (lexer->lookahead == ']') {
        return true;
      } else {
        skip(lexer);
      }
    }
  }

  if (valid_symbols[DRAWER_START] && lexer->lookahead == ':') {
    int16_t length = 0;
    skip(lexer);
    for (;;) {
      if (lexer->lookahead == ':') {
        lexer->result_symbol = DRAWER_START;
        return length > 0;
      } else if (iswsnl(lexer->lookahead)) {
        return false;
      } else {
        length++;
        skip(lexer);
      }
    }
  }

  if (valid_symbols[TAG_START] && lexer->lookahead == ':') {
    // char last = lexer->lookahead;
    int16_t tags = 0;
    int16_t tag_len = 0;
    skip(lexer);
    lexer->result_symbol = TAG_START;
    for (;;) {
      if (lexer->lookahead == ':') {
        if (tag_len > 0)
          tags++;
        tag_len = 0;
        skip(lexer);
      } else if (iswsnl(lexer->lookahead) && tags > 0 && tag_len == 0) {
        for (;;) {
          if (isuspace(lexer->lookahead))
            skip(lexer);
          else
            return isnl(lexer->lookahead);
        }
      } else if (iswsnl(lexer->lookahead)) {
        return false;
      } else {
        tag_len++;
        skip(lexer);
      }
    }
  }

  // - Col=0 star
  if (indent_length == 0 && lexer->lookahead == '*') {
    lexer->mark_end(lexer);
    int16_t stars = 1;
    skip(lexer);
    while (lexer->lookahead == '*') {
      stars++;
      skip(lexer);
    }

    if (valid_symbols[SECTIONEND] && isuspace(lexer->lookahead) && stars > 0 &&
        stars <= VEC_BACK(scanner->section_stack)) {
      VEC_POP(scanner->section_stack);
      lexer->result_symbol = SECTIONEND;
      return true;
    } else if (valid_symbols[HLSTARS] && isuspace(lexer->lookahead)) {
      VEC_PUSH(scanner->section_stack, stars);
      lexer->result_symbol = HLSTARS;
      return true;
    }
    return false;
  }

  // - Liststart and bullets
  if ((valid_symbols[LISTSTART] || valid_symbols[BULLET]) && newlines == 0) {
    Bullet bullet = getbullet(lexer);

    if (valid_symbols[BULLET] && bullet == VEC_BACK(scanner->bullet_stack) &&
        indent_length == VEC_BACK(scanner->indent_length_stack)) {
      lexer->mark_end(lexer);
      lexer->result_symbol = BULLET;
      return true;
    } else if (valid_symbols[LISTSTART] && bullet != NOTABULLET &&
               indent_length > VEC_BACK(scanner->indent_length_stack)) {
      VEC_PUSH(scanner->indent_length_stack, indent_length);
      VEC_PUSH(scanner->bullet_stack, bullet);
      lexer->result_symbol = LISTSTART;
      return true;
    }
  }

  return false; // default
}

void *tree_sitter_org_external_scanner_create() {
  Scanner *scanner = (Scanner *)calloc(1, sizeof(Scanner));
  scanner->indent_length_stack = (stack *)calloc(1, sizeof(stack));
  scanner->bullet_stack = (stack *)calloc(1, sizeof(stack));
  scanner->section_stack = (stack *)calloc(1, sizeof(stack));
  deserialize(scanner, NULL, 0);
  return scanner;
}

bool tree_sitter_org_external_scanner_scan(void *payload, TSLexer *lexer,
                                           const bool *valid_symbols) {
  Scanner *scanner = (Scanner *)payload;
  return scan(scanner, lexer, valid_symbols);
}

unsigned tree_sitter_org_external_scanner_serialize(void *payload,
                                                    char *buffer) {
  Scanner *scanner = (Scanner *)payload;
  return serialize(scanner, buffer);
}

void tree_sitter_org_external_scanner_deserialize(void *payload,
                                                  const char *buffer,
                                                  unsigned length) {
  Scanner *scanner = (Scanner *)payload;
  deserialize(scanner, buffer, length);
}

void tree_sitter_org_external_scanner_destroy(void *payload) {
  Scanner *scanner = (Scanner *)payload;
  VEC_FREE(scanner->indent_length_stack);
  VEC_FREE(scanner->bullet_stack);
  VEC_FREE(scanner->section_stack);
  free(scanner->indent_length_stack);
  free(scanner->bullet_stack);
  free(scanner->section_stack);
  free(scanner);
}
