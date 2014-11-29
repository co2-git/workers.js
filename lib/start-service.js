var $ = require;

var unique = process.pid.toString() + (+new Date()).toString() + (Math.ceil(Math.random()*7919)).toString();

module.exports = function (service, options, callback) {
  var domain = $('domain').create();

  domain.on('error', function (error) {
    // remove service.json from the running services directory
    $('fs').unlink($('path').join(process.cwd(), 'dude-js', 'services', unique + '.json'),
      function () {

      });

    callback(error, unique);
  });

  domain.run(function () {
    // Make sure we have the service name
    if ( typeof service !== 'string' ) {
      throw new Error('Missing service name');
    }

    // dude.json
    var json;

    try {
      // parse dude.json
      json = $($('path').join(process.cwd(), 'dude.json'));
    }
    catch ( error ) {
      // exit if dude.json is not readable
      throw new Error('No JSON file found. This means the service ' + service + ' is not installed -- hence it can not be started.');
    }

    // Make sure service is installed
    if ( ! json.dependencies || ! json.dependencies[service] ) {
      throw new Error(service + ' is not installed and therefore can not been started.');
    }

    // Get service installed version from json
    var version = json.dependencies[service];

    // The list of dependencies -- to get full info about the service
    var list = $('../list.json');

    // The service full info
    var Service;

    // Looping each dependency to find the matching service
    list.forEach(function (dep) {
      if ( dep.slug === service ) {
        Service = dep;
      }
    });

    // Exit if service not found in lits
    if ( ! Service ) {
      throw new Error('No such service: ' + service);
    }

    // The start instructions for the service version
    var startCandidate;

    // Looping each start instructions until finding a semantic version to matches ours
    Object.keys(Service.start).forEach(function (candidate) {
      if ( $('semver').satisfies(version, candidate) && ! startCandidate ) {
        startCandidate = candidate;
      }
    });

    // Exit if mo start instructions found
    if ( ! startCandidate ) {
      throw new Exception('No candidate found for starting the service');
    }

    // The arguments to pass to the start script
    var args = options;

    // Constructing service directory
    var base = $('path').join(process.cwd(), 'dude-js', 'dependencies', service);

    if ( Service.install[startCandidate].filename ) {
      base = $('path').join(base, $('./parse')(Service.install[startCandidate].filename,
        { version: version }));
    }
    else {
      base = $('path').join(base, $('./parse')($('path').basename(Service.install[startCandidate].source),
        { version: version }));
    }

    if ( Service.install[startCandidate].extension ) {
      base = base.replace(new RegExp('.' + Service.install[startCandidate].extension + "$"), '');
    }

    // The script to call to start the service
    var startScript = $('path').join(base, Service.start[startCandidate].script);

    // The log file for the script output and stderr
    var stream = $('fs').createWriteStream($('path').join(process.cwd(), 'dude-js', 'log', unique),
      { encoding: 'utf-8' });

    console.log(('  Now spawning ' + startScript.bold).grey);

    // Spawning in the background the start script
    var spawn = $('child_process').spawn(startScript, args, {
      env: process.env,
      detached: true
    });

    spawn.unref();

    // Catch start script error
    spawn.on('error', domain.intercept(function () {}));

    // Catch start script exit
    spawn.on('exit', function (signal) {
      if ( typeof signal === 'number' && ! signal ) {
        callback();
      }
      throw new Error('Got service error! Service ' + service + ' got signal/code ' + signal);
    });

    // Info about the service started
    var identity = {
      service: service,
      version: version,
      arguments: options,
      log: unique,
      pid: spawn.pid,
      started: +new Date()
    };

    // Write info to the log as the header
    stream.write("-- dude.js log (started " + new Date() + ") --\r\n\r\n\r\n" +
      JSON.stringify(identity, null, 2) + "\r\n\r\n\r\n-- service begins now --\r\n\r\n\r\n");

    // Write start script output to log
    spawn.stdout.pipe(stream);

    // Write start script error messages to log
    spawn.stderr.pipe(stream);

    // Create the service.json file to tell dude.js this service is running
    $('fs').writeFile($('path').join(process.cwd(), 'dude-js', 'services', unique + '.json'),
      JSON.stringify(identity, null, 2),
      { encoding: 'utf-8' },
      domain.intercept(function () {
        callback(null, { pid: spawn.pid, id: unique });
      }));
  });
};