var Prompt = require('..');
var answers = {};

var confirm = new Prompt({
  name: 'confirm',
  message: 'Do you want to run'
});

var foo = new Prompt({
  name: 'foo',
  message: 'What is foo?',
  when: function() {
    return true;
  }
});

var bar = new Prompt({
  name: 'bar',
  message: 'What is bar?',
  when: function(answers) {
    if (['foo', 'bar'].indexOf(answers.foo) !== -1) {
      confirm.question.message += ' bar';
      return confirm.run()
        .then(function(answer) {
          return answer === 'y';
        });
    }
    return false;
  }
});

var baz = new Prompt({
  name: 'baz',
  message: 'What is baz?',
  when: function(answers) {
    return ['foo', 'baz'].indexOf(answers.foo) !== -1;
  }
});

foo.run(answers)
  .then(function(answer) {
    answers[foo.question.name] = answer;
    console.log(answer);
    console.log(answers);

    return bar.run(answers)
      .then(function(answer) {
        answers[bar.question.name] = answer;
        console.log(answer);
        console.log(answers);

        return baz.run(answers)
          .then(function(answer) {
            answers[baz.question.name] = answer;
            console.log(answer);
            console.log(answers);

            baz.close();
          });
      });
  })
