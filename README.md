# wait-for-realityserver

## Introduction

Wait for RealityServer to be available and then fire a callback. Inspired by existing [wait-for-host](https://github.com/Chris927/wait-for-host) module which was used as a starting point. This version is specific to the [migenius](http://www.migenius.com) RealityServer platform and only returns successfully when a valid version number is returned from the server.

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
