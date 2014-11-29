var $ = require;

[
  'program',
  'init',
  'install',
  'start',
  'stop',
  'reload',
  'build',
  'config'
].forEach(function (lib) {
  exports[lib] = $('../lib/' + lib);
});