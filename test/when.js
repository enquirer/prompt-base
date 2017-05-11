'use strict';

require('mocha');
var assert = require('assert');
var Prompt = require('..');
var prompt;
var unmute;

describe('.when', function() {
  beforeEach(function() {
    prompt = new Prompt({name: 'fixture'});
    unmute = prompt.mute();
  });

  afterEach(function() {
    unmute();
  });

  it('should prompt when true', function(cb) {
    var count = 0;

    prompt.question.when = function() {
      count++;
      return true;
    };

    prompt.run()
      .then(function(answer) {
        assert.equal(answer, 'green');
        assert.equal(count, 1);
        cb();
      })
      .catch(cb);

    prompt.rl.emit('line', 'green');
  });

  it('should not prompt when false', function(cb) {
    var count = 0;

    prompt.question.when = function() {
      count++;
      return false;
    };

    prompt.run()
      .then(function(answer) {
        assert.equal(typeof answer, 'undefined');
        assert.equal(count, 1);
        cb();
      })
      .catch(cb);

    prompt.rl.emit('line', 'green');
  });
});
