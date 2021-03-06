var Prompt = require('..');
var answers = {};

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
    return new Promise(function(resolve) {
      resolve(['foo', 'bar'].indexOf(answers.foo) !== -1);
    });
  },
  transform: function(answer) {
    return Promise.resolve(answer && answer.toUpperCase());
  }
});

var baz = new Prompt({
  name: 'baz',
  message: 'What is baz?',
  when: function(answers) {
    return ['foo', 'baz'].indexOf(answers.foo) !== -1;
  },
  transform: function(answer) {
    return answer && answer.toUpperCase();
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
          });
      });
  })

