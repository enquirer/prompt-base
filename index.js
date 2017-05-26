'use strict';

var util = require('util');
var log = require('log-utils');
var debug = require('debug')('prompt-base');
var Emitter = require('component-emitter');
var Question = require('prompt-question');
var Actions = require('prompt-actions');
var extend = require('static-extend');
var utils = require('readline-utils');
var isNumber = require('is-number');
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
  debug('initializing from <%s>', __filename);

  if (!question) {
    throw new TypeError('expected question to be a string or object');
  }

  if (!(this instanceof Prompt)) {
    var proto = Object.create(Prompt.prototype);
    Prompt.apply(proto, arguments);
    return proto;
  }

  Emitter.call(this);
  this.question = this.options = new Question(question);
  this.initialDefault = this.question.default;
  this.answers = answers || {};
  this.actions = new Actions(this);

  if (typeof this.options.limit !== 'number') {
    this.options.limit = this.options.radio ? 9 : 7;
  }

  this.ui = ui || UI.create(this.options);
  this.rl = this.ui.rl;
  this.errorMessage = log.red('>> invalid input');
  this.onError = this.onError.bind(this);
  this.status = 'pending';
  this.session = false;
  this.position = 0;
  this.called = 0;
  this.state = true;
  this.ui.rl.pause();
  this.initListeners();
};

/**
 * Inherit `Base`
 */

util.inherits(Prompt, Emitter);
Prompt.extend = extend(Prompt);

/**
 * Modify the answer value before it's returned. Must
 * return a string or promise.
 *
 * ```js
 * var answers = {};
 * var Prompt = require('prompt-base');
 * var prompt = new Prompt({
 *   name: 'name',
 *   message: 'What is your name?',
 *   transform: function(input) {
 *     return input.toUpperCase();
 *   }
 * });
 * ```
 * @return {String}
 * @api public
 */

Prompt.prototype.transform = function(input) {
  if (typeof this.options.transform === 'function') {
    return this.options.transform.call(this, input);
  }
  if (typeof this.options.filter === 'function') {
    return this.options.filter.call(this, input);
  }
  return input;
};

/**
 * Validate user input on `keypress` events and the answer
 * value when it's submitted by the `line` event (when the user
 * hits <kbd>enter</kbd>. This may be overridden in custom prompts.
 * If the function returns `false`, either `question.errorMessage`
 * or the default validation error message (`invalid input`) is used.
 * Must return a boolean, string or promise.
 *
 * ```js
 * var Prompt = require('prompt-base');
 * var prompt = new Prompt({
 *   name: 'first',
 *   message: 'What is your name?',
 *   errorMessage: 'alphabetical characters only',
 *   validate: function(input) {
 *     var str = input ? input.trim() : '';
 *     var isValid = /^[a-z]+$/i.test(str);
 *     if (this.state === 'submitted') {
 *       return str.length > 10 && isValid;
 *     }
 *     return isValid;
 *   }
 * });
 * ```
 * @return {Boolean}
 * @api public
 */

Prompt.prototype.validate = function(input, key) {
  if (typeof this.options.validate === 'function') {
    this.state = this.options.validate.apply(this, arguments);
  } else {
    this.state = true;
  }
  if (this.status === 'submitted') {
    this.question.default = '';
  }
  return this.state;
};

/**
 * A custom `.when` function may be defined to determine
 * whether or not a question should be asked at all. Must
 * return a boolean, undefined, or a promise.
 * ```js
 * var answers = {};
 * var Prompt = require('prompt-base');
 * var prompt = new Prompt({
 *   name: 'name',
 *   message: 'What is your name?',
 *   when: function(answers) {
 *     return !answers.name;
 *   }
 * });
 * ```
 * @return {Boolean}
 * @api public
 */

Prompt.prototype.when = function(answers) {
  if (typeof this.options.when === 'function') {
    return this.options.when.apply(this, arguments);
  }
  return true;
};

/**
 * Run the prompt with the given `callback` function.
 *
 * ```js
 * var Prompt = require('prompt-base');
 * var prompt = new Prompt({
 *   name: 'name',
 *   message: 'What is your name?'
 * });
 *
 * prompt.ask(function(answer) {
 *   console.log(answer);
 * });
 * ```
 * @param {Function} `callback`
 * @return {undefined}
 * @api public
 */

Prompt.prototype.ask = function(callback) {
  if (this.question.on) {
    this.addListeners(this.question.on);
  }

  this.callback = callback;
  this.resume();
  this.only('error', this.onError);
  this.only('keypress', this.dispatch.bind(this));
  this.only('line', this.dispatch.bind(this));
  this.emit('ask', this);

  if (this.choices && this.choices.length) {
    utils.cursorHide(this.rl);
  }
  this.render();
};

/**
 * Run the prompt and resolve answers. If [when](#when) is defined
 * and returns false, the prompt will be skipped.
 *
 * ```js
 * var answers = {};
 * var Prompt = require('prompt-base');
 * var prompt = new Prompt({
 *   name: 'name',
 *   message: 'What is your name?'
 * });
 *
 * prompt.run(answers)
 *   .then(function(answer) {
 *     console.log(answer);
 *     console.log(answers);
 *   });
 * ```
 * @param {Object} `answers` (optional) When supplied, the answer value will be added to a property where the key is the question name.
 * @return {Promise}
 * @api public
 */

Prompt.prototype.run = function(answers) {
  answers = answers || {};
  var self = this;

  return Promise.resolve(this.when(answers))
    .then(function(when) {
      if (when === false) {
        self.end(false);
        self.emit('answer', self.getAnswer());
        return Promise.resolve(self.getAnswer());
      }
      return new Promise(function(resolve) {
        self.ask(function(input) {
          Promise.resolve(self.transform(input))
            .then(function(answer) {
              if (typeof answer !== 'undefined') {
                answers[self.question.name] = answer;
                self.question.answer = answer;
              }
              resolve(answer);
            })
            .catch(self.onError);
        });
      });
    })
    .catch(self.onError);
};

/**
 * (Re-)render the prompt message, along with any help or error
 * messages, user input, choices, list items, and so on. This is
 * called to render the initial prompt, then it's called again
 * each time the prompt changes, such as on keypress events (when
 * the user enters input, or a multiple-choice option is selected).
 * This method may be overridden in custom prompts, but it's
 * recommended that you override the more specific render "status"
 * methods instead.
 *
 * ```js
 * prompt.ui.on('keypress', prompt.render.bind(prompt));
 * ```
 * @api public
 */

Prompt.prototype.render = function(state) {
  if (typeof state === 'undefined') {
    state = this.state;
  }

  var append = this.renderError(state);
  var message = this.renderMessage();

  switch (this.status) {
    case 'help':
    case 'pending':
    case 'initialized':
      message += this.renderHelp();
      message += this.renderOutput();
      break;
    case 'answered':
      message += this.renderAnswer();
      break;
    case 'interacted':
    case 'submitted':
    default: {
      message += this.renderOutput();
      break;
    }
  }

  var render = {
    state: state,
    message: message,
    status: this.status,
    append: append
  };

  this.emit('render', render);
  this.ui.render(render.message, render.append);
};

/**
 * Format the prompt message.
 *
 * ```js
 * var answers = {};
 * var Prompt = require('prompt-base');
 * var prompt = new Prompt({
 *   name: 'name',
 *   message: 'What is your name?',
 *   transform: function(input) {
 *     return input.toUpperCase();
 *   }
 * });
 * ```
 * @return {String}
 * @api public
 */

Prompt.prototype.renderMessage = function() {
  return this.prefix + log.bold(this.message) + ' ';
};

/**
 * Called by [render](#render) to render a help message when the
 * `prompt.status` is `initialized` or `help` (usually when the
 * prompt is first rendered). Calling this method changes the
 * `prompt.status` to `"interacted"`, and as such, by default, the
 * message is only displayed until the user interacts. By default
 * the help message is positioned to the right of the prompt "question".
 * A custom help message may be defined on `options.helpMessage`.
 *
 * @param {boolean|string|undefined} `valid`
 * @return {String}
 * @api public
 */

Prompt.prototype.renderHelp = function() {
  this.status = 'interacted';
  var message = this.options.helpMessage || this.helpMessage || '';
  var val = this.getDefault();
  if (!message && val != null) {
    message = log.dim('(' + val + ') ');
  }
  return message;
};

/**
 * Render an error message in the prompt, when `valid` is
 * false or a string. This is used when a validation method
 * either returns `false`, indicating that the input
 * was invalid, or the method returns a string, indicating
 * that a custom error message should be rendered. A custom
 * error message may also be defined on `options.errorMessage`.
 *
 * @default `>> invalid input`
 * @param {boolean|string|undefined} `valid`
 * @return {String}
 * @api public
 */

Prompt.prototype.renderError = function(valid) {
  if (valid === false) {
    return this.options.errorMessage || this.errorMessage;
  }
  if (typeof valid === 'string') {
    return log.red('>> ') + valid;
  }
  return '';
};

/**
 * Called by [render](#render) to render the readline `line`
 * when `prompt.status` is anything besides `answered`, which
 * includes everything except for error and help messages.
 *
 * @return {String}
 * @api public
 */

Prompt.prototype.renderOutput = function() {
  return this.renderMask(this.rl.line);
};

/**
 * Mask user input. Called by [renderOutput](#renderOutput),
 * this is an identity function that does nothing by default,
 * as it's intended to be overwritten in custom prompts, such
 * as [prompt-password][].
 *
 * @return {String}
 * @api public
 */

Prompt.prototype.renderMask = function(input) {
  return input;
};

/**
 * Render the user's "answer". Called by [render](#render) when
 * the `prompt.status` is changed to `answered`.
 *
 * @return {String}
 * @api public
 */

Prompt.prototype.renderAnswer = function() {
  return log.cyan(this.renderMask(this.answer));
};

/**
 * Get action `name`, or set action `name` with the given `fn`.
 * This is useful for overridding actions in custom prompts.
 * Actions are used to move the pointer position, toggle checkboxes
 * and so on
 *
 * @param {String} `name`
 * @param {Function} `fn`
 * @return {Object|Function} Returns the prompt instance if setting, or the action function if getting.
 * @api public
 */

Prompt.prototype.action = function(name, fn) {
  if (typeof fn === 'function') {
    this.actions[name] = fn;
    return this;
  }
  return this.actions[name];
};

/**
 * Move the cursor in the given `direction` when a `keypress`
 * event is emitted.
 *
 * @param {String} `direction`
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.dispatch = function(input, key) {
  this.choices.position = this.position;
  var self = this;

  // don't handle "enter" and "return" (handle by "line")
  if (key.name === 'enter' || key.name === 'return') {
    return;
  }

  if (key.name === 'line') {
    input = this.getAnswer(input, key);
    this.status = 'submitted';
  }

  // on "shift+up" and "shift+down", add or remove
  // vertical lines to display more of the prompt
  if (this.options.expandHeight !== false && key.shift === true) {
    switch (key.name) {
      case 'up':
        this.options.limit--;
        break;
      case 'down':
        this.options.limit++;
        break;
    }
    this.render();
    return;
  }

  Promise.resolve(this.validate(input, key))
    .then(function(state) {
      var action = self.action(key.name);
      self.state = state;

      // handle the "enter" keypress event
      if (key.name === 'line' && state === true) {
        self.render(state);
        return self.submitAnswer(input);
      }

      // dispatch actions, if one matches a keypress
      if (typeof action === 'function') {
        self.position = action.call(self.actions, self.position, key);
      }

      // re-render the prompt in the terminal
      self.render(state);
    })
    .catch(this.onError);
};

/**
 * Default error event handler. If an `error` listener exist, an `error`
 * event will be emitted, otherwise the error is logged onto `stderr` and
 * the process is exited. This can be overridden in custom prompts.
 * @param {Object} `err`
 * @api public
 */

Prompt.prototype.onError = function(err) {
  if (this.hasListeners('error')) {
    this.emit('error', err);
  } else {
    this.end();
    console.error(err);
    this.callback();
  }
};

/**
 * Get the answer to use. This can be overridden in custom prompts.
 * @api public
 */

Prompt.prototype.getDefault = function() {
  if (this.choices && this.choices.length && isNumber(this.question.default)) {
    var choice = this.choices.get(this.question.default);
    this.position = this.choices.items.indexOf(choice);
    this.question.default = choice.name;
  }
  return this.question.default;
};

/**
 * Get the answer to use. This can be overridden in custom prompts.
 * @api public
 */

Prompt.prototype.getAnswer = function(input, key) {
  this.answer = this.question.getAnswer(input || this.getDefault(), key);
  return this.answer;
};

/**
 * Re-render and pass the final answer to the callback.
 * This can be replaced by custom prompts.
 * @api public
 */

Prompt.prototype.submitAnswer = function(answer) {
  setImmediate(function() {
    this.status = 'answered';
    this.end();
    this.emit('answer', answer);
    this.rl.line = '';
    this.callback(answer);
  }.bind(this));
};

/**
 * Ensures that events for event `name` are only **registered**
 * once and are disabled correctly when specified. This is
 * different from `.once`, which only **emits** once.
 *
 * ```js
 * prompt.only('keypress', function() {
 *   // do keypress stuff
 * });
 * ```
 * @api public
 */

Prompt.prototype.only = function(name, fn) {
  this._only = this._only || {};
  if (arguments.length === 0) {
    for (var key in this._only) {
      this.ui.off(key, this._only[key]);
    }
    return;
  }
  this._only[name] = fn;
  this.ui.on(name, fn);
  return fn;
};

/**
 * Mutes the output stream that was used to create the
 * readline interface, and returns a function for unmuting the
 * stream. This is useful in unit tests.
 *
 * ```js
 * // mute the stream
 * var unmute = prompt.mute();
 *
 * // unmute the stream
 * unmute();
 * ```
 * @return {Function}
 * @api public
 */

Prompt.prototype.mute = function() {
  var rl = this.rl;
  var unmute = rl.output.unmute;
  rl.output.unmute = function() {};
  rl.output.mute();

  return function() {
    rl.output.unmute = unmute;
    unmute();
  };
};

/**
 * Pause the readline and unmute the output stream that was
 * used to create the readline interface, which is `process.stdout`
 * by default.
 *
 * @api public
 */

Prompt.prototype.end = function(render) {
  this.only();
  if (render !== false) {
    this.render();
  }
  this.ui.end(render);
  this.rl.pause();
};

/**
 * [Resume][resume] the readline input stream if it has been paused.
 * @return {undefined}
 * @api public
 */

Prompt.prototype.resume = function() {
  this.status = 'initialized';
  this.rl.resume();
};

/**
 * Initialize event listeners
 */

Prompt.prototype.initListeners = function() {
  var prompt = this;
  var on = {};

  // allow events to be defined using `question.on`. this is
  // defined as a setter/getter to allow events to be lazily
  // added after instantiation
  Object.defineProperty(this.question, 'on', {
    set: function(listeners) {
      prompt.addListeners(listeners);
      on = listeners;
    },
    get: function() {
      return on;
    }
  });
};

/**
 * Add an object of event listeners
 */

Prompt.prototype.addListeners = function(listeners) {
  var keys = Object.keys(listeners);
  for (var i = 0; i < keys.length; i++) {
    this.only(keys[i], listeners[keys[i]].bind(this));
  }
};

/**
 * Getter for getting the choices array from the question.
 *
 * @name .choices
 * @return {Object} Choices object
 * @api public
 */

Object.defineProperty(Prompt.prototype, 'choices', {
  set: function(choices) {
    this.question.choices = choices;
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
  set: function(message) {
    this.question.message = message;
  },
  get: function() {
    return this.question.message;
  }
});

/**
 * Getter/setter that returns the prefix to use before `question.message`.
 * The default value is a green `?`.
 *
 * ```js
 * // customize
 * prompt.prefix = ' ❤ ';
 * ```
 * @name .prefix
 * @return {String} The formatted prefix.
 * @api public
 */

Object.defineProperty(Prompt.prototype, 'prefix', {
  set: function(input) {
    this.question.prefix = input;
  },
  get: function() {
    return this.question.prefix || (log.cyan('?') + ' ');
  }
});

/**
 * Create a new `Question`. See [prompt-question][] for more details.
 *
 * ```js
 * var question = new Prompt.Question({name: 'foo'});
 * ```
 * @param {Object} `options`
 * @return {Object} Returns an instance of [prompt-question][]
 * @api public
 */

Prompt.Question = Question;

/**
 * Create a new `Choices` object. See [prompt-choices][]
 * for more details.
 *
 * ```js
 * var choices = new Prompt.Choices(['foo', 'bar', 'baz']);
 * ```
 * @param {Array} `choices` Array of choices
 * @return {Object} Returns an intance of Choices.
 * @api public
 */

Prompt.Choices = Question.Choices;

/**
 * Create a new `Separator` object. See [choices-separator][] for more details.
 *
 * ```js
 * new Prompt.Separator('---');
 * ```
 * @param {String} `separator` Optionally pass a string to use as the separator.
 * @return {Object} Returns a separator object.
 * @api public
 */

Prompt.Separator = Question.Separator;

/**
 * Expose `Prompt`
 */

module.exports = Prompt;
