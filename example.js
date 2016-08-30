var Prompt = require('./');
var prompt = new Prompt({
  name: 'color',
  message: 'What is your favorite color?'
});

prompt.ask(function(answer) {
  console.log(answer);
});

// prompt.run()
//   .then(function(answers) {
//     console.log(answers);
//   });
