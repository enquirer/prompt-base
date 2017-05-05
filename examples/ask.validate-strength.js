var repeat = require('repeat-string');
var Prompt = require('..');
var prompt = new Prompt({
  name: 'first',
  message: 'What is your name?',
  mask: function(str) {
    return mask(str);
  },
  validate: function(str) {
    if (!str) return 'must be a string!';
    var count = 0;
    if (/[A-Z]/.test(str)) count++;
    if (/[a-z]/.test(str)) count++;
    if (/[0-9]/.test(str)) count++;
    if (/[!@#$%&^*{}()[\]]/.test(str)) count++;
    switch (count) {
      case 0: return 'terrible password!';
      case 1: return 'weak password!';
      case 2: return 'mediocre password!';
      case 3: return 'ok password!';
      case 4: {
        return true;
      }
    }
    return true;
  }
});

prompt.ask(function(answer) {
  console.log('great password!', answer);
  console.log('great password!', mask(answer));
});

function mask(str) {
  return repeat('*', str.length);
}
