workers.js
==========

!! alpha !!

Starts a script in cluster mode. Useful for reloading HTTP servers with zero-second downtime. 

# Install

    npm install -g co2-git/workers.js

## Usage

Story: you have a file, `server.js`, and you want to call it in cluster mode.

```js
// server.js
require('http')
	.createServer(function () {

  })
	.listen(3000);
```

```bash
# From terminal
workersjs server.js
  ✔ clustered server.js
    pid: 1000 started: 20:04:30
    workers: 4
```
