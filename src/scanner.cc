#include <tree_sitter/parser.h>
#include <vector>
#include <cwctype>
#include <cstring>
#include <cassert>
#include <stdio.h>

namespace {

using std::vector;
using std::iswspace;

enum TokenType {
  LISTSTART,
  LISTEND,
  LISTITEMEND,
  BULLET,
  HLSTARS,
  SECTIONEND,
  ENDOFFILE,
};

enum Bullet {
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
};

struct Scanner {
  vector<int16_t> indent_length_stack;
  vector<int16_t> bullet_stack;
  vector<int16_t> section_stack;

  Scanner() {
    deserialize(NULL, 0);
  }

  unsigned serialize(char *buffer) {
    size_t i = 0;

    size_t indent_count = indent_length_stack.size() - 1;
    if (indent_count > UINT8_MAX) indent_count = UINT8_MAX;
    buffer[i++] = indent_count;

    vector<int16_t>::iterator
    iter = indent_length_stack.begin() + 1,
    end = indent_length_stack.end();

    for (; iter != end && i < TREE_SITTER_SERIALIZATION_BUFFER_SIZE; ++iter) {
      buffer[i++] = *iter;
    }

    iter = bullet_stack.begin() + 1;
    end = bullet_stack.end();
    for (; iter != end && i < TREE_SITTER_SERIALIZATION_BUFFER_SIZE; ++iter) {
      buffer[i++] = *iter;
    }

    iter = section_stack.begin() + 1;
    end = section_stack.end();

    for (; iter != end && i < TREE_SITTER_SERIALIZATION_BUFFER_SIZE; ++iter) {
      buffer[i++] = *iter;
    }

    return i;
  }

  void deserialize(const char *buffer, unsigned length) {
    section_stack.clear();
    section_stack.push_back(0);
    indent_length_stack.clear();
    indent_length_stack.push_back(-1);
    bullet_stack.clear();
    bullet_stack.push_back(NOTABULLET);

    if (length == 0) return;

    size_t i = 0;

    size_t indent_count = (uint8_t)buffer[i++];

    for (; i <= indent_count    ; i++) indent_length_stack.push_back(buffer[i]);
    for (; i <= 2 * indent_count; i++) bullet_stack.push_back(buffer[i]);
    for (; i < length           ; i++) section_stack.push_back(buffer[i]);

  }

  void advance(TSLexer *lexer) {
    lexer->advance(lexer, false);
  }

  void skip(TSLexer *lexer) {
    lexer->advance(lexer, true);
  }

  bool dedent(TSLexer *lexer) {
    indent_length_stack.pop_back();
    bullet_stack.pop_back();
    lexer->result_symbol = LISTEND;
    return true;
  }

  Bullet getbullet(TSLexer *lexer) {
    if (lexer->lookahead == '-') {
      advance(lexer);
      if (iswspace(lexer->lookahead)) return DASH;
    } else if (lexer->lookahead == '+') {
      advance(lexer);
      if (iswspace(lexer->lookahead)) return PLUS;
    } else if (lexer->lookahead == '*') {
      advance(lexer);
      if (iswspace(lexer->lookahead)) return STAR;
    } else if ('a' <= lexer->lookahead && lexer->lookahead <= 'z') {
      advance(lexer);
      if (lexer->lookahead == '.') {
        advance(lexer);
        if (iswspace(lexer->lookahead)) return LOWERDOT;
      } else if (lexer->lookahead == ')') {
        advance(lexer);
        if (iswspace(lexer->lookahead)) return LOWERPAREN;
      }
    } else if ('A' <= lexer->lookahead && lexer->lookahead <= 'Z') {
      advance(lexer);
      if (lexer->lookahead == '.') {
        advance(lexer);
        if (iswspace(lexer->lookahead)) return UPPERDOT;
      } else if (lexer->lookahead == ')') {
        advance(lexer);
        if (iswspace(lexer->lookahead)) return UPPERPAREN;
      }
    } else if ('0' <= lexer->lookahead && lexer->lookahead <= '9') {
      do {
        advance(lexer);
      } while ('0' <= lexer->lookahead && lexer->lookahead <= '9');
      if (lexer->lookahead == '.') {
        advance(lexer);
        if (iswspace(lexer->lookahead)) return NUMDOT;
      } else if (lexer->lookahead == ')') {
        advance(lexer);
        if (iswspace(lexer->lookahead)) return NUMPAREN;
      }
    }
    return NOTABULLET;
  }

bool scan(TSLexer *lexer, const bool *valid_symbols) {

  // - Section ends
  int16_t indent_length = 0;
  lexer->mark_end(lexer);
  for (;;) {
    if (lexer->lookahead == ' ') {
      indent_length++;
    } else if (lexer->lookahead == '\t') {
      indent_length += 8;
    } else if (lexer->lookahead == '\0') {

      if (valid_symbols[LISTEND])    { lexer->result_symbol = LISTEND; }
      else if (valid_symbols[SECTIONEND]) { lexer->result_symbol = SECTIONEND; }
      else if (valid_symbols[ENDOFFILE])  { lexer->result_symbol = ENDOFFILE; }
      else return false;

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
  // 3. three eols
  if (lexer->lookahead == '\n') {
    if (valid_symbols[LISTEND] || valid_symbols[LISTITEMEND]) {
      int16_t newlines = 0;
      for (;;) {
        if (lexer->lookahead == ' ') {
          indent_length++;
        } else if (lexer->lookahead == '\t') {
          indent_length += 8;
        } else if (lexer->lookahead == '\0') {
          return dedent(lexer);
        } else if (lexer->lookahead == '\n') {
          if (++newlines > 2) return dedent(lexer);
          indent_length = 0;
        } else {
          break;
        }
        skip(lexer);
      }

      if (indent_length < indent_length_stack.back()) {
        return dedent(lexer);
      } else if (indent_length == indent_length_stack.back()) {
        if (getbullet(lexer) == bullet_stack.back()) {
          lexer->result_symbol = LISTITEMEND;
          return true;
        }
        return dedent(lexer);
      }
    }
    return false;
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

    if (valid_symbols[SECTIONEND] && iswspace(lexer->lookahead) && stars > 0 && stars <= section_stack.back()) {
      section_stack.pop_back();
      lexer->result_symbol = SECTIONEND;
      return true;
    } else if (valid_symbols[HLSTARS] && iswspace(lexer->lookahead)) {
      section_stack.push_back(stars);
      lexer->result_symbol = HLSTARS;
      return true;
    }
    return false;
  }

  // - Liststart and bullets
  if (valid_symbols[LISTSTART] || valid_symbols[BULLET]) {

    Bullet bullet = getbullet(lexer);

    if (valid_symbols[BULLET] && bullet == bullet_stack.back() && indent_length == indent_length_stack.back()) {
      lexer->mark_end(lexer);
      lexer->result_symbol = BULLET;
      return true;
    } else if (valid_symbols[LISTSTART] && bullet != NOTABULLET && indent_length > indent_length_stack.back()) {
      indent_length_stack.push_back(indent_length);
      bullet_stack.push_back(bullet);
      lexer->result_symbol = LISTSTART;
      return true;
    }
  }

  return false; // default
}
};

}

extern "C" {

void *tree_sitter_org_external_scanner_create() {
  return new Scanner();
}

bool tree_sitter_org_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  Scanner *scanner = static_cast<Scanner *>(payload);
  return scanner->scan(lexer, valid_symbols);
}

unsigned tree_sitter_org_external_scanner_serialize(void *payload, char *buffer) {
  Scanner *scanner = static_cast<Scanner *>(payload);
  return scanner->serialize(buffer);
}

void tree_sitter_org_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  Scanner *scanner = static_cast<Scanner *>(payload);
  scanner->deserialize(buffer, length);
}

void tree_sitter_org_external_scanner_destroy(void *payload) {
  Scanner *scanner = static_cast<Scanner *>(payload);
  delete scanner;
}

}
