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

  it('should not use default value when answer is given', function(cb) {
    prompt.question.default = 'woohooo!';
    prompt.run()
      .then(function(answer) {
        assert.equal(typeof answer, 'string');
        assert.equal(answer, 'foo');
        cb();
      })
      .catch(cb);

    prompt.rl.input.emit('keypress', 'foo');
    prompt.rl.input.emit('keypress', '\n');
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

  it('should get default as a string for text prompt', function(cb) {
    prompt.question.default = 'woohooo!';
    assert.equal(prompt.getDefault(), 'woohooo!');
    cb();
  });

  it('should get choices default as a string', function(cb) {
    prompt.question.choices = ['foo', 'bar', 'baz'];
    prompt.question.default = 'bar';
    assert.equal(prompt.getDefault(), 'bar');
    cb();
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
