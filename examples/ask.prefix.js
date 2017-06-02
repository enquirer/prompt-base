var magenta = require('ansi-magenta');
var prompt = require('..')({
  name: 'color',
  message: 'What is your favorite color?',
  default: 'red'
});

prompt.prefix = magenta('❤ ');

prompt.ask(function(answer) {
  console.log(answer);
});


