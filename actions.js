'use strict';

function Actions(prompt) {
  this.prompt = prompt;
  this.types = {};
}

Actions.prototype.set = function(type, fn) {
  this.actions[type] = fn;
  return this;
};

Actions.prototype.get = function(type) {
  var action = this.actions[type];
  if (typeof action !== 'function') {
    throw new TypeError('expected action "' + type + '" to be a function');
  }
  return action.bind(this.prompt);
};

/**
 * Expose `Actions`
 */

module.exports = Actions;
