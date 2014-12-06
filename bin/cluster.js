#!/usr/bin/env node

function send (msg, fn) {
  console[fn || 'log'](JSON.stringify(msg) + ',');
}

send.message = function (message) {
  send({ 'workers.js': message });
}

send.error = function (error) {
  send({ error: {
    name: error.name,
    message: error.message
  } });
}

var script = process.argv[2];

if ( ! script ) {
  throw new Error('Missing script');
}

var forkNumber = require('os').cpus().length;

send.message({ script: script, forks: forkNumber });

var cluster = require('cluster');

cluster.setupMaster({
  exec: script,
  args: []
});

cluster
  
  .on('error', function (error) {
    send.error(error);
  })
  
  .on('fork', function () {
    send.message( { forked: script });
  })

  .on('exit', function (error, code) {
    send.message({ exit: script, code: code });
  })
  
  .on('listening', function () {
    send.message('listening');
  });

for ( var i = 0; i < forkNumber; i ++ ) { 
  cluster.fork()

    .on('error', function (error) {
      send.message('error');
    })

    .on('listening', function () {
      send.message('listening');
    })

    .on('message', function (msg) {
      send.message(msg);
    })

    .on('exit', function () {
      send.message('exit');
    });
}
