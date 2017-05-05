'use strict';

require('mocha');
var assert = require('assert');
var Prompt = require('..');

describe('prompt-base', function() {
  it('should export a function', function() {
    assert.equal(typeof Prompt, 'function');
  });

  it('should intantiate', function() {
    var prompt = new Prompt({name: 'foo'});
    assert(prompt instanceof Prompt);
  });

  it('should intantiate without new', function() {
    var prompt = Prompt({name: 'foo'});
    assert(prompt instanceof Prompt);
  });

  it('should throw an error when invalid args are passed', function() {
    assert.throws(function() {
      Prompt();
    }, /expected question to be a string or object/);

    assert.throws(function() {
      new Prompt();
    }, /expected question to be a string or object/);
  });

  it('should return an answers object on run', function(cb) {
    var prompt = new Prompt({
      name: 'color',
      message: 'What is your favorite color?'
    });

    prompt.on('ask', function() {
      prompt.write('blue\n');
    });

    prompt.run()
      .then(function(answer) {
        assert.deepEqual(answer, 'blue');
        cb();
      })
  });

  it('should return an answers object on ask', function(cb) {
    var prompt = new Prompt({
      name: 'color',
      message: 'What is your favorite color?'
    });

    prompt.on('ask', function() {
      prompt.write('blue\n');
    });

    prompt.ask(function(answer) {
      assert.deepEqual(answer, 'blue');
      cb();
    });
  });
});
