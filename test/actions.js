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

  it('should call prompt.choices.radio on "number" keypress events', function(cb) {
    var events = [];

    prompt.choices = ['foo', 'bar', 'baz'];
    prompt.options.radio = true;
    prompt.choices.radio = function() {
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

  it('should toggle a choice on "space" keypress event', function(cb) {
    var events = [];

    prompt.choices = ['foo', 'bar', 'baz'];
    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function(answer) {
      assert.equal(answer.length, 1);
      assert.equal(answer[0], 'foo');
      assert.equal(events.length, 2);
      assert.equal(events[0], 'space');
      assert.equal(events[1], 'enter');
      cb();
    });

    prompt.rl.input.emit('keypress', ' ');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should dispatch an action for a "down" event', function(cb) {
    var events = [];

    prompt = new Prompt({name: 'down', choices: ['foo', 'bar', 'baz']});
    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function(answer) {
      assert.equal(events.length, 4);
      assert.deepEqual(events, ['space', 'down', 'space', 'enter']);
      assert.deepEqual(answer, ['foo', 'bar']);
      cb();
    });

    prompt.rl.input.emit('keypress', ' ');
    prompt.rl.input.emit('keypress', 'n', {name: 'down', ctrl: true});
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

  it('should check all choices on "a" keypress events', function(cb) {
    prompt.choices = ['foo', 'bar', 'baz'];
    prompt.ask(function(answer) {
      assert.deepEqual(answer, ['foo', 'bar', 'baz']);
      cb();
    });

    prompt.rl.input.emit('keypress', 'a');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should uncheck all choices after two "a" keypress events', function(cb) {
    prompt.choices = ['foo', 'bar', 'baz'];
    prompt.ask(function(answer) {
      assert.deepEqual(answer, []);
      cb();
    });

    prompt.rl.input.emit('keypress', 'a');
    prompt.rl.input.emit('keypress', 'a');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should check all choices when an item is already checked', function(cb) {
    prompt.choices = ['foo', 'bar', 'baz'];
    prompt.ask(function(answer) {
      assert.deepEqual(answer, ['foo', 'bar', 'baz']);
      cb();
    });

    prompt.rl.input.emit('keypress', ' ');
    prompt.rl.input.emit('keypress', 'a');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should check all choices when items are already checked', function(cb) {
    prompt.choices = ['foo', 'bar', 'baz'];

    prompt.ask(function(answer) {
      assert.deepEqual(answer, ['foo', 'bar', 'baz']);
      cb();
    });

    prompt.rl.input.emit('keypress', ' ');
    prompt.rl.input.emit('keypress', null, {name: 'down'});
    prompt.rl.input.emit('keypress', ' ');
    prompt.rl.input.emit('keypress', 'a');
    prompt.rl.input.emit('keypress', '\n');
  });

  it('should dispatch an action for "a" keypress event', function(cb) {
    var actions = [];
    var events = [];

    prompt.choices = ['a', 'b', 'c'];
    var action = prompt.action.bind(prompt);

    prompt.action = function(key) {
      actions.push(key);
      return action.apply(null, arguments);
    };

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function(answer) {
      assert.deepEqual(answer, ['a', 'b', 'c']);

      assert.equal(actions.length, 2);
      assert.equal(actions[0], 'a');
      assert.equal(actions[1], 'line');

      assert.equal(events.length, 2);
      assert.equal(events[0], 'a');
      assert.equal(events[1], 'enter');
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
    prompt = new Prompt({name: 'up', choices: ['foo', 'bar', 'baz']});
    var events = [];

    prompt.only('keypress', function(name) {
      events.push(name);
    });

    prompt.ask(function() {
      assert.equal(events.length, 7);
      assert.deepEqual(prompt.choices.checked, ['bar']);
      assert.deepEqual(events, ['down', 'down', 'down', 'up', 'up', 'space', 'enter']);
      cb();
    });

    prompt.rl.input.emit('keypress', 'n', {ctrl: true});
    prompt.rl.input.emit('keypress', 'n', {ctrl: true});
    prompt.rl.input.emit('keypress', 'n', {ctrl: true});

    prompt.rl.input.emit('keypress', 'p', {ctrl: true});
    prompt.rl.input.emit('keypress', 'p', {ctrl: true});
    prompt.rl.input.emit('keypress', ' ');
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

  it('should handle "down" keypress events', function(cb) {
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

  it('should handle "number" keypress events', function(cb) {
    var events = [];
    prompt.choices = ['foo', 'bar', 'baz'];
    assert.equal(prompt.position, 0);

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
