'use strict'
const tokenize = require('../src/tokenize.js')
const createSyntaxTree = require('../src/create-syntax-tree.js')
const evaluate = require('../src/evaluate.js')

function parse (str, context, methods) {
  const tokens = tokenize(str)
  const syntaxTree = createSyntaxTree(tokens)
  return {tree: syntaxTree, result: evaluate(syntaxTree, context, methods)}
}

function assert (str, context, methods, result) {
  expect(parse(str, context, methods).result).to.equal(result, str)
}

describe('functions:', function () {

  describe('results', function () {

    it('pipes a method', function () {
      assert(`true && foo() | pipe`, {}, {
        foo: () => 'fooCalled',
        pipe: (param) => `pipe() -> ${param}`
      }, 'pipe() -> fooCalled')
    })

    it('pipes through multiple methods', function () {
      assert(`0 | inc | inc | inc`, {}, {
        inc: (num) => num + 1
      }, 3)
    })

    it('pipes through multiple methods with params', function () {
      assert(`0 | inc | inc | decorate(noun)`, {
        noun: 'houses'
      }, {
        inc: (num) => num + 1,
        decorate: (num, noun) => `decorate() -> ${num} ${noun}`
      }, 'decorate() -> 2 houses')
    })
  })

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

    it('pipes a value into a function', function () {
      const {tree, result} = parse(`"hey" | foo`, {}, {
        foo: (str) => `foo() -> ${str}`
      })
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'pipe',
          left: {
            type: 'string',
            value: 'hey'
          },
          right: {
            type: 'variable',
            name: 'foo'
          }
        }
      })
      expect(result).to.equal('foo() -> hey')
    })

    it('pipes a value into a function with empty params', function () {
      const {tree, result} = parse(`"hey" | foo()`, {}, {
        foo: (str) => `foo() -> ${str}`
      })
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'pipe',
          left: {
            type: 'string',
            value: 'hey'
          },
          right: {
            type: 'function',
            name: 'foo',
            args: []
          }
        }
      })
      expect(result).to.equal('foo() -> hey')
    })

    it('pipes a value into a function with params', function () {
      const {tree, result} = parse(`"hey" | foo('you', 'there')`, {}, {
        foo: (str, str2, str3) => `foo() -> ${str} ${str2} ${str3}`
      })
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'pipe',
          left: {
            type: 'string',
            value: 'hey'
          },
          right: {
            type: 'function',
            name: 'foo',
            args: [{
              type: 'string',
              value: 'you'
            }, {
              type: 'string',
              value: 'there'
            }]
          }
        }
      })
      expect(result).to.equal('foo() -> hey you there')
    })
  })

  describe('syntax-tree errors', function () {

    it('throws for missing closing parens', function () {
      expect(() => parse(`f(`)).to.throw('Unexpected end of input')
    })

    it('throws for missing opening parens', function () {
      expect(() => parse(`f)`)).to.throw('Unexpected token: )')
    })

    it('throws for missing closing parens in an operation', function () {
      expect(() => parse(`f( + 'ups'`)).to.throw('Missing left operand: +')
    })

    it('throws for a missing method', function () {
      expect(() => parse(`f()`)).to.throw('Unknown method: f')
    })

    it('throws when calling Object.prototype toString', function () {
      expect(() => parse(`toString()`, {}, {})).to.throw('Unknown method: toString')
    })

    it('throws when calling Object.prototype hasOwnProperty', function () {
      expect(() => parse(`hasOwnProperty("foo")`, {}, {foo: true}))
        .to.throw('Unknown method: hasOwnProperty')
    })

    it('throws when calling Object.prototype toString in a pipe', function () {
      expect(() => parse(`"foo" | toString`, {}, {})).to.throw('Unknown method: toString')
    })
  })
})
