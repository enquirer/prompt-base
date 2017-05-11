# prompt-base [![NPM version](https://img.shields.io/npm/v/prompt-base.svg?style=flat)](https://www.npmjs.com/package/prompt-base) [![NPM monthly downloads](https://img.shields.io/npm/dm/prompt-base.svg?style=flat)](https://npmjs.org/package/prompt-base) [![NPM total downloads](https://img.shields.io/npm/dt/prompt-base.svg?style=flat)](https://npmjs.org/package/prompt-base) [![Linux Build Status](https://img.shields.io/travis/enquirer/prompt-base.svg?style=flat&label=Travis)](https://travis-ci.org/enquirer/prompt-base) [![Windows Build Status](https://img.shields.io/appveyor/ci/enquirer/prompt-base.svg?style=flat&label=AppVeyor)](https://ci.appveyor.com/project/enquirer/prompt-base)

> Base prompt module used for creating custom prompt types for Enquirer.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save prompt-base
```

## Usage

See the [examples folder](./examples) for more detailed usage examples.

```js
var Prompt = require('prompt-base');
var prompt = new Prompt({
  name: 'color',
  message: 'What is your favorite color?'
});

prompt.run()
  .then(function(answer) {
    console.log(answer);
  })
```

## API

### [Prompt](index.js#L32)

Create a new Prompt with the given `question` object, `answers` and optional instance of [readline-ui](https://github.com/enquirer/readline-ui).

**Params**

* `question` **{Object}**: Plain object or instance of [prompt-question](https://github.com/enquirer/prompt-question).
* `answers` **{Object}**: Optionally pass an answers object from a prompt manager (like [enquirer](https://github.com/enquirer/enquirer)).
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

### [.format](index.js#L170)

Returns a formatted prompt message.

* `returns` **{String}**

### [.ask](index.js#L183)

Default `ask` method. This mayb eb overridden in custom prompts.

### [.run](index.js#L203)

Initialize a prompt and resolve answers. If `question.when`
returns false, the prompt will be skipped.

**Params**

* `answers` **{Object}**
* `returns` **{Promise}**

### [.render](index.js#L247)

Render the current prompt input. This can be replaced by custom prompts.

**Example**

```js
prompt.ui.on('keypress', prompt.render.bind(prompt));
```

### [.move](index.js#L315)

Move the cursor in the given `direction` when a `keypress`
event is emitted.

**Params**

* `direction` **{String}**
* `event` **{Object}**

### [.onEnterKey](index.js#L327)

Default `return` event handler. This may be overridden in custom prompts.

**Params**

* `event` **{Object}**

### [.onError](index.js#L339)

Default error event handler. If an `error` listener exist, an `error`
event will be emitted, otherwise the error is logged onto `stderr` and
the process is exited. This can be overridden in custom prompts.

**Params**

* `err` **{Object}**

### [.onKeypress](index.js#L356)

Default `keypress` event handler. This may be overridden
in custom prompts.

**Params**

* `event` **{Object}**

### [.onNumberKey](index.js#L374)

Default `number` event handler. This may be overridden in
custom prompts.

**Params**

* `event` **{Object}**

### [.onSpaceKey](index.js#L393)

Default `space` event handler. This may be overridden in custom prompts.

**Params**

* `event` **{Object}**

### [.onSubmit](index.js#L409)

When the answer is submitted (user presses `enter` key), re-render
and pass answer to callback. This may be replaced by custom prompts.

**Params**

* `input` **{Object}**

### [.onTabKey](index.js#L430)

Default `tab` event handler. This may be overridden in custom prompts.

**Params**

* `event` **{Object}**

### [.mute](index.js#L485)

Proxy to [readline.write](https://nodejs.org/api/readline.html#readline_rl_write_data_key) for manually writing output. When called, rl.write() will resume the input stream if it has been paused.

* `returns` **{undefined}**

**Example**

```js
prompt.write('blue\n');
prompt.write(null, {ctrl: true, name: 'l'});
```

### [.choices](index.js#L535)

Getter for getting the choices array from the question.

* `returns` **{Object}**: Choices object

### [.message](index.js#L552)

Getter that returns `question.message` after passing it to [format](#format).

* `returns` **{String}**: A formatted prompt message.

### [.prefix](index.js#L573)

Getter that returns the prefix to use before `question.message`. The default value is a green `?`.

* `returns` **{String}**: The formatted prefix.

**Example**

```js
prompt.prefix = '!';
```

### [.Separator](index.js#L593)

Create a new `Separator` object. See [choices-separator](https://github.com/enquirer/choices-separator) for more details.

**Params**

* `separator` **{String}**: Optionally pass a string to use as the separator.
* `returns` **{Object}**: Returns a separator object.

**Example**

```js
new Prompt.Separator('---');
```

## Examples

**Instantiate**

The main purpose of this library is to serve as a base for other libraries to create custom prompt types. _However, the main export is a function that can be instantiated to run basic "input" prompts_.

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

**Inherit**

```js
var Prompt = require('prompt-base');

function CustomPrompt(/*question, answers, rl*/) {
  Prompt.apply(this, arguments);
}

Prompt.extend(CustomPrompt);
```

## Overview

**How it works**

1. Run

* When
* Render

1. Events/Actions

* Validate
* Transform
* Submit

## Debugging

Debugging readline issues can be a pain. If you're experiencing something that seems like a bug, please [let us know about it](../../issues). If you happen to be in the  mood for debugging, here are some suggestions and/or places to look to help you figure out what's happening.

**Tips**

* call `process.exit()` after logging out the value as you're debugging. This not only stops the process immediately, letting you know if the method was even executed, but it's also more likely to make whatever you're logging out visible  before it's overwritten by the readline
* Wrap the value in an array: like `console.log([foo])` instead of `console.log(foo)`. I do this when debugging just about anything, as it forces the value to be rendered literally, instead of being formatted as output for the terminal.

**In prompt-base (this module)**:

Log out the `answer` value or any variants, like `this.answer`, or `input` in methods like `onSubmit`, and `submitAnswer`.

```js
console.log([this.answer]);
// etc...
```

In the `.action` method, log out the arguments object:

```js
utils.action = function(state, str, key) {
  console.log([arguments]);
  process.exit();
  // other code
};
```

**[readline-utils](https://github.com/enquirer/readline-utils)**

In the `.normalize` method in [readline-utils](https://github.com/enquirer/readline-utils), log out the arguments object:

```js
utils.normalize = function(s, key) {
  console.log([arguments]);
  process.exit();
  // other code
};
```

**[readline-ui](https://github.com/enquirer/readline-ui)**

Log out the `keypress` events in the listener.

**Misc**

In libraries with `prompt-*` or `readline-*`, or `enquirer-*` in the name, look for places where something is `.emit`ing, or listening with `.on` or `.only` (which simply wraps `.on` to ensure that events aren't stacked when nested prompts are called), and log out the value there.

## In the wild

The following custom prompts were created using this library:

* [prompt-autocomplete](https://www.npmjs.com/package/prompt-autocomplete): A prompt in the terminal but with autocomplete functionality | [homepage](https://github.com/rickbergfalk/prompt-autocomplete "A prompt in the terminal but with autocomplete functionality")
* [prompt-checkbox](https://www.npmjs.com/package/prompt-checkbox): Multiple-choice/checkbox prompt. Can be used standalone or with a prompt system like [Enquirer](https://github.com/enquirer/enquirer). | [homepage](https://github.com/enquirer/prompt-checkbox "Multiple-choice/checkbox prompt. Can be used standalone or with a prompt system like [Enquirer].")
* [prompt-confirm](https://www.npmjs.com/package/prompt-confirm): Confirm (yes/no) prompt. Can be used standalone or with a prompt system like [Enquirer](https://github.com/enquirer/enquirer). | [homepage](https://github.com/enquirer/prompt-confirm "Confirm (yes/no) prompt. Can be used standalone or with a prompt system like [Enquirer].")
* [prompt-editor](https://www.npmjs.com/package/prompt-editor): Editor prompt. Opens your text editor and waits for you to save your input during… [more](https://github.com/enquirer/prompt-editor) | [homepage](https://github.com/enquirer/prompt-editor "Editor prompt. Opens your text editor and waits for you to save your input during a prompt. Can be used standalone or with a prompt system like [Enquirer].")
* [prompt-expand](https://www.npmjs.com/package/prompt-expand): Expand prompt. Can be used as a standalone prompt, or with a prompt system like… [more](https://github.com/enquirer/prompt-expand) | [homepage](https://github.com/enquirer/prompt-expand "Expand prompt. Can be used as a standalone prompt, or with a prompt system like [Enquirer].")
* [prompt-list](https://www.npmjs.com/package/prompt-list): List-style prompt. Can be used as a standalone prompt, or with a prompt system like… [more](https://github.com/enquirer/prompt-list) | [homepage](https://github.com/enquirer/prompt-list "List-style prompt. Can be used as a standalone prompt, or with a prompt system like [Enquirer].")
* [prompt-password](https://www.npmjs.com/package/prompt-password): Password prompt. Can be used as a standalone prompt, or with a prompt system like… [more](https://github.com/enquirer/prompt-password) | [homepage](https://github.com/enquirer/prompt-password "Password prompt. Can be used as a standalone prompt, or with a prompt system like [Enquirer].")
* [prompt-radio](https://www.npmjs.com/package/prompt-radio): Radio prompt. This prompt behaves like other radio-button interfaces, where only one choice is enabled… [more](https://github.com/enquirer/prompt-radio) | [homepage](https://github.com/enquirer/prompt-radio "Radio prompt. This prompt behaves like other radio-button interfaces, where only one choice is enabled whilst all others are disabled. Can be used as a standalone prompt, or with a prompt system like [Enquirer].")
* [prompt-rawlist](https://www.npmjs.com/package/prompt-rawlist): Rawlist prompt. Can be used as a standalone prompt, or with a prompt system like… [more](https://github.com/enquirer/prompt-rawlist) | [homepage](https://github.com/enquirer/prompt-rawlist "Rawlist prompt. Can be used as a standalone prompt, or with a prompt system like [Enquirer].")

## About

### Related projects

* [enquirer](https://www.npmjs.com/package/enquirer): Intuitive, plugin-based prompt system for node.js. Much faster and lighter alternative to Inquirer, with all… [more](https://github.com/enquirer/enquirer) | [homepage](https://github.com/enquirer/enquirer "Intuitive, plugin-based prompt system for node.js. Much faster and lighter alternative to Inquirer, with all the same prompt types and more, but without the bloat.")
* [prompt-choices](https://www.npmjs.com/package/prompt-choices): Create an array of multiple choice objects for use in prompts. | [homepage](https://github.com/enquirer/prompt-choices "Create an array of multiple choice objects for use in prompts.")
* [prompt-question](https://www.npmjs.com/package/prompt-question): Question object, used by Enquirer and prompt plugins. | [homepage](https://github.com/enquirer/prompt-question "Question object, used by Enquirer and prompt plugins.")
* [readline-utils](https://www.npmjs.com/package/readline-utils): Readline utils, for moving the cursor, clearing lines, creating a readline interface, and more. | [homepage](https://github.com/enquirer/readline-utils "Readline utils, for moving the cursor, clearing lines, creating a readline interface, and more.")

### Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

Please read the [contributing guide](.github/contributing.md) for advice on opening issues, pull requests, and coding standards.

### Contributors

| **Commits** | **Contributor** | 
| --- | --- |
| 63 | [jonschlinkert](https://github.com/jonschlinkert) |
| 6 | [doowb](https://github.com/doowb) |

### Building docs

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

### Running tests

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

### Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](https://twitter.com/jonschlinkert)

### License

Copyright © 2017, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT License](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.6.0, on May 11, 2017._