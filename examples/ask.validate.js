var Prompt = require('..');
var prompt = new Prompt({
  name: 'foo',
  message: 'What is foo?',
  when: function() {
    return true;
  },
  validate: function(input, key) {
    if (key.name !== 'line') {
      return true;
    }

    switch (input) {
      case 'foo':
        prompt.rl.output.emit('keypress', 'bar');
        return 'wrong answer!';
      case 'bar':
        prompt.rl.output.emit('keypress', 'baz');
        return false;
      case 'baz':
        return 'try entering "qux"';
      case 'qux':
        return true;
      default: {
        return false;
      }
    }
  }
});

prompt.run()
  .then(function(answer) {
    console.log(answer);
  })
