# wait-for-realityserver

## Introduction

Wait for RealityServer to be available and then fire a callback. Inspired by existing [wait-for-host](https://github.com/Chris927/wait-for-host) module which was used as a starting point. This version is specific to the [migenius](http://www.migenius.com) RealityServer platform and only returns successfully when a valid version number is returned from the server.

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

Here is a simple example showing how to use the module. Note that the options and callbacks can be omitted (though without at least the main callback nothing would actually happen). All avaialble options are shown below, you can specify partial options if desired as well.

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
		console.log("RealtiyServer version " + resp.version + " now available.")
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
