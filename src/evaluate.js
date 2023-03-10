'use strict'

module.exports = function evaluate (syntaxTree, context, methods) {
  return nodeEvaluator(context, methods)(syntaxTree)
}

// Bind a getValue function to the context and methods.
// Inject getValue, context and methods into the different
// operations as needed.
// This gets us a compact recursive implementation to traverse
// the syntax tree.
function nodeEvaluator (context, methods) {
  return function getValue (node) {
    if (node.type === 'string') return node.value
    if (node.type === 'number') return node.value
    if (node.type === 'boolean') return node.value
    if (node.type === 'expression') return expression(node, getValue)
    if (node.type === 'function') return func(node, getValue, methods)
    if (node.type === 'variable') return variable(node, context)
    if (node.type === 'pipe') return pipe(node, getValue, methods)
    if (node.type === 'concat') return concat(node, getValue)
    if (node.type === 'addition') return addition(node, getValue)
    if (node.type === 'subtraction') return subtraction(node, getValue)
    if (node.type === 'multiplication') return multiplication(node, getValue)
    if (node.type === 'division') return division(node, getValue)
    if (node.type === 'modulo') return modulo(node, getValue)
    if (node.type === 'greaterThan') return greaterThan(node, getValue)
    if (node.type === 'greaterThanOrEqual') return greaterThanOrEqual(node, getValue)
    if (node.type === 'lessThan') return lessThan(node, getValue)
    if (node.type === 'lessThanOrEqual') return lessThanOrEqual(node, getValue)
    if (node.type === 'strictEqual') return strictEqual(node, getValue)
    if (node.type === 'strictNotEqual') return strictNotEqual(node, getValue)
    if (node.type === 'and') return and(node, getValue)
    // istanbul ignore else
    if (node.type === 'or') return or(node, getValue)
    else throw new Error(`Unknown syntax tree node: ${node.type}`)
  }
}

function concat (node, getValue) {
  return node.parts.map(getValue).join('')
}

function expression (node, getValue) {
  if (!node.statement) return
  return getValue(node.statement)
}

// Get the value from context by the accessor path in node.value
// return undefined if the value is not found
function variable (node, context) {
  const parts = node.name.split('.')
  let value = context
  for (const propertyName of parts) {
    if (!value?.hasOwnProperty(propertyName)) return
    value = value[propertyName]
  }
  return value
}

function func (node, getValue, methods) {
  const method = methods?.hasOwnProperty(node.name) && methods[node.name]
  if (!method) throw new Error(`Unknown method: ${node.name}`)

  return method(...node.args.map(getValue))
}

function pipe (node, getValue, methods) {
  const left = getValue(node.left)
  const right = node.right

  if (!(right.type === 'variable' || right.type === 'function')) {
    throw new Error(`Invalid pipe right hand side: ${right.type}`)
  }

  const method = methods?.hasOwnProperty(right.name) && methods[right.name]
  if (!method) throw new Error(`Unknown method: ${right.name}`)

  return right.args?.length
    ? method(left, ...right.args.map(getValue))
    : method(left)
}

function addition (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left + right
}

function subtraction (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left - right
}

function multiplication (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left * right
}

function division (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left / right
}

function modulo (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left % right
}

function greaterThan (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left > right
}

function greaterThanOrEqual (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left >= right
}

function lessThan (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left < right
}

function lessThanOrEqual (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left <= right
}

function strictEqual (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left === right
}

function strictNotEqual (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left !== right
}

function and (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left && right
}

function or (node, getValue) {
  const left = getValue(node.left)
  const right = getValue(node.right)
  return left || right
}


