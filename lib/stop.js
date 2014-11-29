var $ = require;

/*  Stop a service or a script by killing its PID */
/**
 *  @runner can be either a string (in which case it is either a log ID or a service/script name) 
 *  or boolean true (in which case it means stop all running services/scripts)
 *
 *  @options
 *  {
 *    "signal": String #optional a valid UNIX signal
 *  }
 */
module.exports = function (
  /* String | Boolean(true) */ runner, /* object */ options, /* function */ callback) {

  // options is optional, so callback could be the 2nd argument
  if ( typeof callback === 'undefined' && typeof options === 'function' ) {
    callback = options;
  }

  // if options was not an object, make it an object
  if ( options.constructor !== Object ) {
    options = {};
  }

  // creating domain
  var domain = $('domain').create();

  // catch domain errors and redirect them to callback
  domain.on('error', function (error) {
    callback(error);
  });

  // run code in domain
  domain.run(function () {
    // Runner can not be undefined
    if ( typeof runner === 'undefined' ) {
      throw new Error('Missing entity to stop');
    }

    // By default, signal to kill a PID is SIGTERM unless specified otherwise in @options
    var signal = options.signal || 'SIGTERM';

    // The function to stop a single runner
    function stop (runner, cb) {
      // move service file to archive
      $('fs').rename($('path').join(process.cwd(), 'dude-js', 'services', runner.log + '.json'),
        $('path').join(process.cwd(), 'dude-js', 'archive', runner.log + '.json'),
        domain.intercept(function () {

          // move log file to archive

          $('fs').rename($('path').join(process.cwd(), 'dude-js', 'log', runner.log),
            $('path').join(process.cwd(), 'dude-js', 'archive', runner.log),
            domain.intercept(function () {

              // move log file to archive

              
              
              // If NOT a zombie
              if ( ! runner.zombie ) {
                // kill PID
                process.kill(runner.pid, signal);
              }

              cb();

            }));

        }));
    }

    // Get all running services
    $('./running')(domain.intercept(function (running) {
      // If runner is true, than stop ALL runners
      if ( runner === true ) {
        // The functions to execute in parallel
        var p = [];

        // Fill our parallel functions with each runner
        running.forEach(function (runner) {
          p.push(function (cb) {
            // call stop function
            stop(this, function () {
              cb(null, this);
            }.bind(this));
          }.bind(runner));
        });

        // Execute parallels -- meaning kill each runner parallely
        $('async').parallel(p, domain.intercept(function () {
          callback(null, running);
        }));
      }

      // Else if runner is a string, it is either a service/script name or a log id
      else if ( typeof runner === 'string' ) {

        // Which service/script to kill
        var service;

        // Finding service/script to kill in runners lits
        running.forEach(function (item) {
          // runner can be a log identifier or a service/script identifier
          if ( item.log === runner || item.service === runner ) {
            service = item;
          }
        });

        // If runner not found in list, issue error
        if ( ! service ) {
          throw new Error('Could not stop! Entity not found: ' + runner);
        }

        // Stopping matching runner
        stop(service, function () {
          callback(null, [service]);
        });
      }
    }));
  });
};