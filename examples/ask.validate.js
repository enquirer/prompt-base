var Prompt = require('..');
var prompt = new Prompt({
  name: 'foo',
  message: 'What is foo?',
  validate: function(input, key) {
    if (key.name !== 'line') {
      return true;
    }
    switch (input) {
      case 'foo':
        return 'wrong answer! try "bar"';
      case 'bar':
        return 'wrong answer! try "baz"';
      case 'baz':
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
