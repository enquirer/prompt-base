'use strict';

var log = require('log-utils');
var define = require('define-property');
var Emitter = require('component-emitter');
var Question = require('prompt-question');
var UI = require('readline-ui');

/**
 * Create a new Prompt with the given `question` object, `answers` and optional instance
 * of [readline-ui][].
 *
 * ```js
 * var prompt = new Prompt({
 *   name: 'color',
 *   message: 'What is your favorite color?'
 * });
 *
 * prompt.ask(function(answer) {
 *   console.log(answer);
 *   //=> 'blue'
 * });
 * ```
 * @param {Object} `question` Plain object or instance of [prompt-question][].
 * @param {Object} `answers` Optionally pass an answers object from a prompt manager (like [enquirer][]).
 * @param {Object} `ui` Optionally pass an instance of [readline-ui][]. If not passed, an instance is created for you.
 * @api public
 */

function Prompt(question, answers, ui) {
  if (!(this instanceof Prompt)) {
    var proto = Object.create(Prompt.prototype);
    Prompt.apply(proto, arguments);
    return proto;
  }

  if (!question) {
    throw new TypeError('expected question to be a string or object');
  }

  this.question = new Question(question);
  this.answers = answers || {};
  this.status = 'pending';
  this.session = true;
  this.called = 0;
  this.ui = ui;

  if (!isString(this.question.message)) {
    throw new TypeError('expected message to be a string');
  }
  if (!isString(this.question.name)) {
    throw new TypeError('expected name to be a string');
  }

  // Normalize choices
  if (Array.isArray(this.question.choices)) {
    this.question.addChoices(this.question.choices, this.answers);
  }

  define(this, 'options', this.question);
  if (typeof this.ui === 'undefined') {
    this.ui = UI.create(this.options);
  }

  this.rl = this.ui.rl;
  this.close = this.ui.close.bind(this.ui);
};

/**
 * Decorate Emitter methods
 */

Emitter(Prompt.prototype);

/**
 * Default `when` method, overridden in custom prompts.
 */

Prompt.prototype.when = function() {
  if (typeof this.question.when === 'function') {
    return this.question.when.apply(this, arguments);
  }
  return true;
};

/**
 * Default `validate` method, overridden in custom prompts.
 */

Prompt.prototype.validate = function(val) {
  if (typeof this.question.validate === 'function') {
    return this.question.validate.apply(this, arguments);
  }
  return true;
};

/**
 * Default `filter` method, overridden in custom prompts.
 */

Prompt.prototype.filter = function(val) {
  if (typeof this.question.filter === 'function') {
    return this.question.filter.apply(this, arguments);
  }
  return val;
};

/**
 * Default `transform` method, overridden in custom prompts.
 */

Prompt.prototype.transform = function(val) {
  if (typeof this.question.transform === 'function') {
    return this.question.transform.apply(this, arguments);
  }
  return val;
};

/**
 * Default `ask` method, overridden in custom prompts.
 */

Prompt.prototype.ask = function(callback) {
  this.callback = callback;
  this.ui.on('keypress', this.render.bind(this));
  this.ui.once('line', this.onSubmit.bind(this));
  this.render();
};

/**
 * Initialize a prompt and resolve answers. If `question.when` returns false,
 * the prompt will be skipped.
 *
 * @param {Object} `answers`
 * @return {Promise}
 * @api public
 */

Prompt.prototype.run = function(answers) {
  this.resume();

  var name = this.question.name;
  var when = this.when(answers);
  var ask = when ? this.ask.bind(this) : this.noop;
  answers = answers || {};

  return new Promise(function(resolve) {
    ask(function(value) {
      answers[name] = value;
      resolve(value);
    });
  });
};

/**
 * Render the current prompt input. This can be replaced by custom prompts.
 *
 * ```js
 * prompt.ui.on('keypress', prompt.render.bind(prompt));
 * ```
 * @api public
 */

Prompt.prototype.render = function() {
  var message = this.message;
  var answer = this.status === 'answered'
    ? log.cyan(this.answer)
    : this.rl.line;

  this.ui.render(message + answer);
};

/**
 * When the answer is submitted (user presses `enter` key), re-render
 * and pass answer to callback. This can be replaced by custom prompts.
 * @param {Object} `input`
 */

Prompt.prototype.onSubmit = function(input) {
  this.submitAnswer(input);
};

/**
 * Re-render and pass the final answer to the callback. This can be replaced
 * by custom prompts, but it probably won't need to be.
 */

Prompt.prototype.submitAnswer = function(input) {
  this.status = 'answered';
  this.answer = input;
  this.end();
  this.emit('answer', this.answer);
  this.callback(this.answer);
};

/**
 * Returns a formatted prompt message.
 * @return {String}
 * @api public
 */

Prompt.prototype.format = function(msg) {
  var message = this.prefix + log.bold(msg) + ' ';
  if (this.question.hasDefault && this.status !== 'answered') {
    message += log.dim('(' + this.question.default + ') ');
  }
  return message;
};

/**
 * Pause readline
 */

Prompt.prototype.end = function() {
  this.render();
  this.ui.end();
  this.pause();
};

/**
 * Pause readline
 */

Prompt.prototype.pause = function() {
  this.rl.pause();
};

/**
 * Resume readline
 */

Prompt.prototype.resume = function() {
  this.status = 'pending';
  this.rl.resume();
};

/**
 * Close readline
 */

Prompt.prototype.close = function() {
  this.ui.close();
};

/**
 * Used if `when` returns false
 */

Prompt.prototype.noop = noop;

/**
 * Getter for getting the choices array from the question.
 *
 * @name .choices
 * @return {Object} Choices object
 * @api public
 */

Object.defineProperty(Prompt.prototype, 'choices', {
  set: function(val) {
    throw new Error('.choices is a getter and cannot be defined');
  },
  get: function() {
    return this.question.choices;
  }
});

/**
 * Getter that returns `question.message` after passing it to [format](#format).
 *
 * @name .message
 * @return {String} A formatted prompt message.
 * @api public
 */

Object.defineProperty(Prompt.prototype, 'message', {
  set: function() {
    throw new Error('.message is a getter and cannot be defined');
  },
  get: function() {
    return this.format(this.question.message);
  }
});

/**
 * Getter that returns the prefix to use before `question.message`. The
 * default value is a green `?`.
 *
 * @name .prefix
 * @return {String} The formatted prefix.
 * @api public
 */

Object.defineProperty(Prompt.prototype, 'prefix', {
  set: function() {
    throw new Error('.prefix is a getter and cannot be defined');
  },
  get: function() {
    return this.question.prefix || (log.cyan('?') + ' ');
  }
});

/**
 * Getter that gets the `readline-ui`. If a `ui` instance is not
 *
 * @name .choices
 * @return {Object} Choices object
 * @api public
 */

// Object.defineProperty(Prompt.prototype, 'ui', {
//   set: function(ui) {
//     define(this, '_ui', ui);
//   },
//   get: function() {
//     if (typeof this._ui === 'undefined') {
//       define(this, '_ui', UI.create(this.options));
//     }
//     return this._ui;
//   }
// });

// Object.defineProperty(Prompt.prototype, 'rl', {
//   set: function(rl) {
//     define(this, '_rl', rl);
//   },
//   get: function() {
//     if (typeof this._rl === 'undefined') {
//       define(this, '_rl', this.ui.rl);
//     }
//     return this._rl;
//   }
// });

/**
 * Utils
 */

function noop(next) {
  next();
}

function isString(val) {
  return val && typeof val === 'string';
}

/**
 * Expose `Prompt`
 */

module.exports = Prompt;
