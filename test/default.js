'use strict';

require('mocha');
var assert = require('assert');
var Prompt = require('..');
var prompt;
var unmute;

describe('.default', function() {
  beforeEach(function() {
    prompt = new Prompt({name: 'fixture'});
    unmute = prompt.mute();
  });

  afterEach(function() {
    unmute();
  });

  it('should use default answer when answer is empty string', function(cb) {
    prompt.question.default = 'woohooo!';
    prompt.run()
      .then(function(answer) {
        assert.equal(typeof answer, 'string');
        assert.equal(answer, 'woohooo!');
        cb();
      })
      .catch(cb);

    prompt.rl.input.emit('keypress', '\n');
  });

  it('should use default answer when answer is undefined', function(cb) {
    prompt.question.default = 'woohooo!';
    prompt.run()
      .then(function(answer) {
        assert.equal(typeof answer, 'string');
        assert.equal(answer, 'woohooo!');
        cb();
      })
      .catch(cb);

    prompt.rl.emit('line');
  });
});
