var prompt = require('..')({
  name: 'color',
  message: 'What is your favorite color?',
});

// change message after instantiation
prompt.message = 'Like this custom message?';

prompt.ask(function(answer) {
  console.log(answer);
});


