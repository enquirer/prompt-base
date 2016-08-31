var Prompt = require('..');
var prompt = new Prompt({
  name: 'color',
  message: 'What is your favorite color?'
});

prompt.run()
  .then(function(answers) {
    console.log(answers);

    prompt.run()
      .then(function(answers) {
        console.log(answers);

        prompt.run()
          .then(function(answers) {
            console.log(answers);
          });
      });
  });



