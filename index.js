'use strict';

var Base = require('base');
var log = require('log-utils');
var UI = require('readline-ui');
var debug = require('debug')('prompt-base');
var define = require('define-property');
var Question = require('prompt-question');
var utils = require('readline-utils');

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
  if (!question) {
    throw new TypeError('expected question to be a string or object');
  }

  if (!(this instanceof Prompt)) {
    var proto = Object.create(Prompt.prototype);
    Prompt.apply(proto, arguments);
    return proto;
  }

  debug('initializing from <%s>', __filename);
  Base.call(this);

  this.answers = answers || {};
  this.initQuestion(question);
  this.initPrompt(ui);
  this.initListeners();
};

/**
 * Inherit `Base`
 */

Base.extend(Prompt);

/**
 * Initialize `Question` object
 * @param {Object|String} `question`
 */

Prompt.prototype.initQuestion = function(question) {
  this.question = new Question(question);
  if (!isString(this.question.name)) {
    throw new TypeError('expected name to be a string');
  }

  define(this, 'options', this.question);
};

/**
 * Set initial prompt values
 * @param {Object} `ui` Instance of readline-ui
 */

Prompt.prototype.initPrompt = function(ui) {
  this.ui = ui;

  if (typeof this.ui === 'undefined') {
    this.ui = UI.create(this.options);
  }

  this.onError = this.onError.bind(this);
  this.answer = this.getAnswer();
  this.errorMessage = this.question.errorMessage || 'invalid input';
  this.rl = this.ui.rl;
  this.status = 'pending';
  this.session = true;
  this.position = 0;
  this.called = 0;
  this.key = {};
  this.pause();
};

/**
 * Initialize event listeners
 */

Prompt.prototype.initListeners = function() {
  var self = this;
  var on = {};

  // patch `.emit` to ensure that setImmediate is used
  // when `line` is emitted. this ensures that it's
  // pushed onto the front of the next call stack (and
  // isn't emitted to soon)
  if (!this.ui.lineEmitter) {
    this.ui.lineEmitter = true;
    var emit = this.rl.emit.bind(this.rl);
    this.rl.emit = function(name) {
      var args = arguments;
      if (name === 'line') {
        setImmediate(function() {
          emit.apply(null, args);
        });
      }
      emit.apply(null, args);
    };
  }

  // allow events to be defined using `question.on`. this is
  // defined as a setter/getter to allow events to be lazily
  // added after instantiation
  Object.defineProperty(this.question, 'on', {
    set: function(val) {
      var keys = Object.keys(val);
      on = val;
      for (var i = 0; i < keys.length; i++) {
        self.only(keys[i], val[keys[i]].bind(self));
      }
    },
    get: function() {
      return on;
    }
  });
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

Prompt.prototype.transform = function(answer) {
  answer = this.getAnswer(answer);
  if (typeof this.question.transform === 'function') {
    return this.question.transform.call(this, answer);
  }
  if (typeof this.question.filter === 'function') {
    return this.question.filter.call(this, answer);
  }
  return answer;
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
 *     return input && !/^[a-z]+$/i.test(input);
 *   }
 * });
 * ```
 * @return {Boolean}
 * @api public
 */

Prompt.prototype.validate = function(input, key) {
  if (typeof this.question.validate === 'function') {
    return this.question.validate.apply(this, arguments);
  }
  return input !== false;
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
 *   when: function() {
 *     return !answers.name;
 *   }
 * });
 * ```
 * @return {Boolean}
 * @api public
 */

Prompt.prototype.when = function() {
  if (typeof this.question.when === 'function') {
    return this.question.when.apply(this, arguments);
  }
  return true;
};

/**
 * Run the prompt with the given `callback` function. This method
 * is similar to [run](#run), but is async (does not return a promise),
 * and does not call [when](#when), [transform](#tranform) or
 * [validate](#validate). This may be overridden in custom prompts.
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
  this.callback = callback.bind(this);
  this.rl.line = '';
  this.resume();
  this.only('keypress', this.onKeypress.bind(this));
  this.only('error', this.onError.bind(this));
  this.only('line', this.onSubmit.bind(this));
  this.emit('ask', this);
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
 * (Re-)render the current prompt string. This is called to
 * render the initial prompt, then it's called again each
 * time something changes, like as the user types an input
 * value, or a multiple-choice option is selected. This method
 * may be overridden in custom prompts.
 *
 * ```js
 * prompt.ui.on('keypress', prompt.render.bind(prompt));
 * ```
 * @api public
 */

Prompt.prototype.render = function(state) {
  if (state === false) {
    state = this.errorMessage;
  }

  var append = typeof state === 'string'
    ? log.red('>> ') + state
    : '';

  var message = this.message;
  if (this.status === 'answered') {
    message += log.cyan(this.answer);
  } else {
    message += this.rl.line;
  }

  this.ui.render(message, append);
};

/**
 * Move the cursor in the specific `direction` when the
 * given `event` is emitted.
 *
 * @param {String} `direction`
 * @param {Object} `event`
 */

Prompt.prototype.action = function(state, str, key) {
  this.position = this.position || 0;

  switch (key && key.name) {
    case 'enter':
    case 'return':
      return;
    case 'number':
      this.position = Number(key.value);
      this.position = this.dispatch(key.name);
      break;
    case 'up':
    case 'down':
    case 'space':
    case 'tab':
    case 'a':
    case 'i':
      this.position = this.dispatch(key.name);
      break;
    default: {
      break; // do nothing... yet
    }
  }

  this.render(state);
};

/**
 * Move the cursor in the given `direction` when a `keypress`
 * event is emitted.
 *
 * @param {String} `direction`
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.dispatch = function(method) {
  return this.choices.action(method, this.position, this.options.radio);
};

/**
 * Default `return` event handler. This may be overridden in custom prompts.
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.onEnterKey = function(str, key) {
  // do nothing, by default this is handled by "line"
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
 * Default `keypress` event handler. This may be overridden
 * in custom prompts.
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.onKeypress = function(str, key) {
  var self = this;
  Promise.resolve(this.validate(str, key))
    .then(function(state) {
      self.action(state, str, key);
    })
    .catch(this.onError.bind(this));
};

/**
 * When the answer is submitted (user presses `enter` key), re-render
 * and pass answer to callback. This may be replaced by custom prompts.
 * @param {Object} `input`
 * @api public
 */

Prompt.prototype.onSubmit = function(input) {
  var answer = this.answer = this.getAnswer(input);
  var self = this;
  Promise.resolve(this.validate(answer))
    .then(function(state) {
      if (state === true) {
        self.submitAnswer(answer);
      } else {
        self.render(state);
      }
    })
    .catch(this.onError.bind(this));
};

/**
 * Default `tab` event handler. This may be overridden in custom prompts.
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.onTabKey = function(str, key) {
  // do nothing
};

/**
 * Get the answer to use
 */

Prompt.prototype.getAnswer = function(input) {
  return this.question.getAnswer(input || this.question.default);
};

/**
 * Re-render and pass the final answer to the callback.
 * This can be replaced by custom prompts.
 */

Prompt.prototype.submitAnswer = function(input) {
  utils.showCursor(this.rl);
  this.status = 'answered';
  this.end();

  setImmediate(function() {
    this.answer = this.getAnswer(input);
    this.emit('answer', this.answer);
    this.callback(this.answer);
    this.rl.line = '';
  }.bind(this));
};

/**
 * Handle events for event `name`
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
 * Proxy to [readline.write][rl] for manually writing output.
 * When called, rl.write() will resume the input stream if it
 * has been paused.
 *
 * ```js
 * prompt.write('blue\n');
 * prompt.write(null, {ctrl: true, name: 'l'});
 * ```
 * @return {undefined}
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
 * Pause readline
 */

Prompt.prototype.end = function(render) {
  this.only();
  if (render !== false) {
    this.render();
  }
  this.ui.end(render);
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
    return this.format(this.question.message);
  }
});

/**
 * Getter that returns the prefix to use before `question.message`. The
 * default value is a green `?`.
 *
 * ```js
 * prompt.prefix = ' ❤ ';
 * ```
 * @name .prefix
 * @return {String} The formatted prefix.
 * @api public
 */

Object.defineProperty(Prompt.prototype, 'prefix', {
  set: function(str) {
    this.question.prefix = str;
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
 * Return true if val is a string
 */

function isString(val) {
  return val && typeof val === 'string';
}

/**
 * Expose `Prompt`
 */

module.exports = Prompt;
