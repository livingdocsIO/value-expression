'use strict'
const {parseTemplate, evaluate} = require('../src/index.js')

describe('api:', function () {

  describe('parseTemplate()', function () {

    it('parses a simple template', function () {
      const template = parseTemplate(`metadata.count % 2`)
      const result = template({metadata: {count: 3}})
      expect(result).to.equal(1)
    })
  })

  describe('evaluate()', function () {

    it('directly evaluates template', function () {
      const result = evaluate(`count % 2`, {count: 3})
      expect(result).to.equal(1)
    })
  })
})
