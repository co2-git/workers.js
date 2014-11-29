var $ = require;

module.exports = function (callback) {
  var domain = $('domain').create();

  domain.on('error', function (error) {
    callback(error);
  });

  domain.run(function () {
    $('fs').readdir($('path').join(process.cwd(), 'dude-js', 'services'),
      domain.intercept(function (files) {
        if ( ! files.length ) {
          return callback(null, []);
        }

        var running = [];
        
        files.forEach(function (file) {
          var service = $($('path').join(process.cwd(), 'dude-js', 'services', file));

          try {
            process.kill(service.pid, 0);
          }
          catch ( error ) {
            service.zombie = true;
          }

          running.push(service);
        });

        callback(null, running);
      }));
  });
};