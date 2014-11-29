function printJSONtoconsole (json) {


  var string = '';

  if ( typeof json === 'undefined' ) {

  }

  else if ( json === null ) {
    string += 'null'.magenta;
  }

  else if ( Array.isArray (json) ) {
    string = '[ '.grey;

    json.forEach(function (json, index, all) {
      string += printJSONtoconsole(json);

      if ( index !== all.length - 1 ) {
        string += ', '.grey;
      }
    });

    string += ' ]'.grey;
  }

  else if ( typeof json === 'object' ) {
    string = '{ '.grey;

    var members = [], member;

    for ( var i in json ) {
      member = ('"'.grey + i.bold + '"'.grey + ': ');
      member += printJSONtoconsole(json[i]);

      members.push(member);
    }

    string += members.join(', '.grey) + ' }'.grey;
  }

  else if ( typeof json === 'string' ) {
    string += '"'.green + json.green + '"'.green;
  }

  else if ( typeof json === 'number' ) {
    string += json.toString().blue;
  }

  else if ( typeof json === 'boolean' ) {
    string += json.toString().yellow;
  }

  return string;
}

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
    // require('fs').unlink(require('path').join(process.env.HOME, '.config/dude/running', unique + '.json'),
    //   function () {

    //   });

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

      if ( spawn.stdout ) {
        spawn.stdout.on('data', function (data) {
          var formatted = '[' + data.toString().trim().replace(/,$/, '') + ']';

          var parsed;

          var d = new Date();
          var t = d.getHours().toString() + ':'  + d.getMinutes().toString() + ' ' +
            (d.getMonth() + 1).toString() + '/' + d.getDate().toString();

          try {
            parsed = JSON.parse(formatted);
          
            console.log(t.grey, printJSONtoconsole(parsed));
          }
          catch ( error ) {
            return console.log(t.grey, data.toString().grey);
          }
        });
      }

      if ( spawn.stderr ) {
        spawn.stderr.on('data', function (data) {

          var formatted = '[' + data.toString().trim().replace(/,$/, '') + ']';

          var parsed;

          var d = new Date();
          var t = d.getHours().toString() + ':'  + d.getMinutes().toString() + ' ' +
            (d.getMonth() + 1).toString() + '/' + d.getDate().toString();

          try {
            parsed = JSON.parse(formatted);
          
            console.log(t.yellow, printJSONtoconsole(parsed));
          }
          catch ( error ) {
            return console.log(t.yellow, data.toString().red);
          }
        });
      }
    });

    unref.unref();
  });
};