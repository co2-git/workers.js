var $ = require;

$('colors');

module.exports = function () {
  var domain = $('domain').create();

  domain.on('error', function (error) {
    console.log('Monitor error'.red, error.stack.yellow);
  });

  domain.run(function () {
    function readLog (file, start) {
      if ( ! start ) {
        start = 0;
      }

      var stream = $('fs').createReadStream(file, { encoding: 'utf-8', start: start });

      stream.on('data', function (data) {
        console.log(data);
        start += data.length;
      });

      stream.on('end', function () {
        var watch = $('fs').watch(file, function (event, filename) {
          watch.close();
          readLog(file, start);
        });
      });
    }

    $('./running')(domain.intercept(function (runners) {
      if ( ! runners.length ) {
        return console.log('Nothing running - nothing to monitor'.yellow);
      }

      console.log('  %s service(s) running ', runners.length);
      console.log('  ======================');

      runners.forEach(function (item) {
        console.log('  ' + item.service.green.bold + '@'.grey + item.version.cyan,
          'pid:'.grey, item.pid.toString().cyan,
          'arguments:'.grey, JSON.stringify(item.arguments).cyan);

        console.log('    ' + 'log:'.grey, item.log.magenta,
          'started:'.grey, $('moment')(item.started).fromNow().magenta);

        if ( item.zombie ) {
          console.log('    ' + 'ZOMBIE ALERT'.red.bold, 'It seems this service died unexpectedly'.yellow);
        }
      });

      console.log('  ======================');

      runners.forEach(function (runner) {
        process.nextTick(function () {
          
          var file = $('path').join(process.cwd(), 'dude-js', 'log', this.log);
          
          return $('fs').stat(file, domain.intercept(function (stat) {
            var watch = $('fs').watch(file, function (event, filename) {
              watch.close();
              readLog(file, stat.size);
            });
          }));
            
          // readLog($('path').join(process.cwd(), 'dude-js', 'log', this.log));
        }.bind(runner));
      });

    }));
  });
};