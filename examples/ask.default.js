var prompt = require('..')({
  name: 'color',
  default: 'blue',
  message: 'What is your favorite color?'
});

prompt.ask(function(answer) {
  console.log(answer);
});


