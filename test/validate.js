'use strict';

require('mocha');
var strip = require('strip-color');
var capture = require('capture-stream');
var assert = require('assert');
var Prompt = require('..');
var prompt;
var unmute;

describe('.validate', function() {
  beforeEach(function() {
    prompt = new Prompt({name: 'fixture'});
    unmute = prompt.mute();
  });

  afterEach(function() {
    unmute();
  });

  it('should validate an answer', function(cb) {
    var count = 0;

    prompt.question.validate = function(val) {
      switch (val) {
        case 'foo':
          count++;
          prompt.rl.emit('line', 'bar');
          return false;
        case 'bar':
          count++;
          prompt.rl.emit('line', 'baz');
          return false;
        default: {
          count++;
          return true;
        }
      }
    };

    prompt.run()
      .then(function(answer) {
        assert.deepEqual(answer, 'baz');
        assert.equal(count, 3);
        unmute();
        cb();
      })
      .catch(cb);

    prompt.rl.emit('line', 'foo');
  });

  it('should validate an answer with a promise', function(cb) {
    var count = 0;

    prompt.question.validate = function(val) {
      return new Promise(function(resolve) {
        switch (val) {
          case 'foo':
            count++;
            prompt.rl.emit('line', 'bar');
            return resolve(false);
          case 'bar':
            count++;
            prompt.rl.emit('line', 'baz');
            return resolve(false);
          default: {
            count++;
            return resolve(true);
          }
        }
      });
    };

    prompt.run()
      .then(function(answer) {
        assert.deepEqual(answer, 'baz');
        assert.equal(count, 3);
        unmute();
        cb();
      })
      .catch(cb);

    prompt.rl.emit('line', 'foo');
  });

  it('should return a validation "error" message', function(cb) {
    var count = 0;
    var restore = capture(prompt.rl.output);
    prompt.question.validate = function(val) {
      switch (val) {
        case 'foo':
          count++;
          prompt.rl.emit('line', 'bar');
          return 'wrong answer!';
        case 'bar':
          count++;
          prompt.rl.emit('line', 'baz');
          return false;
        default: {
          count++;
          return true;
        }
      }
    };

    prompt.run()
      .then(function(answer) {
        var output = strip(restore(true)).split('\n').pop();
        assert.deepEqual(output, '>> wrong answer!');
        assert.deepEqual(answer, 'baz');
        assert.equal(count, 3);
        unmute();
        cb();
      })
      .catch(cb);

    prompt.rl.emit('line', 'foo');
  });
});
