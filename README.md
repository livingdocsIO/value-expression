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
