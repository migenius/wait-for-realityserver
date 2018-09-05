var request = require('request').defaults({jar: true});

module.exports = function(host, port, options, successCallback, progressCallback) {

	// Allow for missing options
	if (typeof options == "function") {
		progressCallback = successCallback;
		successCallback = options;
		options = {};
	}

	if (typeof successCallback !== 'function') {
		throw 'successCallback is not a function';
	}
	
	// Sensible defaults
	var numRetries = options.numRetries || 10;
	var retriesRemaining = numRetries;
	var retryInterval = options.retryInterval || 1000;
	var requestTimeout = options.requestTimeout || 2500;

	// Validate the supplied options
	if (!(retriesRemaining > 0)) throw new Error('Invalid value for option "numRetries"');
	if (!(retryInterval > 0)) throw new Error('Invalid value for option "retryInterval"');
	if (!(requestTimeout > 0)) throw new Error('Invalid value for option "requestTimeout"');

	// RealityServer JSON-RPC 2.0 request to obtain version number
	var command = {
		jsonrpc: 2.0,
		method: "get_version",
		params: {},
		id: 1
	};

	// Attempt to get the RealityServer version and retry on failure
	function tryToConnect() {
		request({ // Attempt to make UAC session first
			method: 'GET',
			uri: 'http://' + host + ":" + port + "/uac/create/",
			timeout: requestTimeout					
		}, function(error, response, body) {
			if (error) {
				typeof progressCallback === 'function' && progressCallback({numRetries: numRetries, retriesRemaining: retriesRemaining, retryInterval: retryInterval});
				if (--retriesRemaining < 0)
					return successCallback(new Error('Retry limit reached, RealityServer not available'));
				setTimeout(tryToConnect, retryInterval);
				return;				
			}
			if (retriesRemaining > 0) {
				request({
					method: 'POST',
					uri: 'http://' + host + ":" + port + "/",
					json: command,
					timeout: requestTimeout					
				}, function(error, response, versionBody) {
					if (error || typeof versionBody.result !== 'string') {
						typeof progressCallback === 'function' && progressCallback({numRetries: numRetries, retriesRemaining: retriesRemaining, retryInterval: retryInterval});
						if (--retriesRemaining < 0)
							return successCallback(new Error('Retry limit reached, RealityServer not available'));
						setTimeout(tryToConnect, retryInterval);
						return;				
					}
					if (retriesRemaining > 0) {
						request({
							method: 'GET',
							uri: 'http://' + host + ":" + port + "/uac/destroy/",
							timeout: requestTimeout					
						}, function(error, response, body) {
							if (error) {
								typeof progressCallback === 'function' && progressCallback({numRetries: numRetries, retriesRemaining: retriesRemaining, retryInterval: retryInterval});
								if (--retriesRemaining < 0)
									return successCallback(new Error('Retry limit reached, RealityServer not available'));
								setTimeout(tryToConnect, retryInterval);
								return;				
							}
							if (retriesRemaining > 0) {
								successCallback(null, {version: versionBody.result});
							}
						});
					}
				});
			}
		});
	}

	// Kick off the process
	tryToConnect();
};
