var prompt = require('..')('What is your favorite color?')
  .ask(function(answer) {
    console.log(answer);
  });


