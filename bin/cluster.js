#!/usr/bin/env node

var config = require('../config.json');

var id = process.argv[2];

var script = process.argv[3];

var path = require('path');

if ( ! script ) {
  throw new Error('Missing script');
}

var log = require('fs').createWriteStream(path.join(config.log.dir,
  config.log.prefix + id), {
  flags: 'a'
});

var forkNumber = require('os').cpus().length;

function send (msg, fn) {
  log.write(JSON.stringify(msg));
}

send.message = function (message) {
  send(message);
}

send.error = function (error) {
  send({ error: {
    name: error.name,
    message: error.message,
    stack: error.stack.split(/\n/)
  } });
}


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
