#!/usr/bin/env node

require('colors');

var domain = require('domain').create();

var format = require('util').format;

var config = require('../config.json');

var path = require('path');

domain.on('error', function (error) {
  try {
    console.log('error'.red, error.stack.yellow);
  }
  catch ( err ) {
    console.log(error);
  }
  process.exit(8);
});

domain.run(function () {
  var package = require('../package.json');

  var bytes = 0;

  function outputLog (id, cb) {
    var read = [];

    require('fs').createReadStream(path.join(config.log.dir,
      config.log.prefix + id), {
      start: bytes
    })

      .on('data', function (data) {
        read.push(data.toString());
        bytes += data.length;

        console.log(' ➜ ' + data.toString().grey);
      })

      .on('end', function () {
        if ( typeof cb == 'function' ) {
          cb(null, read, bytes);
        }
      });
  }

  console.log(format(' %s v%s', package.name.bold, package.version.italic));

  if ( ! process.argv[2] ) {
    console.log(' * Usage: workersjs  <script>');
    console.log('   <script>  The file to cluster (ie, server.js)');
    return;
  }

  var script = process.argv[2];

  if ( ! script ) {
    throw new Error('Missing script');
  }

  require('../lib/cluster')(script, {}, function (error, id) {
    if ( error ) {
      console.log((('× ' + error.name).bold + ' ' + error.message).red);
      error.stack.split(/\n/).forEach(function (stack, index) {
        if ( index ) {
          console.log(stack.yellow);
        }
      });
      return;
    }

    outputLog(id, function () {
      require('fs').watch(path.join(config.log.dir,
        config.log.prefix + id), function () {
        // console.log(arguments)
        outputLog(id);
      });
    });    
  });
});
