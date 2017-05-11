'use strict';

require('mocha');
var assert = require('assert');
var Prompt = require('..');
var prompt;
var unmute;

describe('.question', function() {
  beforeEach(function() {
    prompt = new Prompt({name: 'fixture'});
    unmute = prompt.mute();
  });

  afterEach(function() {
    unmute();
  });

  it('should add "question.on" functions as listeners', function(cb) {
    var count = 0;
    prompt.question.on = {
      keypress: function() {
        count++;
      }
    };

    prompt.run()
      .then(function(answer) {
        assert.deepEqual(answer, 'foo');
        assert.equal(count, 4);
        cb();
      })
      .catch(cb);

    prompt.rl.input.emit('keypress', 'f');
    prompt.rl.input.emit('keypress', 'o');
    prompt.rl.input.emit('keypress', 'o');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should get "question.on" functions (from getter)', function() {
    prompt.question.on = {
      keypress: function() {
      }
    };

    assert.equal(Object.keys(prompt.question.on).length, 1);
  });

  it('should set prompt.question.message', function() {
    prompt.message = 'foo';
    assert.equal(prompt.question.message, 'foo');
  });

  it('should set prompt.question.prefix', function() {
    prompt.prefix = ' ❤ ';
    assert.equal(prompt.question.prefix, ' ❤ ');
  });
});
