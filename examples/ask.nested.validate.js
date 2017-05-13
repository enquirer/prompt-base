var Prompt = require('..');
var prompt = new Prompt({
  name: 'first',
  message: 'What is your name?',
  validate: function(str) {
    if (!str || !/^[a-z]+$/i.test(str)) {
      // return 'a-z only!';
      return false;
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

