'use strict'
const tokenize = require('../src/tokenize.js')

function check (str, expectedTokens) {
  const tokens = tokenize(str)
  expect(tokens).to.deep.equal(expectedTokens)
}

describe('tokenize:', function () {

  it('tokenizes one word', function () {
    check(`foo`, ['foo'])
  })

  it('tokenizes multiple characters', function () {
    check(`a b c`, ['a', ' ', 'b', ' ', 'c'])
  })

  it('tokenizes multiple characters', function () {
    check(`hübsch`, ['hübsch'])
  })

  it('tokenizes multiple characters', function () {
    check(`söme text {{ väriable }}`,
      ['söme', ' ', 'text', ' ', '{{', ' ', 'väriable', ' ', '}}'])
  })

  it('tokenizes double quotes', function () {
    check(`{{metadata.foo + "foo + bar"}}`,
      ['{{', 'metadata.foo', ' ', '+', ' ', '"foo + bar"', '}}'])
  })

  it('tokenizes single and nested quotes', function () {
    check(`{{"hey 'you'" + 'foo "bar"'}}`,
      ['{{', `"hey 'you'"`, ' ', '+', ' ', `'foo "bar"'`, '}}'])
  })

  it('tokenizes an addition', function () {
    check(`{{metadata.foo + bar}}`,
      ['{{', 'metadata.foo', ' ', '+', ' ', 'bar', '}}'])
  })

  it('tokenizes a subtraction', function () {
    check(`{{11.1 - 5}}`,
      ['{{', '11.1', ' ', '-', ' ', '5', '}}'])
  })

  it('tokenizes a multiplication', function () {
    check(`{{300 * 400}}`,
      ['{{', '300', ' ', '*', ' ', '400', '}}'])
  })

  it('tokenizes a division', function () {
    check(`{{16/9}}`,
      ['{{', '16', '/', '9', '}}'])
  })

  it('tokenizes a modulo operation', function () {
    check(`{{metadata.count % 2}}`,
      ['{{', 'metadata.count', ' ', '%', ' ', '2', '}}'])
  })

  it('tokenizes an addition (without whitespace)', function () {
    check(`{{metadata.foo+bar}}`,
      ['{{', 'metadata.foo', '+', 'bar', '}}'])
  })

  it('tokenizes a function', function () {
    check(`foo()`,
      ['foo', '(', ')'])
  })

  it('tokenizes a function call', function () {
    check(`{{foo()}}`,
      ['{{', 'foo', '(', ')', '}}'])
  })

  it('tokenizes a function call with params', function () {
    check(`foo(a, "b", c(), d && a)`,
      ['foo', '(', 'a', ',', ' ', '"b"', ',', ' ', 'c', '(', ')', ',', ' ', 'd', ' ', '&&', ' ', 'a', ')']) // eslint-disable-line max-len
  })

  it('tokenizes a simple number addition', function () {
    check(`1+2`,
      ['1', '+', '2'])
  })

  it('tokenizes strings with all kinds of whitespace', function () {
    check(` f\to\no{{'f\to' + "\no"}}`,
      [' ', 'f', '\t', 'o', '\n', 'o', '{{', "'f\to'", ' ', '+', ' ', '"\no"', '}}'])
  })

  it('does not tokenize operators within strings', function () {
    check(`+-*/%{{'foo +-*/% bar'}}`,
      ['+', '-', '*', '/', '%', '{{', "'foo +-*/% bar'", '}}'])
  })

  it('correctly tokenizes repeated double quotes', function () {
    check(`{{""""}}`,
      ['{{', `""`, `""`, '}}'])
  })

  it('correctly tokenizes repeated single quotes', function () {
    check(`{{''''}}`,
      ['{{', `''`, `''`, '}}'])
  })
})
