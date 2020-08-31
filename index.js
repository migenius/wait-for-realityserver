var request = require('request').defaults({jar: true, strictSSL :false});
var EventEmitter = require('events');

module.exports = function(host, port, options, successCallback, progressCallback) {

	// Allow for missing options
	if (options === undefined || typeof options === 'function') {
		progressCallback = successCallback;
		successCallback = options;
		options = {};
	}

	if (progressCallback === undefined) {
		// only 1 function passed in.
		// in this case we use it as a progressCallback and return a promise
		progressCallback = successCallback;
		successCallback = undefined;
	}

	// Sensible defaults
	var numRetries = options.numRetries || 10;
	var retriesRemaining = numRetries;
	var retryInterval = options.retryInterval || 1000;
	var requestTimeout = options.requestTimeout || 2500;
	var monitorFrequency = parseInt(options.monitorFrequency,10) || 0;
	var schema = options.secure ? 'https': 'http';

	// Validate the supplied options
	if (!(retriesRemaining > 0)) throw new Error('Invalid value for option "numRetries"');
	if (!(retryInterval > 0)) throw new Error('Invalid value for option "retryInterval"');
	if (!(requestTimeout > 0)) throw new Error('Invalid value for option "requestTimeout"');

	// RealityServer JSON-RPC 2.0 request to obtain version number
	var command = {
		jsonrpc: 2.0,
		method: 'get_version',
		params: {},
		id: 1
	};

	function setupResult(body) {
		if (monitorFrequency <= 0) {
			return { version: body.result }
		}
		var emitter = new EventEmitter()

		var connectable = true;
		function checkRealityServer() {
			// we just want to check connectability
			request({
				method: 'GET',
				uri: schema + '://' + host + ':' + port + '/',
				timeout: requestTimeout
			}, function(error, response, body) {
				if (error) {
					if (connectable) {
						emitter.emit('disconnected')
						connectable = false;
					}
				} else if (!connectable) {
					emitter.emit('connected');
					connectable = true;
				}
			});
		}
		var timer = setInterval(checkRealityServer,monitorFrequency);

		emitter.version = body.result;
		emitter.stop = function() {
			clearInterval(timer);
			timer = undefined;
		}
		return emitter;
	}

	// Attempt to get the RealityServer version and retry on failure
	function tryToConnect() {
		request({ // Attempt to make UAC session first
			method: 'GET',
			uri: schema + '://' + host + ':' + port + '/uac/create/',
			timeout: requestTimeout					
		}, function(error, response, body) {
			if (error) {
				typeof progressCallback === 'function' && progressCallback({numRetries: numRetries, retriesRemaining: retriesRemaining, retryInterval: retryInterval});
				if (--retriesRemaining <= 0)
					return successCallback(new Error('Retry limit reached, RealityServer not available'));
				setTimeout(tryToConnect, retryInterval);
				return;				
			}
			if (retriesRemaining > 0) {
				request({
					method: 'POST',
					uri: schema + '://' + host + ':' + port + '/',
					json: command,
					timeout: requestTimeout					
				}, function(error, response, versionBody) {
					if (error || typeof versionBody.result !== 'string') {
						typeof progressCallback === 'function' && progressCallback({numRetries: numRetries, retriesRemaining: retriesRemaining, retryInterval: retryInterval});
						if (--retriesRemaining <= 0)
							return successCallback(new Error('Retry limit reached, RealityServer not available'));
						setTimeout(tryToConnect, retryInterval);
						return;				
					}
					if (retriesRemaining > 0) {
						request({
							method: 'GET',
							uri: schema + '://' + host + ':' + port + '/uac/destroy/',
							timeout: requestTimeout					
						}, function(error, response, body) {
							if (error) {
								typeof progressCallback === 'function' && progressCallback({numRetries: numRetries, retriesRemaining: retriesRemaining, retryInterval: retryInterval});
								if (--retriesRemaining <= 0)
									return successCallback(new Error('Retry limit reached, RealityServer not available'));
								setTimeout(tryToConnect, retryInterval);
								return;				
							}
							if (retriesRemaining > 0) {
								successCallback(null, setupResult(versionBody));
							}
						});
					}
				});
			}
		});
	}

	// Kick off the process
	if (successCallback === undefined) {
		if (typeof Promise !== 'function') {
			throw 'No successCallback provided but Promises are not supported';
		}
		return new Promise(function(resolve,reject) {
			successCallback = function(err,result) {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			}
			tryToConnect();
		});
	} else {
		tryToConnect();
	}
};
