var Prompt = require('..');
var prompt = new Prompt({
  name: 'color',
  message: 'What is your favorite color?',
  validate: function(val) {
    return typeof val === 'string' && val.trim() !== '';
  }
});

prompt.ask(function(answer) {
  console.log(answer);
});


