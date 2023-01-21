'use strict'
const tokenize = require('../src/tokenize.js')
const createSyntaxTree = require('../src/create-syntax-tree.js')
const evaluate = require('../src/evaluate.js')

function parse (str, context, methods) {
  const tokens = tokenize(str)
  const syntaxTree = createSyntaxTree(tokens)
  return {tree: syntaxTree, result: evaluate(syntaxTree, context, methods)}
}

describe('functions:', function () {

  describe('syntax-tree', function () {

    it('parses a function expression', function () {
      const {tree, result} = parse(`foo()`, {}, {foo: () => 'fooCalled'})
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'function',
          name: 'foo',
          args: []
        }
      })
      expect(result).to.equal('fooCalled')
    })

    it('accepts a string param', function () {
      const {tree, result} = parse(`print("a")`, {}, {
        print: (param) => `print() -> ${param}`
      })

      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'function',
          name: 'print',
          args: [{
            type: 'string',
            value: 'a'
          }]
        }
      })
      expect(result).to.equal('print() -> a')
    })

    it('accepts a variable param', function () {
      const {tree, result} = parse(`print(metadata.title)`, {
        metadata: {
          title: 'Moby Dick'
        }
      }, {
        print: (param) => `print() -> ${param}`
      })

      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'function',
          name: 'print',
          args: [{
            type: 'variable',
            name: 'metadata.title'
          }]
        }
      })
      expect(result).to.equal('print() -> Moby Dick')
    })

    it('accepts two params', function () {
      const {tree, result} = parse(`add(1, 2)`, {}, {
        add: (a, b) => a + b
      })

      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'function',
          name: 'add',
          args: [{
            type: 'number',
            value: 1
          }, {
            type: 'number',
            value: 2
          }]
        }
      })
      expect(result).to.equal(3)
    })

    it('adds two functions', function () {
      const {tree, result} = parse(`foo() + bar() + "foo"`, {}, {
        foo: () => 'foo()',
        bar: () => 'bar()'
      })
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'addition',
          left: {
            type: 'addition',
            left: {
              type: 'function',
              name: 'foo',
              args: []
            },
            right: {
              type: 'function',
              name: 'bar',
              args: []
            }
          },
          right: {
            type: 'string',
            value: 'foo'
          }
        }
      })
      expect(result).to.equal('foo()bar()foo')
    })
  })

  describe('syntax-tree errors', function () {

    it('throws for missing closing parens', function () {
      expect(() => parse(`f(`)).to.throw('Unexpected end of input')
    })
  })
})
