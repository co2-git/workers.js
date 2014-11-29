var $ = require;

/*  Reload a script by sending a signal to the cluster master */
/**
 *  @runner can be either a string (in which case it is either a log ID or a script name) 
 *  or boolean true (in which case it means reload all running services/scripts)
 *
 *  @options
 *  {
 *    "signal": String #optional a valid UNIX signal
 *  }
 */

module.exports = function (runner, options, callback) {

  if ( typeof callback === 'undefined' && typeof options === 'function' ) {
    callback = options;
  }

  if ( options.constructor !== Object ) {
    options = {};
  }

  var domain = $('domain').create();

  domain.on('error', function (error) {
    callback(error);
  });

  domain.run(function () {
    if ( typeof runner !== 'string' ) {
      throw new Error('Missing entity to stop');
    }


    var signal = options.signal || 'SIGUSR2';

    $('./running')(domain.intercept(function (running) {
      var service;

      running.forEach(function (item) {
        if ( item.log === runner || item.service === runner ) {
          service = item;
        }
      });

      if ( ! service ) {
        throw new Error('Could not stop! Entity not found: ' + runner);
      }

      if ( service.zombie ) {
        $('fs').unlink($('path').join(process.env.PWD, 'dude-js', 'services', runner + '.json'),
          domain.intercept(function () {
            callback(null, 'killed zombie');
          }));
      }

      else {
        process.kill(service.pid, signal);

        callback();
      }
    }));
  });
};