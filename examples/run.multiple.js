var Prompt = require('..');
var foo = new Prompt({name: 'foo', message: 'What is foo?'});
var bar = new Prompt({name: 'bar', message: 'What is bar?'});
var baz = new Prompt({name: 'baz', message: 'What is baz?'});

foo.run()
  .then(function(answer) {
    console.log(answer);

    bar.run()
      .then(function(answers) {
        console.log(answers);

        baz.run()
          .then(function(answers) {
            console.log(answers);
            foo.close();
          });
      });
  })


