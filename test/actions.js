'use strict';

require('mocha');
var assert = require('assert');
var Prompt = require('..');
var prompt;
var unmute;

describe('.actions', function() {
  beforeEach(function() {
    prompt = new Prompt({name: 'fixture'});
    unmute = prompt.mute();
  });

  afterEach(function() {
    unmute();
  });

  it('should handle "enter" keypress events', function(cb) {
    var events = [];

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 1);
      assert.equal(events[0], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', '\n');
  });

  it('should handle "number" keypress events', function(cb) {
    var events = [];

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 2);
      assert.equal(events[0], 'number');
      assert.equal(events[1], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', '1', {name: 'number'});
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should handle "number" keypress events with choices', function(cb) {
    var events = [];

    prompt.choices = ['foo', 'bar', 'baz'];
    prompt.radio = null;
    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 2);
      assert.equal(events[0], 'number');
      assert.equal(events[1], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', '1', {name: 'number'});
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should handle out of range "number" keypress events', function(cb) {
    var events = [];

    prompt.choices = ['foo', 'bar', 'baz'];
    prompt.radio = null;
    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 2);
      assert.equal(events[0], 'number');
      assert.equal(events[1], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', '9', {name: 'number'});
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should call prompt.radio on "number" keypress events', function(cb) {
    var events = [];

    prompt.choices = ['foo', 'bar', 'baz'];
    prompt.radio = function() {
      events.push('radio');
    };

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 3);
      assert.equal(events[0], 'number');
      assert.equal(events[1], 'enter');
      assert.equal(events[2], 'radio');
      cb();
    });

    prompt.rl.input.emit('keypress', '1', {name: 'number'});
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should handle "space" keypress events', function(cb) {
    var events = [];

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 2);
      assert.equal(events[0], 'space');
      assert.equal(events[1], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', ' ');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should call prompt.radio on "space" keypress events', function(cb) {
    var events = [];

    prompt.choices = ['foo', 'bar', 'baz'];
    prompt.radio = function() {
      events.push('radio');
    };

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 3);
      assert.equal(events[0], 'space');
      assert.equal(events[1], 'enter');
      assert.equal(events[2], 'radio');
      cb();
    });

    prompt.rl.input.emit('keypress', ' ');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should handle "tab" keypress events', function(cb) {
    var events = [];

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 2);
      assert.equal(events[0], 'tab');
      assert.equal(events[1], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', '\t');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should handle "a" keypress events', function(cb) {
    var events = [];

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 2);
      assert.equal(events[0], 'a');
      assert.equal(events[1], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', 'a');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should call "move" on "a" keypress events', function(cb) {
    var events = [];

    prompt.choices = ['a', 'b', 'c'];
    var move = prompt.move.bind(prompt);
    prompt.move = function() {
      events.push('move');
      return move.apply(prompt, arguments);
    };

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 3);
      assert.equal(events[0], 'a');
      assert.equal(events[1], 'enter');
      assert.equal(events[2], 'move');
      cb();
    });

    prompt.rl.input.emit('keypress', 'a');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should handle "i" keypress events', function(cb) {
    var events = [];

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 2);
      assert.equal(events[0], 'i');
      assert.equal(events[1], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', 'i');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should handle "up" keypress events', function(cb) {
    var events = [];

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 2);
      assert.equal(events[0], 'up');
      assert.equal(events[1], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', 'p', {ctrl: true});
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should handle "down" keypress events', function(cb) {
    var events = [];

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 2);
      assert.equal(events[0], 'down');
      assert.equal(events[1], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', 'n', {ctrl: true});
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should call "move" on "down" keypress events', function(cb) {
    var events = [];
    prompt.choices = ['foo', 'bar', 'baz'];
    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 2);
      assert.equal(events[0], 'down');
      assert.equal(events[1], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', 'n', {ctrl: true});
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should call "move" on "down" keypress events', function(cb) {
    var events = [];
    prompt.choices = ['foo', 'bar', 'baz'];
    assert.equal(prompt.position, undefined);

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(prompt.position, 1); //<= zero-based index
      assert.equal(events.length, 2);
      assert.equal(events[0], 'number');
      assert.equal(events[1], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', '2');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should handle "error" events', function(cb) {
    var events = [];

    prompt.onError = function(err) {
      events.push(err);
    };

    prompt.ask(function() {
      assert.equal(events.length, 1);
      assert(events[0] instanceof Error);
      assert.equal(events[0].message, 'foo');
      cb();
    });

    prompt.ui.emit('error', new Error('foo'));
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should emit "error" events', function(cb) {
    var events = [];

    prompt.on('error', function(err) {
      events.push(err);
    });

    prompt.ask(function() {
      assert.equal(events.length, 1);
      assert(events[0] instanceof Error);
      assert.equal(events[0].message, 'foo');
      cb();
    });

    prompt.ui.emit('error', new Error('foo'));
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should log out "error" events', function(cb) {
    var events = [];
    var log = console.error;

    console.error = function(err) {
      events.push(err);
    };

    prompt.ask(function() {
      console.error = log;
      assert.equal(events.length, 1);
      assert(events[0] instanceof Error);
      assert.equal(events[0].message, 'foo');
      cb();
    });

    prompt.ui.emit('error', new Error('foo'));
    prompt.rl.input.emit('keypress', '\n');
  });
});
