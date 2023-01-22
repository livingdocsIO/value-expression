'use strict'
const tokenize = require('../src/tokenize.js')
const createSyntaxTree = require('../src/create-syntax-tree.js')
const evaluate = require('../src/evaluate.js')

function parse (str, context, methods) {
  const tokens = tokenize(str)
  const syntaxTree = createSyntaxTree(tokens)
  return {tree: syntaxTree, result: evaluate(syntaxTree, context, methods)}
}

function assert (str, result) {
  expect(parse(str).result).to.equal(result, str)
}

function assertContext (str, context, result) {
  expect(parse(str, context).result).to.equal(result, str)
}

describe('expressions:', function () {

  describe('results', function () {

    it('handles precedence of a complicated calculation', function () {
      assert(`1 + 2 * 3 + 10 / 2`,
        1 + 2 * 3 + 10 / 2) // eslint-disable-line no-mixed-operators
    })

    it('handles precedence with all math operators', function () {
      assert(`1 - 2 + 3 * 4 / 5 % 6`,
        1 - 2 + 3 * 4 / 5 % 6) // eslint-disable-line no-mixed-operators
    })

    it('handles precedence with all math operators (reverse)', function () {
      assert(`1 % 2 / 3 * 4 + 5 - 6`,
        1 % 2 / 3 * 4 + 5 - 6) // eslint-disable-line no-mixed-operators
    })

    it('handles multiline expressions', function () {
      assert(`1
        + 2
        * 3
      `, 1 + 2 * 3) // eslint-disable-line no-mixed-operators
    })

    it('handles true logic', function () {
      // -> results in 2 in case you're wondering
      assert(`true + true`, true + true)
    })

    it('handles false logic', function () {
      // -> results in 0 in case you're wondering
      assert(`false + false`, false + false)
    })

    it('handles strict equal', function () {
      assert(`2 === 1`, false)
      assert(`true === true`, true)
      assert(`true === 'true'`, false)
    })

    it('handles strict not equal', function () {
      assert(`2 !== 1`, true)
      assert(`true !== true`, false)
      assert(`true !== 'true'`, true)
    })

    it('handles greaterThan', function () {
      assert(`2 > 1`, true)
      assert(`2 > 2`, false)
      assert(`2 > 3`, false)
    })

    it('handles greaterOrEqualThan', function () {
      assert(`2 >= 1`, true)
      assert(`2 >= 2`, true)
      assert(`2 >= 3`, false)
    })

    it('handles lesserThan', function () {
      assert(`2 < 1`, false)
      assert(`2 < 2`, false)
      assert(`2 < 3`, true)
    })

    it('handles lesserOrEqualThan', function () {
      assert(`2 <= 1`, false)
      assert(`2 <= 2`, true)
      assert(`2 <= 3`, true)
    })

    it('handles &&', function () {
      assert(`true && false`, false)
      assert(`true && true`, true)
      assert(`0 && true`, 0)
      assert(`true && 'foo'`, 'foo')
    })

    it('handles ||', function () {
      assert(`true || false`, true)
      assert(`false || false`, false)
      assert(`0 || 'hey'`, 'hey')
    })

    it('works with different variable names', function () {
      assertContext(`_foo`, {_foo: true}, true)
      assertContext(`$foo`, {$foo: true}, true)
      assertContext(`T9`, {T9: true}, true)
      assertContext(`bar`, {}, undefined)
    })

  })

  describe('syntax-tree', function () {

    it('parses a variable', function () {
      const {tree, result} = parse(`a`, {a: 'valueA'})
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'variable',
          name: 'a'
        }
      })
      expect(result).to.equal('valueA')
    })

    it('parses a number', function () {
      const {tree, result} = parse(`0`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'number',
          value: 0
        }
      })
      expect(result).to.equal(0)
    })

    it('parses a floating number', function () {
      const {tree, result} = parse(`2.5`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'number',
          value: 2.5
        }
      })
      expect(result).to.equal(2.5)
    })

    it('parses a single quote string', function () {
      const {tree, result} = parse(`'ä'`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'string',
          value: 'ä'
        }
      })
      expect(result).to.equal('ä')
    })

    it('parses a double quote string', function () {
      const {tree, result} = parse(`"ohh 'you'"`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'string',
          value: `ohh 'you'`
        }
      })
      expect(result).to.equal(`ohh 'you'`)
    })

    it('parses a empty string', function () {
      const {tree, result} = parse(`''`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'string',
          value: ''
        }
      })
      expect(result).to.equal('')
    })

    it('parses emojis in strings and adds strings', function () {
      const {tree, result} = parse(`"👹" + '🦄'`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'addition',
          left: {
            type: 'string',
            value: `👹`
          },
          right: {
            type: 'string',
            value: `🦄`
          }
        }
      })
      expect(result).to.equal(`👹🦄`)
    })

    it('parses boolean true', function () {
      const {tree, result} = parse(`true`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'boolean',
          value: true
        }
      })
      expect(result).to.equal(true)
    })

    it('parses boolean false', function () {
      const {tree, result} = parse(`false`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'boolean',
          value: false
        }
      })
      expect(result).to.equal(false)
    })

    it('adds two numbers', function () {
      const {tree, result} = parse(`1+2`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'addition',
          left: {
            type: 'number',
            value: 1
          },
          right: {
            type: 'number',
            value: 2
          }
        }
      })
      expect(result).to.equal(3)
    })

    it('adds a string and a number', function () {
      const {tree, result} = parse(`'foo' + 2`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'addition',
          left: {
            type: 'string',
            value: 'foo'
          },
          right: {
            type: 'number',
            value: 2
          }
        }
      })
      expect(result).to.equal('foo2')
    })

    it('adds three numbers', function () {
      const {tree, result} = parse(`1 + 2 + 3`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'addition',
          left: {
            type: 'addition',
            left: {
              type: 'number',
              value: 1
            },
            right: {
              type: 'number',
              value: 2
            }
          },
          right: {
            type: 'number',
            value: 3
          }
        }
      })
      expect(result).to.equal(6)
    })

    it('handles multiplicator precedence', function () {
      const {tree, result} = parse(`1 + 2 * 3`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'addition',
          left: {
            type: 'number',
            value: 1
          },
          right: {
            type: 'multiplication',
            left: {
              type: 'number',
              value: 2
            },
            right: {
              type: 'number',
              value: 3
            }
          }
        }
      })
      expect(result).to.equal(7)
    })

    it('handles modulo', function () {
      const {tree, result} = parse(`7 % 2`)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'modulo',
          left: {
            type: 'number',
            value: 7
          },
          right: {
            type: 'number',
            value: 2
          }
        }
      })
      expect(result).to.equal(7 % 2)
    })

    it('parses a variable name with all characters', function () {
      const {tree, result} = parse(`z0_.Z`, {z0_: {Z: 'valueZ'}})
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: {
          type: 'variable',
          name: 'z0_.Z'
        }
      })
      expect(result).to.equal('valueZ')
    })

    it('parses an empty expressions', function () {
      const {tree, result} = parse(``)
      expect(tree).to.deep.equal({
        type: 'expression',
        statement: undefined
      })
      expect(result).to.equal(undefined)
    })
  })

  describe('syntax-tree errors', function () {

    it('throws for a not allowed character', function () {
      expect(() => parse(`ä`)).to.throw('Unexpected token: ä')
    })

    it('throws for a not terminated string', function () {
      expect(() => parse(`"a`)).to.throw('Unexpected token: "a')
    })

    it('throws for a missing starting double quote', function () {
      expect(() => parse(`a"`)).to.throw('Unexpected token: a"')
    })

    it(`throws for a '.' at the end of a variable`, function () {
      expect(() => parse(`a.`)).to.throw('Unexpected token: a.')
    })

    it(`throws for a missing left operand`, function () {
      expect(() => parse(`+1`)).to.throw('Missing left operand: +')
    })

    it(`throws for a missing right operand`, function () {
      expect(() => parse(`1+`)).to.throw('Missing right operand: +')
    })

    it(`throws for two operands`, function () {
      expect(() => parse(`1+*`)).to.throw('Unexpected right operand: *')
    })

    it(`throws for two operands separated by whitespace`, function () {
      expect(() => parse(`1 + *`)).to.throw('Unexpected right operand: *')
    })
  })
})
