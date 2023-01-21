'use strict'
const tokenize = require('./tokenize')
const createSyntaxTree = require('./create-syntax-tree')
const evaluate = require('./evaluate')

function parseTemplate (expression) {
  const tokens = tokenize(expression)
  const syntaxTree = createSyntaxTree(tokens)
  return function templateExpression (context) {
    return evaluate(syntaxTree, context)
  }
}

module.exports = {
  parseTemplate,

  evaluate (expression, context) {
    const template = parseTemplate(expression)
    return template(context)
  }
}


