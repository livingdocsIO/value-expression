'use strict'
const tokenize = require('../src/tokenize.js')
const createSyntaxTree = require('../src/create-syntax-tree.js')
const evaluate = require('../src/evaluate.js')

function parseString (str, context, methods) {
  const tokens = tokenize(str)
  const syntaxTree = createSyntaxTree(tokens, 'concat')
  return {tree: syntaxTree, result: evaluate(syntaxTree, context, methods)}
}

describe('concat:', function () {

  describe('results', function () {

    it('parses a simple string in an expression', function () {
      const {result} = parseString(`foo {{ "bar" }}`)
      expect(result).to.equal('foo bar')
    })

    it('keeps different types of whitespace', function () {
      const {result} = parseString(` f\to\no{{ 'f\to' + "\no" }}`)
      expect(result).to.equal(' f\to\nof\to\no')
    })

    it('parses an empty expression as an empty string', function () {
      const {result} = parseString(`{{}}`)
      expect(result).to.equal('')
    })
  })

  describe('syntax-tree', function () {

    it('parses one word', function () {
      const {tree} = parseString(`foo`)
      expect(tree).to.deep.equal({
        type: 'concat',
        parts: [{
          type: 'string',
          value: 'foo'
        }]
      })
    })

    it('parses top level double quotes', function () {
      const {tree} = parseString(`foo "hey"`)
      expect(tree).to.deep.equal({
        type: 'concat',
        parts: [{
          type: 'string',
          value: 'foo'
        }, {
          type: 'string',
          value: ' '
        }, {
          type: 'string',
          value: '"hey"'
        }]
      })
    })

    it('parses a variable interpolation', function () {
      const {tree} = parseString(`{{var}}`)
      expect(tree).to.deep.equal({
        type: 'concat',
        parts: [{
          type: 'expression',
          statement: {
            type: 'variable',
            name: 'var'
          }
        }]
      })
    })

    it('parses two variable interpolations', function () {
      const {tree} = parseString(`{{var}}x{{ var2 }}`)
      expect(tree).to.deep.equal({
        type: 'concat',
        parts: [{
          type: 'expression',
          statement: {
            type: 'variable',
            name: 'var'
          }
        }, {
          type: 'string',
          value: 'x'
        }, {
          type: 'expression',
          statement: {
            type: 'variable',
            name: 'var2'
          }
        }]
      })
    })

    it('parses empty expressions', function () {
      const {tree} = parseString(`{{}}{{   }}`)
      expect(tree).to.deep.equal({
        type: 'concat',
        parts: [{
          type: 'expression',
          statement: undefined
        }, {
          type: 'expression',
          statement: undefined
        }]
      })
    })

    it('ignores single curly brackets', function () {
      const {tree} = parseString(`a{b}`)
      expect(tree).to.deep.equal({
        type: 'concat',
        parts: [{
          type: 'string',
          value: 'a{b}'
        }]
      })
    })

    it('adds two variable operands (no whitespace)', function () {
      const {tree} = parseString(`{{a+metadata.b}}`)
      expect(tree).to.deep.equal({
        type: 'concat',
        parts: [{
          type: 'expression',
          statement: {
            type: 'addition',
            left: {
              type: 'variable',
              name: 'a'
            },
            right: {
              type: 'variable',
              name: 'metadata.b'
            }
          }
        }]
      })
    })

    it('adds a string and a variable (no whitespace)', function () {
      const {tree} = parseString(`{{"a"+metadata.b}}`)
      expect(tree).to.deep.equal({
        type: 'concat',
        parts: [{
          type: 'expression',
          statement: {
            type: 'addition',
            left: {
              type: 'string',
              value: `a`
            },
            right: {
              type: 'variable',
              name: 'metadata.b'
            }
          }
        }]
      })
    })

    it('parses a function expression', function () {
      const {tree, result} = parseString(`{{foo()}}`, {}, {foo: () => 'bar'})
      expect(tree).to.deep.equal({
        type: 'concat',
        parts: [{
          type: 'expression',
          statement: {
            type: 'function',
            name: 'foo',
            args: []
          }
        }]
      })
      expect(result).to.equal('bar')
    })
  })

  describe('syntax-tree errors', function () {

    it('throws on wrong expression terminator', function () {
      expect(() => parseString(`{{foo}`)).to.throw('Unexpected token: foo}')
    })

    it('throws on missing expression terminator', function () {
      expect(() => parseString(`{{`)).to.throw('Unexpected end of input')
    })
  })
})
