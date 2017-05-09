var Prompt = require('..');
var foo = new Prompt({ name: 'foo', message: 'What is foo?' });
var bar = new Prompt({ name: 'bar', message: 'What is bar?' });
var baz = new Prompt({ name: 'baz', message: 'What is baz?' });

foo.ask(function(answer) {
  console.log(answer);
  bar.ask(function(answer) {
    console.log(answer);
    baz.ask(function(answer) {
      console.log(answer);
    });
  });
});
