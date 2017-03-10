var Prompt = require('..');
var prompt = new Prompt({
  name: 'first',
  message: 'What is your name?',
  validate: function(str) {
    if (!/^[a-z]+$/i.test(str)) {
      return 'invalid value';
    }
    return true;
  }
});

prompt.ask(function(answers) {
  console.log(answers);

  prompt.run()
    .then(function(answers) {
      console.log(answers);
    });
});

