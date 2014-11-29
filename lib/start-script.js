var unique = process.pid.toString() + (+new Date()).toString() + (Math.ceil(Math.random()*7919)).toString();

module.exports = function (script, options, callback) {

  if ( typeof callback === 'undefined' && typeof options === 'function' ) {
    callback = options;
    options = {};
  }

  options = options || {};

  var domain = require('domain').create();

  domain.on('error', function (error) {
    // remove service.json from the running services directory
    require('fs').unlink(require('path').join(process.env.HOME, '.config/dude/running', unique + '.json'),
      function () {

      });

    callback(error, unique);
  });

  domain.run(function () {
    var unref = setTimeout(function () {
      // Make sure we have the service name
      if ( typeof script !== 'string' ) {
        throw new Error('Missing script name');
      }

      // make sure script is a JS script
      if ( ! /\.js$/.test(script) ) {
        throw new Error('Script must end by .js');
      }
      
      // stream to ouput message
      // var stream = require('fs').createWriteStream(require('path').join(process.env.HOME, 'dude-js', 'log', unique),
      //   { encoding: 'utf-8' });

      // spawning the fork in the background
      var spawn = require('child_process')
        .spawn(require('path').join(require('path').dirname(__dirname), 'bin', 'cluster.js'),
          [script],
          {
            cwd: process.cwd(),
            env: process.env,
            detached: true,
            stdio: 'ignore'
          });

      spawn.unref();

      spawn.on('error', function (error) {
        // stream.write(require('util').inspect(error));
        console.log('spawn error', error, error.stack.split(/\n/));
        throw error;
      });

      spawn.on('exit', function (signal) {
        if ( typeof signal === 'number' && ! signal ) {
          return callback();
        }
        throw new Error('Got service error! Script ' + script + ' got signal/code ' + signal);
      });

      console.log('piiiiiiiiiiiiiiiiiiiiid', spawn.pid)

      // spawn.stdout.on('data', function (data) {
      //   if ( data ) {

      //     return console.log('<<<<', data.toString(), '>>>>');

      //     var msg = JSON.parse(data.toString());

      //     if ( 'pid' in msg ) {
      //       // Info about the service started
      //       var identity = {
      //         script: script,
      //         arguments: options,
      //         id: unique,
      //         pid: spawn.pid,
      //         started: +new Date()
      //       };

      //       // Write info to the log as the header
      //       // stream.write("-- dude.js log (started " + new Date() + ") --\r\n\r\n\r\n" +
      //       //   JSON.stringify(identity, null, 2) + "\r\n\r\n\r\n-- service begins now --\r\n\r\n\r\n");

      //       // Create the service.json file to tell dude.js this service is running
      //       require('fs').writeFile(require('path').join(process.env.HOME, '.config/dude/running', unique + '.json'),
      //         JSON.stringify(identity, null, 2),
      //         { encoding: 'utf-8' },
      //         domain.intercept(function () {
      //           callback(null, { pid: spawn.pid, id: unique });
      //         }));
      //     }

      //     if ( 'message' in msg ) {
      //       console.log(msg);
      //     }
      //   }
      // })
    });

    unref.unref();
  });
};