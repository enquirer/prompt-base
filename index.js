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
  if (!isString(this.question.message)) {
    throw new TypeError('expected message to be a string');
  }
  if (!isString(this.question.name)) {
    throw new TypeError('expected name to be a string');
  }

  define(this, 'options', this.question);
  this.question.options.ui = this.ui;
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

  this.status = 'pending';
  this.session = true;
  this.called = 0;
  this.rl = this.ui.rl;
  this.key = {};
  this.pause();
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
 * Mask the given answer if `prompt.options.mask` is a function
 * @param {String} `str`
 */

Prompt.prototype.mask = function(answer) {
  if (typeof answer !== 'string') return answer;
  if (typeof this.options.mask === 'function') {
    return this.options.mask.apply(this, arguments);
  }
  return answer;
};

/**
 * Default `transform` method, overridden in custom prompts.
 */

Prompt.prototype.transform = function(answer) {
  if (typeof this.question.transform === 'function') {
    return this.question.transform.apply(this, arguments);
  }
  if (typeof this.question.filter === 'function') {
    return this.question.filter.apply(this, arguments);
  }
  return answer;
};

/**
 * Default `ask` method. This mayb eb overridden in custom prompts.
 * @api public
 */

Prompt.prototype.ask = function(callback) {
  this.callback = callback.bind(this);
  this.resume();
  this.only('keypress', this.onKeypress.bind(this));
  this.only('error', this.onError.bind(this));
  this.only('line', this.onSubmit.bind(this));
  this.emit('ask', this);
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
  answers = answers || {};

  this.resume();
  var transform = this.transform.bind(this);
  var ask = this.ask.bind(this);
  var self = this;

  return Promise.resolve(this.when(answers))
    .then(function(when) {
      if (when === false) {
        self.end(false);
        self.emit('answer', self.question.answer);
        return Promise.resolve(self.question.answer);
      }

      return new Promise(function(resolve) {
        ask(function(answer) {
          Promise.resolve(transform(answer))
            .then(function(val) {
              if (typeof val !== 'undefined') {
                answers[self.name] = val;
                self.question.answer = val;
              }
              resolve(self.question.answer);
            });
        });
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

Prompt.prototype.render = function(err) {
  var error = typeof err === 'string'
    ? log.red('>> ') + err
    : '';

  var message = this.message + (this.status === 'answered'
    ? log.cyan(this.mask(this.answer))
    : this.mask(this.rl.line));

  this.ui.render(message, error);
};

/**
 * Move the cursor in the specific `direction` when the
 * given `event` is emitted.
 *
 * @param {String} `direction`
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.move = function(direction, key) {
  if (direction && typeof this.choices.move[direction] === 'function') {
    this.position = this.choices.move[direction](this.position, key);
    this.render();
  }
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
  this.state = state;
  this.key = key;

  switch (key && key.name) {
    case 'space':
      this.onSpaceKey(str, key, state);
      break;
    case 'tab':
      this.onTabKey(str, key, state);
      break;
    case 'number':
      this.onNumberKey(str, key, state);
      break;
    case 'up':
    case 'right':
    case 'down':
    case 'left':
      if (this.choices) {
        this.move(key.name, key);
        break;
      }

      this.render(state);
      break;
    default:
      this.render(state);
      break;
  }
};

/**
 * Default `keypress` event handler. This may be overridden in custom prompts.
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
    .catch(function(err) {
      console.error(err);
      process.exit(1);
    })
};

Prompt.prototype.onNumberKey = function(str, key, state) {
  if (this.choices) {
    var num = Number(key.value);
    if (num <= this.choices.length) {
      this.position = num - 1;
      this.radio();
    }
    this.render();
    return;
  }
  this.render(state);
};

/**
 * Default `tab` event handler. This may be overridden in custom prompts.
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.onTabKey = function(str, key, state) {
  this.render(state);
};

/**
 * Default `space` event handler. This may be overridden in custom prompts.
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.onSpaceKey = function(str, key, state) {
  if (this.choices && typeof this.radio === 'function') {
    this.radio();
  }
  this.spaceKeyPressed = true;
  this.render(state);
};

/**
 * Default `error` event handler. This may be overridden in custom prompts.
 * @param {Object} `event`
 * @api public
 */

Prompt.prototype.onError = function(str, key, state) {
  this.render(state);
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

  this.once('answer', function() {
    utils.showCursor(self.rl);
  });

  Promise.resolve(this.validate(this.answer))
    .then(function(isValid) {
      if (isValid === true) {
        self.status = 'answered';
        self.submitAnswer(answer);
      } else {
        self.rl.line += input;
        self.render(isValid);
      }
    });
};

/**
 * Get the answer to use
 */

Prompt.prototype.getAnswer = function(input) {
  return this.question.getAnswer(input);
};

/**
 * Re-render and pass the final answer to the callback.
 * This can be replaced by custom prompts.
 */

Prompt.prototype.submitAnswer = function(input) {
  if (this.status === 'pending') {
    this.status = 'answered';
    this.answer = input;
  }
  setImmediate(function() {
    this.emit('answer', this.answer);
    this.end();
    this.callback(this.answer);
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
  if (arguments.length === 1) {
    return this._only[name];
  }
  this._only[name] = fn;
  this.ui.on(name, fn);
  return fn;
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

Prompt.prototype.write = function(line, event) {
  setImmediate(function() {
    this.rl.write(line, event);
  }.bind(this));
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
 * Close readline
 */

Prompt.prototype.close = function() {
  this.ui.close();
};

/**
 * Separator
 */

Prompt.prototype.separator = function() {
  return this.question.separator.apply(this, arguments);
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
    define(this, '_choices', val);
  },
  get: function() {
    return (this._choices || this.question.choices);
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
    throw new Error('prompt.message is a getter and cannot be defined');
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
  set: function() {
    throw new Error('.prefix is a getter and cannot be defined');
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
