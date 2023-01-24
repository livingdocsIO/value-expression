<p align="right">
  <img src="https://img.shields.io/badge/coverage-100%25-success">
  <img src="https://img.shields.io/badge/no-dependencies-success">
</p>

# Value Expression

## What can it do for you?

Evaluate javaScript-like code snippets to produce a single value.

Safely evaluate a Javascript-like expression to produce a single value. This library is inspired by angular expressions and their use of pipes to transform
values safely from user provided code snippets.
Within expression you can use context variables and predefined functions.

This allows for value-expressions to be used in declarative configurations
to transform values.

No eval or new Function is used to evaluate the expression. The goal is that it is
safe to evaluate user-provided snippets.


## Introduction

```js
// create an expression instance
const {parseTemplate} = valueExpression()

// A simple expression evaluating a name from variables
const expression = parseTemplate(`prename + " " + surname`)
expression({prename: 'Mac', surname: 'Gyver'}) // => Mac Gyver
```

## Supported Features


### Numbers

```js
const expression = parseTemplate(`1 + 2 * 3`)
expression() // => 7
```

### Strings

```js
const expression = parseTemplate(`"Hello " + "World"`)
expression() // => "Hello World"

// Adding a number to a string behaves the same as in javascript
const expression = parseTemplate(`"Say " + 3`)
expression() // => "Say 3"
```

### Booleans

```js
const expression = parseTemplate(`true || false`)
expression() // => true
```

### Variables

```js
const expression = parseTemplate(`foo`)
expression({foo: 'Hey There'}) // => Hey There
```

```js
const expression = parseTemplate(`metadata.prename + " " + metadata.surname`)
context = {
  metadata: {
    prename: 'Mac',
    surname: 'Gyver'
  }
}
expression(context) // => Mac Gyver
```

Variable evaluation is forgiving. If no variable is defined it will
evaluate to `undefined`.

```js
const expression = parseTemplate(`foo`)
expression({bar: 'Hey There'}) // => undefined
```

### Functions

Registering functions
```js
const {registerFunction, parseTemplate} = valueExpression()

// Register functions available in templates
// Note: functions need to be registered before `parseTemplate()` is called.
registerFunction('sayHello', (noun = 'World') => `Hello ${noun}`)

// Call without any arguments
parseTemplate(`sayHello()`)() // => "Hello World"

// Call with a string argument
parseTemplate(`sayHello('Kitty')`)() // => "Hello Kitty"

// Call with a variable
parseTemplate(`sayHello(noun)`)({noun: 'Sweetie'}) // => "Hello Sweetie"
```

### Pipes

```js
const {registerFunction, parseTemplate} = valueExpression()

// Every registered function can be called with the pipe syntax.
// The previous value will be passed as it first argument.
registerFunction('sayHello', (noun = 'World', greeting = 'Hello') => `${greeting} ${noun}`)


// Call with a string argument
parseTemplate(`'Kitty' | sayHello`)() // => "Hello Kitty"

// Note: this is equivalent to the syntax above without parens
parseTemplate(`'Kitty' | sayHello()`)() // => "Hello Kitty"

// Call a piped function with a variable
parseTemplate(`'Kitty' | sayHello(greeting)`)({greeting: 'Hey there'}) // => "Hey there Sweetie"
```

## String Expressions

There is a special type of expression called string expression which is
always evaluated to a string. They are created by parsing the template
with the method `parseStringTemplate()`. To run one or multiple expressions within
a string expression you have to use double curly braces: e.g. `{{ foo() }}`.

The expressions within string templates work the same as normal expressions.

```js
const {parseStringTemplate} = valueExpression()

parseStringTemplate(`Hello World`)() // => "Hello World"
parseStringTemplate(`Say {{ name }}`)({name: 'my name'}) // => "Say my name"
parseStringTemplate(`Say {{ 2 + 2 | sqrt }}`)() // => "Say 2"
```

### Supported Operators

All operators have the same behavior as their javascript equivalents.

```js
const supportedOperators = [
  "+",   // addition
  "-",   // subtraction
  "*",   // multiplication
  "/",   // division
  "%",   // remainder
  ">",   // greaterThan
  ">=",  // greaterOrEqualThan
  "<",   // lesserThan
  "<=",  // lesserOrEqualThan
  "===", // strictEqual
  "!==", // strictNotEqual
  "&&",  // and
  "||",  // or
]
```

Note: `!` Negation, and paranthesis `(` `)` for grouping
and ternary expressions are not currently supported.
