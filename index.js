var request = require('request');

module.exports = function(host, port, options, successCallback, progressCallback) {

	// Allow for missing options
	if (typeof options == "function") {
		progressCallback = successCallback;
		successCallback = options;
		options = {};
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
	var body = {
		jsonrpc: 2.0,
		method: "get_version",
		params: {},
		id: 1
	};

	// Attempt to get the RealityServer version and retry on failure
	function tryToConnect() {
		request({
			method: 'POST',
			uri: 'http://' + host + ":" + port + "/",
			json: body,
			timeout: requestTimeout
		}, function(error, response, body) {
			if(error || typeof body.result !== 'string') {
				typeof progressCallback === 'function' && progressCallback({numRetries: numRetries, retriesRemaining: retriesRemaining, retryInterval: retryInterval});
				if (--retriesRemaining < 0) return successCallback(new Error('Retry limit reached, RealityServer not available'));
				setTimeout(tryToConnect, retryInterval);
				return;				
			}
			if (retriesRemaining > 0) successCallback(null, {version: body.result});
		});
	}

	// Kick off the process
	tryToConnect();

};
