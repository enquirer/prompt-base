'use strict';

require('mocha');
var assert = require('assert');
var Prompt = require('..');
var prompt;
var unmute;

describe('.transform', function() {
  beforeEach(function() {
    prompt = new Prompt({name: 'fixture'});
    unmute = prompt.mute();
  });

  afterEach(function() {
    unmute();
  });

  it('should transform the answer string', function(cb) {
    var count = 0;

    prompt.question.transform = function(answer) {
      count++;
      return answer.toUpperCase();
    };

    prompt.run()
      .then(function(answer) {
        assert.equal(answer, 'GREEN');
        assert.equal(count, 1);
        cb();
      })
      .catch(cb);

    prompt.rl.emit('line', 'green');
  });

  it('should support a value of "undefined"', function(cb) {
    var count = 0;

    prompt.question.transform = function(answer) {
      count++;
      return;
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

  it('should support "filter" for compatibility with inquirer', function(cb) {
    var count = 0;

    prompt.question.filter = function(answer) {
      count++;
      return answer.toUpperCase();
    };

    prompt.run()
      .then(function(answer) {
        assert.equal(answer, 'GREEN');
        assert.equal(count, 1);
        cb();
      })
      .catch(cb);

    prompt.rl.emit('line', 'green');
  });
});
