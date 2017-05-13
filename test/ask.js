'use strict';

require('mocha');
var assert = require('assert');
var Prompt = require('..');
var prompt;
var unmute;

describe('.ask', function() {
  beforeEach(function() {
    prompt = new Prompt({name: 'fixture'});
    unmute = prompt.mute();
  });

  afterEach(function() {
    unmute();
  });

  it('should add input from multiple keypress events to readline', function(cb) {
    var count = 0;
    prompt.only('keypress', function() {
      count++;
    });

    prompt.ask(function(answer) {
      assert.deepEqual(answer, 'foo');
      assert.equal(count, 4);
      cb();
    });

    prompt.rl.input.emit('keypress', 'f');
    prompt.rl.input.emit('keypress', 'o');
    prompt.rl.input.emit('keypress', 'o');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should emit multiple times for multiple characters', function(cb) {
    var count = 0;
    prompt.only('keypress', function() {
      count++;
    });

    prompt.ask(function(answer) {
      assert.deepEqual(answer, 'foo');
      assert.equal(count, 4);
      cb();
    });

    prompt.rl.input.emit('keypress', 'foo\n');
  });

  it('should return an input answer as a string', function(cb) {
    prompt.ask(function(answer) {
      assert.equal(typeof answer, 'string');
      assert.equal(answer, 'bar');
      cb();
    });

    prompt.rl.emit('line', 'bar');
  });

  it('should handle nested prompts', function(cb) {
    var answers = ['foo', 'bar', 'baz'];

    prompt.on('ask', function() {
      prompt.rl.emit('line', answers.shift());
    });

    prompt.ask(function(answer) {
      assert.equal(typeof answer, 'string');
      assert.equal(answer, 'foo');

      prompt.ask(function(answer) {
        assert.equal(typeof answer, 'string');
        assert.equal(answer, 'bar');

        prompt.ask(function(answer) {
          assert.equal(typeof answer, 'string');
          assert.equal(answer, 'baz');
          cb();
        });
      });
    });
  });
});
