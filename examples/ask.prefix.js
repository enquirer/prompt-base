var magenta = require('ansi-magenta');
var prompt = require('..')({
  name: 'color',
  message: 'What is your favorite color?',
  validate: function(val) {
    if (!val || !val.trim()) {
      return 'must be at least one character'
    }
    return true;
  }
});

prompt.prefix = magenta(' ❤ ');

prompt.ask(function(answer) {
  console.log(answer);
});


