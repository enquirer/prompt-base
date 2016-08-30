# prompt-base [![NPM version](https://img.shields.io/npm/v/prompt-base.svg?style=flat)](https://www.npmjs.com/package/prompt-base) [![NPM downloads](https://img.shields.io/npm/dm/prompt-base.svg?style=flat)](https://npmjs.org/package/prompt-base)

> Base prompt module used for creating custom prompt types for Enquirer.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save prompt-base
```

## Usage

```js
var Prompt = require('prompt-base');
```

## API

### [Prompt](index.js#L30)

Create a new Prompt with the given `question` object, `answers` and optional instance of [readline-ui](https://github.com/enquirer/readline-ui).

**Params**

* `question` **{Object}**: Plain object or instance of [prompt-question](https://github.com/enquirer/prompt-question).
* `answers` **{Object}**: Optionally pass an answers object from a prompt manager (like [enquirer](https://github.com/jonschlinkert/enquirer)).
* `ui` **{Object}**: Optionally pass an instance of [readline-ui](https://github.com/enquirer/readline-ui). If not passed, an instance is created for you.

**Example**

```js
var prompt = new Prompt({
  name: 'color',
  message: 'What is your favorite color?'
});

prompt.ask(function(answer) {
  console.log(answer);
  //=> 'blue'
});
```

### [.run](index.js#L130)

Initialize a prompt and resolve answers. If `question.when` returns false,
the prompt will be skipped.

**Params**

* `answers` **{Object}**
* `returns` **{Promise}**

### [.render](index.js#L155)

Render the current prompt input. This can be replaced by custom prompts.

**Example**

```js
prompt.ui.on('keypress', prompt.render.bind(prompt));
```

### [.format](index.js#L190)

Returns a formatted prompt message.

* `returns` **{String}**

### [.session](index.js#L213)

Getter that true if the prompt is in a session with multiple questions. This value
is set in implementations by a prompt manager, like [enquirer](https://github.com/jonschlinkert/enquirer).

* `returns` **{Boolean}**: True if a prompt session is active.

### [.choices](index.js#L237)

Getter for getting the choices array from the question.

* `returns` **{Object}**: Choices object

### [.message](index.js#L254)

Getter that returns `question.message` after passing it to [format](#format).

* `returns` **{String}**: A formatted prompt message.

### [.prefix](index.js#L272)

Getter that returns the prefix to use before `question.message`. The
default value is a green `?`.

* `returns` **{String}**: The formatted prefix.

## Examples

**Instantiate**

The main purpose of this library is to be inherited by other libraries to create custom prompt types. However, the main export is a function that can be instantiated to run basic "input" prompts, if you want to see how everything works, run examples, tests, etc.

```js
var Prompt = require('prompt-base');
var prompt = new Prompt({
  name: 'first',
  message: 'What is your name?'
});

// callback
prompt.ask(function(answer) {
  console.log(answer);
  //=> 'Jon'
});

// promise
prompt.run()
  .then(function(answers) {
    console.log(answers);
    //=> {first: 'Jon'}
  });
```

See [enquirer-prompt-input](https://github.com/jonschlinkert/enquirer-prompt-input) for a more complete `input` prompt implementation.

**Inherit**

```js
var Prompt = require('prompt-base');

function CustomPrompt(/*question, answers, rl*/) {
  Prompt.apply(this, arguments);
}

util.inherits(CustomPrompt, Prompt);
```

## In the wild

The following custom prompts were created using this library:

* [enquirer-prompt-checkbox](https://www.npmjs.com/package/enquirer-prompt-checkbox): Adds checkbox prompt support to Enquirer. | [homepage](https://github.com/enquirer/enquirer-prompt-checkbox "Adds checkbox prompt support to Enquirer.")
* [enquirer-prompt-confirm](https://www.npmjs.com/package/enquirer-prompt-confirm): Adds `confirm` (yes/no) prompt support to Enquirer. | [homepage](https://github.com/enquirer/enquirer-prompt-confirm "Adds `confirm` (yes/no) prompt support to Enquirer.")
* [enquirer-prompt-input](https://www.npmjs.com/package/enquirer-prompt-input): Input prompt plugin for Enquirer. This is the only prompt type included in Enquirer by… [more](https://github.com/jonschlinkert/enquirer-prompt-input) | [homepage](https://github.com/jonschlinkert/enquirer-prompt-input "Input prompt plugin for Enquirer. This is the only prompt type included in Enquirer by default and does not need to be registered separately.")
* [enquirer-prompt-radio](https://www.npmjs.com/package/enquirer-prompt-radio): Adds `radio` prompt support to Enquirer. This prompt behaves like other radio-button interfaces, where only… [more](https://github.com/enquirer/enquirer-prompt-radio) | [homepage](https://github.com/enquirer/enquirer-prompt-radio "Adds `radio` prompt support to Enquirer. This prompt behaves like other radio-button interfaces, where only one choice is enabled whilst all others are disabled.")

## About

### Related projects

* [enquirer-question](https://www.npmjs.com/package/enquirer-question): Question object, used by Enquirer and prompt plugins. | [homepage](https://github.com/enquirer/enquirer-question "Question object, used by Enquirer and prompt plugins.")
* [enquirer](https://www.npmjs.com/package/enquirer): Plugin-based prompt system for node.js | [homepage](https://github.com/jonschlinkert/enquirer "Plugin-based prompt system for node.js")
* [prompt-choices](https://www.npmjs.com/package/prompt-choices): Create an array of multiple choice objects for use in prompts. | [homepage](https://github.com/enquirer/prompt-choices "Create an array of multiple choice objects for use in prompts.")
* [readline-utils](https://www.npmjs.com/package/readline-utils): Readline utils, for moving the cursor, clearing lines, creating a readline interface, and more. | [homepage](https://github.com/enquirer/readline-utils "Readline utils, for moving the cursor, clearing lines, creating a readline interface, and more.")

### Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

Please read the [contributing guide](contributing.md) for avice on opening issues, pull requests, and coding standards.

### Building docs

_(This document was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme) (a [verb](https://github.com/verbose/verb) generator), please don't edit the readme directly. Any changes to the readme must be made in [.verb.md](.verb.md).)_

To generate the readme and API documentation with [verb](https://github.com/verbose/verb):

```sh
$ npm install -g verb verb-generate-readme && verb
```

### Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

### Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](http://twitter.com/jonschlinkert)

### License

Copyright © 2016, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT license](https://github.com/enquirer/prompt-base/blob/master/LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.1.30, on August 30, 2016._