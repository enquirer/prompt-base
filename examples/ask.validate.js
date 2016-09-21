var Prompt = require('..');
var prompt = new Prompt({
  name: 'first',
  message: 'What is your name?',
  validate: function(str) {
    return !/^[a-z]+$/i.test(str) ? 'invalid value' : true;
  }
});

prompt.ask(function(answers) {
  console.log(answers);
});
