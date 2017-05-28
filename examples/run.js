var answers = {};
var Prompt = require('..');
var prompt = new Prompt({
  name: 'color',
  message: 'What is your favorite color?'
});

prompt.run(answers)
  .then(function(answer) {
    console.log({color: answer}, answers);
  });
