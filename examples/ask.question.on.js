var Prompt = require('..');
var prompt = new Prompt({
  name: 'color',
  message: 'What is your favorite color?',
  on: {
    keypress: function() {
      return this.onKeypress.apply(this, arguments);
    }
  }
});

prompt.ask(function(answer) {
  console.log(answer);
});


