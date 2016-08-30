# enquirer-prompt [![NPM version](https://img.shields.io/npm/v/enquirer-prompt.svg?style=flat)](https://www.npmjs.com/package/enquirer-prompt) [![NPM downloads](https://img.shields.io/npm/dm/enquirer-prompt.svg?style=flat)](https://npmjs.org/package/enquirer-prompt)

> Base prompt module used for creating custom prompt types for Enquirer.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save enquirer-prompt
```

## Usage

The main export is a function that is inherited to a custom prompt type:

```js
var BasePrompt = require('enquirer-prompt');

function CustomPrompt(/*question, answers, rl*/) {
  BasePrompt.apply(this, arguments);
}

util.inherits(CustomPrompt, BasePrompt);
```

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
Released under the [MIT license](https://github.com/enquirer/enquirer-prompt/blob/master/LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.1.30, on August 29, 2016._