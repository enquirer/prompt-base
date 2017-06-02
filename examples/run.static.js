var prompt = require('..')
  .run('What is your favorite color?')
  .then(function(answer) {
    console.log({color: answer});
  })
