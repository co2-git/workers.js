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


























// var unique = process.argv[3];

// var stream = $('fs').createWriteStream($('path').join(process.cwd(), 'dude-js', 'log', unique),
//   { encoding: 'utf-8', flags: 'a+' });

// $('../lib/json-prune');

// function log (msg) {
//   stream.write(JSON.prune({
//     when: +new Date(),
//     user: process.getuid(),
//     host: $('os').hostname(),
//     process: process.pid,
//     message: msg
//   }) + ",\r\n");
// }

// var options = {};

// if ( process.argv[4] ) {
//   options = JSON.parse(process.argv[4]);
// }

// var forkNumber = options.forks || $('os').cpus().length;

// var reloadSignal = options.reloadSignal || 'SIGUSR2';

// var reloaded = 0;

// process.on('exit', function (signal) {
//   log({ event: 'exit', signal: signal });
// });

// process.on(reloadSignal, function () {
//   log({ event: 'reloading', signal: reloadSignal });

//   reloaded ++;

//   var reloaders = [];

//   Object.keys(cluster.workers).forEach(function (workerID) {
//     reloaders.push(function (callback) {
//       this.kill();
//       forkMe(callback);
//     }.bind(cluster.workers[workerID]));
//   });

//   $('async').series(reloaders, function (error) {
//     if ( error ) {
//       throw error;
//     }

//     log({ event: 'reloaded', reloaded: reloaded });
//   });
// });

// var cluster = $('cluster');

// cluster.setupMaster({
//   exec: script,
//   args: options.args || []
// });

// cluster
  
//   .on('error', function (error) {
//     log({ event: 'error', error: error });
//   })
  
//   .on('fork', function (fork) {
//     log({ event: 'fork', emitter: 'cluster', fork: getForkPrintableInfo (fork) });
//   })

//   .on('exit', function (fork, code, signal) {
//     log({ event: 'exit', emitter: 'cluster', fork: getForkPrintableInfo (fork), code: code, signal: signal });
//   })
  
//   .on('listening', function (fork) {
//     log({ event: 'listening', emitter: 'cluster', fork: getForkPrintableInfo (fork) });
//   });

// function forkMe (then) {
//   var fork = cluster.fork();

//   fork.on('listening', function () {
//     log({ event: 'fork', emitter: 'fork', fork: getForkPrintableInfo (fork) });

//     if ( typeof then === 'function' ) {
//       then();
//     }
//   });

//   fork.on('message', function (message) {
//     log(message);

//     switch ( message ) {
//       case 'how many reloads?':
//         this.send({ reloaded: reloaded });
//         break;
//     }
//   }.bind(fork));

//   fork.on('exit', function (code, signal) {
//     log({ event: 'exit', emitter: 'fork', code: code, signal: signal, fork: getForkPrintableInfo (fork) });
//   });
// }

// for ( var i = 0, fork; i < forkNumber; i ++ ) {
//   forkMe();
// }

// function getForkPrintableInfo (fork) {
//   return {
//     id: fork.id,
//     uniqueID: fork.uniqueID,
//     workerID: fork.workerID,
//     state: fork.state,
//     process: {
//       connected: fork.process.connected,
//       signalCode: fork.process.signalCode,
//       exitCode: fork.process.exitCode,
//       killed: fork.process.killed,
//       pid: fork.process.pid
//     }
//   };
// }