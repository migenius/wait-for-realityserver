# wait-for-realityserver

## Introduction

Wait for RealityServer to be available and then fire a callback or resolve a Promise. Inspired by existing [wait-for-host](https://github.com/Chris927/wait-for-host) module which was used as a starting point. This version is specific to the [migenius](http://www.migenius.com) RealityServer platform and only returns or resolves successfully when a valid version number is returned from the server.

## Installation

If you are just using the module within your own Node.js scripts you can install the module locally to your project:

```
npm install wait-for-realityserver
```

If you also want to install the command line tool and have this available on your system you should install globally:

```
npm install wait-for-realityserver -g
```

See below for usage of both.

## Example Usage

Here is a simple example showing how to use the module. Note that the options and callbacks can be omitted. If no callbacks are provided then a Promise is returned. All basic options are shown below, you can specify partial options if desired as well.

#### Callback Example
```javascript
var waitForRealityserver = require('wait-for-realityserver');

waitForRealityserver(
	'127.0.0.1', // hostname
	8080, // port
	{ // options
		numRetries: 10,
		retryInterval: 1000,
		requestTimeout: 2500
	},
	function(err, resp) { // main callback to fire
		if (err) {
			console.error(err.message);
			return;
		}
		console.log("RealityServer version " + resp.version + " now available.")
	},
	function(progress) { // progress callback called with each retry
		console.info(
			"Used " + (progress.numRetries - progress.retriesRemaining) + 
			" of " + progress.numRetries + " retries, retrying in " + 
			progress.retryInterval + "ms"
		)
	}
);
```

If one or zero functions are provided after the hostname and port then a Promise is returned. If a single function is provided then this is used as the progress callback.
#### Promise Example
```javascript
var waitForRealityserver = require('wait-for-realityserver');

waitForRealityserver(
	'127.0.0.1', // hostname
	8080, // port
	{ // options
		numRetries: 10,
		retryInterval: 1000,
		requestTimeout: 2500
	},
	function(progress) { // progress callback called with each retry
		console.info(
			"Used " + (progress.numRetries - progress.retriesRemaining) + 
			" of " + progress.numRetries + " retries, retrying in " + 
			progress.retryInterval + "ms"
		)
	}
).then(function(result) {
	console.log("RealityServer version " + result.version + " now available.")
}).catch(err => {
	console.error(err.message);
});
```

#### Monitoring
The module also support monitoring the RealityServer instance. If the `monitorFrequency` option is provided, and is > 0, then the result is an `EventEmitter` that attempts to connect to RealityServer every `monitorFrequency` milliseconds. If the connection attempt fails a `disconnected` event is emitted. When the connection succeeds again a `connected` event is emitted. These events are emitted only once for each disconnect and connect occurance. The result additionally has a `stop` function which can be used to stop monitoring if required, EG: when exiting Node.js.

```javascript
var waitForRealityserver = require('wait-for-realityserver');

waitForRealityserver(
	'127.0.0.1', // hostname
	8080, // port
	{ // options
		monitorFrequency: 10000 // check for connection every 10 seconds
	}
).then(function(result) {
	console.log("RealityServer version " + result.version + " now available.")
	result.on('disconnected',() => {
		console.log('RS is no longer connectable');
		// tell application to stop trying to use RealityServer
	}).on('connected',() => {
		console.log('RS is connectable again');
		// tell application to start using RealityServer again
	});

	// we run for 30 seconds then stop monitoring and exit.
	setTimeout(() => {
		console.log('shutdown');
		result.stop();
	},30000);
}).catch(err => {
	console.error(err.message);
});
```

## Command Line Version

The module includes a simple command line program which you can use for integration with shell scripts and other tools. Its usage is as follows:

```
wait-for-realityserver [--help] -h host -p port [--retries numRetries]
[--interval retryInterval (ms)] [--timeout requestTimeout (ms)]

Options:
  -h          Hostname or IP address of the server to check for RealityServer
                                                                      [required]
  -p          Port number on which RealityServer is running on the specified
              host                                                    [required]
  --retries   Number of times to retry checking for RealityServer before giving
              up                                                   [default: 10]
  --interval  How long to wait between retry attempts            [default: 1000]
  --timeout   Timeout for the underlying requests                [default: 2500]
  --help      Show help                                                [boolean]

Examples:
  wait-for-realityserver -h 127.0.0.1
  -p 8080 --retries 15 --interval 2500
  --timeout 1000
```

For example, to wait for RealityServer on your local host with up to 20 retry attempts you could do the following:

```
wait-for-realityserver -h 127.0.0.1 -p 8080 --retries 20
```
