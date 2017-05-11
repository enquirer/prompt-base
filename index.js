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
  this.answer = this.question.default;
  this.name = this.question.name;
};

/**
 * Set initial values
 */

Prompt.prototype.initPrompt = function(ui) {
  this.ui = ui;

  if (typeof this.ui === 'undefined') {
    this.ui = UI.create(this.options);
  }

  this.question.options.ui = this.ui;
  this.rl = this.ui.rl;
  this.status = 'pending';
  this.session = true;
  this.called = 0;
  this.key = {};
  this.pause();
};

Prompt.prototype.initListeners = function() {
  var self = this;
  var on = {};

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

  Object.defineProperty(this.question, 'on', {
    set: function(val) {
      on = val;
      var keys = Object.keys(on);
      for (var i = 0; i < keys.length; i++) {
        self.only(keys[i], on[keys[i]].bind(self));
      }
    },
    get: function() {
      return on;
    }
  });
};

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

Prompt.prototype.validate = function(answer) {
  if (typeof this.question.validate === 'function') {
    return this.question.validate.apply(this, arguments);
  }
  return answer !== false;
};

/**
 * Default `transform` method, overridden in custom prompts.
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
 * Default `ask` method. This mayb eb overridden in custom prompts.
 * @api public
 */

Prompt.prototype.ask = function(callback) {
  this.rl.line = '';
  this.callback = callback.bind(this);
  this.resume();
  this.only('keypress', this.onKeypress.bind(this));
  this.only('error', this.onError.bind(this));
  this.only('line', this.onSubmit.bind(this));
  this.emit('ask', this);
  this.render();
};

/**
 * Initialize a prompt and resolve answers. If `question.when`
 * returns false, the prompt will be skipped.
 *
 * @param {Object} `answers`
 * @return {Promise}
 * @api public
 */

Prompt.prototype.run = function(answers) {
  answers = answers || {};

  this.resume();
  var transform = this.transform.bind(this);
  var onError = this.onError.bind(this);
  var when = this.when.bind(this);
  var ask = this.ask.bind(this);
  var self = this;

  return Promise.resolve(when(answers))
    .then(function(when) {
      if (when === false) {
        self.end(false);
        self.emit('answer', self.getAnswer());
        return Promise.resolve(self.getAnswer());
      }

      return new Promise(function(resolve) {
        ask(function(answer) {
          Promise.resolve(transform(answer))
            .then(function(val) {
              if (typeof val !== 'undefined') {
                answers[self.name] = val;
                self.question.answer = val;
              }
              resolve(val);
            })
            .catch(onError);
        });
      });
    })
    .catch(onError);
};

/**
 * Render the current prompt input. This can be replaced by custom prompts.
 *
 * ```js
 * prompt.ui.on('keypress', prompt.render.bind(prompt));
 * ```
 * @api public
 */

Prompt.prototype.render = function(state) {
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
 * @api public
 */

Prompt.prototype.action = function(state, str, key) {
  this.position = this.position || 0;
  this.state = state;
  this.key = key;

  switch (key && key.name) {
    case 'enter':
    case 'return':
      this.onEnterKey(str, key, state);
      return;
    case 'number':
      this.onNumberKey(str, key, state);
      break;
    case 'space':
      this.onSpaceKey(str, key, state);
      break;
    case 'tab':
      this.onTabKey(str, key, state);
      break;
    case 'up':
    case 'down':
      this.position = this.move(key);
      break;
    case 'a':
    case 'i':
      this.move(key);
      break;
    default: {
      // do nothing... yet
      break;
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

Prompt.prototype.move = function(key) {
  if (this.choices && this.choices.length) {
    return this.choices.action(key.name, this.position);
  }
};

/**
 * Default `return` event handler. This may be overridden in custom prompts.
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.onEnterKey = function(str, key, state) {
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
  var isValid = this.rl.line ? this.validate(this.rl.line, key) : true;
  var self = this;

  Promise.resolve(isValid)
    .then(function(state) {
      self.action(state, str, key);
    })
    .catch(this.onError.bind(this));
};

/**
 * Default `number` event handler. This may be overridden in
 * custom prompts.
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.onNumberKey = function(str, key, state) {
  if (this.choices && this.choices.length) {
    var num = Number(key.value);
    if (num <= this.choices.length) {
      this.position = num - 1;

      if (this.radio) {
        this.radio();
      }
    }
  }
};

/**
 * Default `space` event handler. This may be overridden in custom prompts.
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.onSpaceKey = function(str, key, state) {
  this.spaceKeyPressed = true;
  key.value = '';

  if (typeof this.radio === 'function') {
    this.radio();
  }
};

/**
 * When the answer is submitted (user presses `enter` key), re-render
 * and pass answer to callback. This may be replaced by custom prompts.
 * @param {Object} `input`
 * @api public
 */

Prompt.prototype.onSubmit = function(input) {
  this.answer = this.getAnswer(input);
  var self = this;

  Promise.resolve(this.validate(this.answer))
    .then(function(isValid) {
      if (isValid === true) {
        self.submitAnswer();
      } else {
        self.render(isValid);
      }
    })
    .catch(this.onError.bind(this));
};

/**
 * Default `tab` event handler. This may be overridden in custom prompts.
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.onTabKey = function(str, key, state) {
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
  this.status = 'answered';
  this.emit('answer', this.answer);
  utils.showCursor(this.rl);
  this.end();
  this.callback(this.answer);
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
 * prompt.prefix = '!';
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
