'use strict';

const log = require('log-utils');
const Emitter = require('component-emitter');
const Terminal = require('readline-terminal');
const Question = require('enquirer-question');
const isNumber = require('is-number');
const UI = require('readline-ui');

/**
 * Create a new Prompt
 */

function Prompt(question, answers, rl) {
  this.options = new Question(question);
  this.answers = answers || {};
  this.session = true;

  // Check to make sure prompt requirements are there
  if (!isString(this.options.message)) {
    throw new TypeError('expected message to be a string');
  }
  if (!isString(this.options.name)) {
    throw new TypeError('expected name to be a string');
  }

  // Normalize choices
  if (Array.isArray(this.options.choices)) {
    this.options.addChoices(this.options.choices, answers);
  }

  if (typeof rl === 'undefined') {
    this.session = false;
    var ui = new UI(this.options);
    rl = ui.rl;
  }

  this.rl = rl;
  this.close = this.rl.close.bind(this.rl);
  this.terminal = new Terminal(this.rl);
  this.status = 'pending';
  this.initPrompt();

  this.rl.on('line', this.emit.bind(this, 'line'));
  this.rl.input.on('keypress', function(val, key) {
    key = key || {};
    var event = { key: key, value: val };
    if (event.key.name !== 'enter' && event.key.name !== 'return') {
      event = normalize(event);
      this.emit('keypress', event);
      if (event.key.name) {
        this.emit(event.key.name, event);
      }
    }
  }.bind(this));
};

/**
 * Decorate Emitter methods
 */

Emitter(Prompt.prototype);

/**
 * Initialize prompt defaults
 */

Prompt.prototype.initPrompt = function() {
  if (typeof this.options.when === 'function') {
    this.when = this.options.when.bind(this);
  }
  if (typeof this.options.validate === 'function') {
    this.validate = this.options.validate.bind(this);
  }
  if (typeof this.options.filter === 'function') {
    this.filter = this.options.filter.bind(this);
  }

  var message = this.options.message;
  var self = this;

  Object.defineProperty(this, 'message', {
    set: function(val) {
      message = val;
    },
    get: function() {
      return self.format(message);
    }
  });
};

/**
 * Default `when` method, overridden in custom prompts.
 */

Prompt.prototype.when = function() {
  return true;
};

/**
 * Default `validate` method, overridden in custom prompts.
 */

Prompt.prototype.validate = function(val, cb) {
  if (typeof this.options.validate === 'function') {
    return this.options.validate(val, cb);
  }
  return cb(true);
};

/**
 * Default `filter` method, overridden in custom prompts.
 */

Prompt.prototype.filter = function(val) {
  return val;
};

/**
 * Default `ask` method, overridden in custom prompts.
 */

Prompt.prototype.ask = function(next) {
  next();
};

/**
 * Used if `when` returns false
 */

Prompt.prototype.noop = function(next) {
  next();
};

/**
 * Initialize prompt session and resolve answers.
 * @return {Promise}
 */

Prompt.prototype.run = function(answers) {
  var name = this.options.name;
  var when = this.when(answers);
  var ask = when ? this.ask.bind(this) : this.noop;

  return new Promise(function(resolve) {
    ask(function(value) {
      if (typeof value !== 'undefined') {
        answers[name] = value;
      }
      resolve(answers);
    });
  });
};

/**
 * Generate the prompt question string
 * @return {String} prompt question string
 */

Prompt.prototype.format = function(msg) {
  var message = log.green('?') + ' ' + log.bold(msg) + ' ';
  if (typeof this.options.default !== 'undefined' && this.status !== 'answered') {
    message += log.dim('(' + this.options.default + ') ');
  }
  return message;
};

/**
 * Utils
 */

function isString(val) {
  return val && typeof val === 'string';
}

/**
 * Normalize keypress events
 */

function normalize(e) {
  if (!e || !e.key || e.key.name === 'enter' || e.key.name === 'return') return;
  if (e.key.name === 'up' || e.key.name === 'k' || (e.key.name === 'p' && e.key.ctrl)) {
    e.key.name = 'up';
  }
  if (e.key.name === 'down' || e.key.name === 'j' || (e.key.name === 'n' && e.key.ctrl)) {
    e.key.name = 'down';
  }
  if (isNumber(e.value) && !/^\s+$/.test(String(e.value))) {
    e.value = Number(e.value);
    e.key.name = 'number';
  }
  return e;
}

/**
 * Expose `Prompt`
 */

module.exports = Prompt;
