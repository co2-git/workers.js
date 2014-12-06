var id = process.pid.toString() + (+new Date()).toString() + (Math.ceil(Math.random()*7919)).toString(),
  log,
  spawn,
  startTime,
  config = require('../config.json')
  path = require('path');

module.exports = function (script, options, callback) {

  if ( typeof callback === 'undefined' && typeof options === 'function' ) {
    callback = options;
    options = {};
  }

  options = options || {};

  var domain = require('domain').create();

  domain.on('error', function (error) {
    callback(error, id);
  });

  domain.run(function () {
    var unref = setTimeout(function () {
      
      // Make sure we have the service name
      if ( typeof script !== 'string' ) {
        throw new Error('Missing script name');
      }

      // make sure script ends by js
      if ( ! /\.js$/.test(script) ) {
        script += '.js'
      }

      function createLog (cb) {
        log = require('fs').createWriteStream(path.join(config.log.dir,
          config.log.prefix + id), { flags: 'a' });
        log.write('{"init":true}', cb);
      }

      function execCluster (cb) {

        startTime = Date.now();

        // spawning the fork in the background
        spawn = require('child_process')
          .spawn(require('path').join(require('path').dirname(__dirname), 'bin', 'cluster.js'),
            [id, script],
            {
              cwd: process.cwd(),
              env: process.env,
              detached: true,
              stdio: 'ignore'
            });

        spawn.unref();

        spawn.on('error', function (error) {
          // stream.write(require('util').inspect(error));
          throw error;
        });

        spawn.on('exit', function (signal) {

          log.write(JSON.stringify({ signal: signal }));

          if ( typeof signal === 'number' && ! signal ) {
            throw new Error('Service stopped emitting a OK status. Is that normal?');
          }
          
          throw new Error('Got service error! Script ' + script + ' got signal/code ' + signal);
        });

        cb();
      }

      createLog(function () {
        execCluster(function () {
          console.log('  ✔ clustered ' + script + ' ' + id);
          console.log('    pid: ' + spawn.pid + ' started: ' +
            new Date(startTime).getHours() + ':' +
            new Date(startTime).getMinutes() + ':' +
            new Date(startTime).getSeconds());
          console.log('    workers: ' + require('os').cpus().length);

          callback(null, id);
        });
      });
    });

    unref.unref();
  });
};