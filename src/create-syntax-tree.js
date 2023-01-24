'use strict'
const isWhitespace = /^\s/
const isString = /^["'].*["']$/s // /s modifier (dotall) to match newlines with dot
const isNumber = /^-?\d+(\.\d+)?$/
const variableRegex = /^[a-zA-Z_$][a-zA-Z0-9_$.]*$/

module.exports = function createSyntaxTree (tokens, type = 'expression') {
  const state = {
    index: 0,
    tokens,
    tree: getRootContext(type),
    currentContext: undefined,
    contextStack: [],

    consumeToken () {
      const token = this.tokens[this.index]
      this.index += 1
      return token
    },

    consumeNonEmptyToken () {
      let token = this.consumeToken()
      while (isWhitespace.test(token)) {
        token = this.consumeToken()
      }
      return token
    },

    peekToken (index = this.index) {
      return this.tokens[index]
    },

    peekNonEmptyToken () {
      let token = this.peekToken()
      let i = this.index + 1
      while (isWhitespace.test(token)) {
        token = this.peekToken(i)
        i += 1
      }
      return token
    },

    setContext (context) {
      this.currentContext = context
      this.contextStack.push(context)
    },

    unsetContext () {
      const contextStack = this.contextStack
      contextStack.pop()
      this.currentContext = contextStack[contextStack.length - 1]
    },

    syntaxError (message) {
      // uncomment to debug
      // console.log(JSON.stringify(this.tree, null, 2))
      throw new Error(message)
    }
  }

  // intialize the currentContext
  state.setContext(state.tree)

  // To create the syntax tree, we can start by calling the
  // parseNextToken function with the state object. This
  // recursively builds the syntax tree from the tokens.
  parseNextToken(state)

  if (state.contextStack.length !== 1) {
    state.syntaxError('Unexpected end of input')
  }

  return state.tree
}

function getRootContext (type) {
  // istanbul ignore else
  if (type === 'expression') {
    return {
      type: 'expression',
      statement: undefined
    }
  } else if (type === 'concat') {
    return {
      type: 'concat',
      parts: []
    }
  } else {
    // Should never happen. Here for easier development.
    throw new Error(`Unexpected type: ${type}`)
  }
}

// Recursive descent parsing
//
// Iteratively build the syntax tree by parsing the tokens
// left to right.
function parseNextToken (state) {
  // istanbul ignore else
  if (state.currentContext.type === 'expression') {
    parseExpression(state)
  } else if (state.currentContext.type === 'concat') {
    parseConcat(state)
  } else if (state.currentContext.type === 'function') {
    const nextToken = state.peekNonEmptyToken()
    if (isFunctionEnd(nextToken)) {
      state.consumeNonEmptyToken()
      state.unsetContext()
      parseNextToken(state)
    } else {
      parseExpression(state)
    }
  } else {
    // Should never happen. Here for easier development.
    throw new Error(`Unexpected current context: ${state.currentContext.type}`)
  }
}

// Context Parsing

function parseExpression (state) {
  const token = state.consumeNonEmptyToken()
  if (!token) return

  const context = state.currentContext
  function setStatement (statement) {
    // istanbul ignore else
    if (context.type === 'expression') {
      if (context.statement) state.syntaxError(`Unexpected token: ${token}`)
      context.statement = statement
    } else if (context.type === 'function') {
      context.args.push(statement)
    } else {
      // Should never happen. Here for easier development.
      throw new Error(`Unexpected context type: ${context.type}`)
    }
  }

  // if next token is binary operator -> call binary operator parser
  if (isBinaryOperator(token)) {
    parseBinaryOperand(state, token)
    parseNextToken(state)
  } else if (isNumber.test(token)) {
    setStatement({type: 'number', value: Number(token)})
    parseNextToken(state)
  } else if (isString.test(token)) {
    setStatement({type: 'string', value: token.slice(1, -1)})
    parseNextToken(state)
  } else if (isBoolean(token)) {
    setStatement({type: 'boolean', value: token === 'true'})
    parseNextToken(state)
  } else if (isFunctionStart(state.peekToken()) && isVariable(token)) {
    state.consumeToken() // consume the opening parens
    const expression = {
      type: 'function',
      name: token,
      args: []
    }
    setStatement(expression)
    state.setContext(expression)
    parseNextToken(state)
  } else if (isVariable(token)) {
    setStatement({
      type: 'variable',
      name: token
    })
    parseNextToken(state)
  } else if (isComma(token) && context.type === 'function') {
    parseNextToken(state)
  } else if (isExpressionEnd(token)) {
    state.unsetContext()
    if (!(state.currentContext?.type === 'concat')) state.syntaxError(`Unexpected token: ${token}`)
    parseNextToken(state)
  } else {
    state.syntaxError(`Unexpected token: ${token}`)
  }
}

function parseBinaryOperand (state, operatorToken) {
  const rightToken = state.consumeNonEmptyToken()
  if (!rightToken) return state.syntaxError(`Missing right operand: ${operatorToken}`)

  const leftOperand = state.currentContext.statement
  if (!leftOperand) state.syntaxError(`Missing left operand: ${operatorToken}`)

  const type = getOperatorType(operatorToken)
  // istanbul ignore if
  if (!type) throw state.syntaxError(`Unknown operator: ${operatorToken}`)

  let rightOperand
  if (isNumber.test(rightToken)) {
    rightOperand = {type: 'number', value: Number(rightToken)}
  } else if (isString.test(rightToken)) {
    rightOperand = {type: 'string', value: rightToken.slice(1, -1)}
  } else if (isBoolean(rightToken)) {
    rightOperand = {type: 'boolean', value: rightToken === 'true'}
  } else if (isFunctionStart(state.peekToken()) && isVariable(rightToken)) {
    state.consumeToken() // consume the opening parens
    rightOperand = {
      type: 'function',
      name: rightToken,
      args: []
    }
  } else if (isVariable(rightToken)) {
    rightOperand = {type: 'variable', name: rightToken}
  } else {
    state.syntaxError(`Unexpected right operand: ${rightToken}`)
  }

  if (hasPrecedence(type, leftOperand.type)) {
    // Note: if there are more operators we might need to go down the tree
    // let parentNode = leftOperand
    // while (parentNode.right?.right) { parentNode = parentNode.right }
    const parentNode = leftOperand
    const prevOperand = parentNode.right
    parentNode.right = {
      type,
      left: prevOperand,
      right: rightOperand
    }
  } else {
    state.currentContext.statement = {
      type,
      left: leftOperand,
      right: rightOperand
    }
  }

  if (rightOperand.type === 'function') {
    state.setContext(rightOperand)
  }
}

function parseConcat (state) {
  const token = state.consumeToken()
  if (!token) return

  const concatContext = state.currentContext

  if (isExpressionStart(token)) {
    const entry = {
      type: 'expression',
      statement: undefined
    }

    concatContext.parts.push(entry)
    state.setContext(entry)
    parseNextToken(state)
  } else {
    concatContext.parts.push({type: 'string', value: token})
    parseConcat(state)
  }
}

// Token Recognition

function isExpressionStart (token) {
  return token === '{{'
}

function isExpressionEnd (token) {
  return token === '}}'
}

// Note: this is a postfix operator. There can be
// no whitespace between the parantheses and the function name.
function isFunctionStart (token) {
  return token === '('
}

function isFunctionEnd (token) {
  return token === ')'
}

function isVariable (token) {
  return variableRegex.test(token) && !token.endsWith('.')
}

function isBinaryOperator (token) {
  return !!getOperatorType(token)
}

function isComma (token) {
  return token === ','
}

function isBoolean (token) {
  return token === 'true' || token === 'false'
}

function getOperatorType (operatorToken) {
  if (operatorToken === '+') return 'addition'
  if (operatorToken === '-') return 'subtraction'
  if (operatorToken === '*') return 'multiplication'
  if (operatorToken === '/') return 'division'
  if (operatorToken === '%') return 'modulo'
  if (operatorToken === '>') return 'greaterThan'
  if (operatorToken === '>=') return 'greaterThanOrEqual'
  if (operatorToken === '<') return 'lessThan'
  if (operatorToken === '<=') return 'lessThanOrEqual'
  if (operatorToken === '===') return 'strictEqual'
  if (operatorToken === '!==') return 'strictNotEqual'
  if (operatorToken === '&&') return 'and'
  if (operatorToken === '||') return 'or'
  if (operatorToken === '|') return 'pipe'
}

// Precedence of all binary operators
//
// JavaScript operator precedence:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
const precedence = {
  multiplication: 12,
  division: 12,
  modulo: 12,
  addition: 11,
  subtraction: 11,
  greaterThan: 9,
  greaterThanOrEqual: 9,
  lessThan: 9,
  lessThanOrEqual: 9,
  strictEqual: 8,
  strictNotEqual: 8,
  and: 4,
  or: 3,
  pipe: 1
}
function hasPrecedence (type, leftType) {
  return !!precedence[leftType] && precedence[type] > precedence[leftType]
}
