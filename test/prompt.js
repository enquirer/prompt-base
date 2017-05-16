'use strict';

require('mocha');
var assert = require('assert');
var UI = require('readline-ui');
var Prompt = require('..');
var prompt;

describe('prompt-base', function() {
  it('should export a function', function() {
    assert.equal(typeof Prompt, 'function');
  });

  it('should intantiate', function() {
    prompt = new Prompt({name: 'foo'});
    assert(prompt instanceof Prompt);
  });

  it('should intantiate without new', function() {
    prompt = Prompt({name: 'foo'});
    assert(prompt instanceof Prompt);
  });

  it('should throw an error when invalid args are passed', function() {
    assert.throws(function() {
      Prompt();
    }, /expected question to be a string or object/);

    assert.throws(function() {
      prompt = new Prompt();
    }, /expected question to be a string or object/);
  });

  it('should throw an error when question.name is not a string', function() {
    assert.throws(function() {
      Prompt({});
    }, /expected name to be a non-empty string/);
  });

  it('should expose readline-ui on prompt.ui', function() {
    assert(prompt.ui);
    assert.equal(typeof prompt.ui.emit, 'function');
  });

  it('should take a custom readline-ui instance', function() {
    var ui = new UI();
    prompt = new Prompt({name: 'foo'}, {}, ui);
    assert(prompt.ui);
    assert.strictEqual(ui, prompt.ui);
  });
});
