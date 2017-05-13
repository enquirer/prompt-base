var obj = {};
var Prompt = require('..');
var foo = new Prompt({name: 'foo', message: 'What is foo?'});
var bar = new Prompt({name: 'bar', message: 'What is bar?'});
var baz = new Prompt({name: 'baz', message: 'What is baz?'});

foo.run(obj)
  .then(function(answer) {
    console.log(answer);
    // console.log(obj);

    bar.run(obj)
      .then(function(answer) {
        console.log(answer);
        // console.log(obj);

        baz.run(obj)
          .then(function(answer) {
            console.log(answer);
            // console.log(obj);
          });
      });
  })


