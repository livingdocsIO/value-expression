'use strict'

// any whitespace or {{ or }} or content in "" or ''
const specialCharacterSplit = /(\{\{|\}\}|&&|\|\||[-+*/%(),]|"[^"]*"|'[^']*'|\s+)/

module.exports = function tokenize (expression) {
  // First, we can use a regular expression to split the expression
  // into individual tokens. For example, the expression “some text {{variable}}”
  // might be split into the following tokens:
  // [“some”, " ", “text”, " ", “{{“, “variable”, “}}”]
  let tokens = expression.split(specialCharacterSplit)

  // Next, we can iterate over the tokens and clean them up to remove
  // any unnecessary whitespace or empty token.
  tokens = tokens.filter(token => !!token)

  // Finally, we can return the array of tokens.
  return tokens
}
