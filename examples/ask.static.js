var prompt = require('..')
  .ask('What is your favorite color?', function(answer) {
    console.log({color: answer});
  });


