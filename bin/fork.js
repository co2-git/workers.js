#! /usr/bin/env node

var $ = require;

var fork = process.argv[2];

var unique = process.argv[3];

var options = process.argv[4];

var stream = $('fs').createWriteStream($('path').join(process.cwd(), 'dude-js', 'log', unique),
  { encoding: 'utf-8', flags: 'a+' });

var fork = $('child_process').fork(
  fork, [fork, options], {
    cwd: process.cwd(),
    env: process.env
  });

process.on('SIGUSR2', function () {
  process.kill(fork.pid, 'SIGUSR2');
});

fork.on('error', function (error) {
  stream.write($('util').inspect(error));
});

fork.on('exit', function (signal) {
  if ( typeof signal === 'number' && ! signal ) {
    return console.lof('ooo');
  }
  stream.write($('util').inspect(new Error('Fork script ' + script + ' ended with code/signal ' + signal)));
});

fork.on('message', function (message) {
  stream.write($('util').inspect(message));
});