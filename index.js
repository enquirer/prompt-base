'use strict';

var log = require('log-utils');
var define = require('define-property');
var Emitter = require('component-emitter');
var Question = require('enquirer-question');
var isNumber = require('is-number');
var utils = require('readline-utils');
var UI = require('readline-ui');

/**
 * Create a new Prompt
 */

function Prompt(question, answers, ui) {
  this.ui = ui;
  this.question = new Question(question);
  this.answers = answers || {};
  this.status = 'pending';
  this.active = true;

  // Check to make sure prompt requirements are there
  if (!isString(this.question.message)) {
    throw new TypeError('expected message to be a string');
  }
  if (!isString(this.question.name)) {
    throw new TypeError('expected name to be a string');
  }

  // Normalize choices
  if (Array.isArray(this.question.choices)) {
    this.question.addChoices(this.question.choices, answers);
  }

  define(this, 'options', this.question);
  if (typeof this.ui === 'undefined') {
    this.ui = new UI(this.options);
    this.active = false;
  }

  this.rl = this.ui.rl;
  this.initPrompt();
};

/**
 * Decorate Emitter methods
 */

Emitter(Prompt.prototype);

/**
 * Initialize prompt defaults
 */

Prompt.prototype.initPrompt = function() {
  this.close = this.ui.close.bind(this.ui);
  var self = this;

  Object.defineProperty(this, 'message', {
    set: function(val) {
      message = val;
    },
    get: function() {
      return self.format(self.question.message);
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

Prompt.prototype.validate = function(val) {
  if (typeof this.question.validate === 'function') {
    return this.question.validate(val);
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
  var name = this.question.name;
  var when = this.when(answers);
  var ask = when ? this.ask.bind(this) : this.noop;
  var self = this;

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
  if (typeof this.question.default !== 'undefined' && this.status !== 'answered') {
    message += log.dim('(' + this.question.default + ') ');
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
 * Expose `Prompt`
 */

module.exports = Prompt;
