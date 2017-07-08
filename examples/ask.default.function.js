var prompt = require('..')({
  name: 'color',
  message: 'What is your favorite color?',
  default: function() {
    return 'red';
  }
});

prompt.ask(function(answer) {
  console.log(answer);
});
