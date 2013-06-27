//  buffer-src.js
//  (c) 2013 Sunil Sadasivan
//  Check if third party cookies are disabled
//

;(function () {

	var buildSrc = function(config, data) {
		var src = config.overlay.endpoint;
		if( data.local ) src = config.overlay.localendpoint;

		// Add button attributes
		var first = true, count = 0;
		for(var i=0, l=config.attributes.length; i < l; i++) {
			var a = config.attributes[i];
			if( ! data[a.name] ) continue;
			if( first ) { src += '?'; first = false; }
			count += 1;
			if( count > 1 ) src += '&';
			src += a.name + '=' + a.encode(data[a.name]);
		}

		return src;
	};

	var transformData = function(data) {
		if( data.embed ) {
			if( typeof data.embed === "object" ) {
				for( var i in data.embed ) {
					if( data.embed.hasOwnProperty(i) ) {
						data[i] = data.embed[i];
					}
				}
				if( data.embed.text && !data.embed.url ) {
					data.url = null;
				}
				data.embed = null;
			} else {
				data.text = data.embed;
				data.url = null;
				data.embed = null;
			}
		}
		return data; 
	};

	var getConfig = function(data) {
		var config = {};
		config.local = false;
		config.googleReader = false;
		var segments = window.location.pathname.split('/');
		if( window.location.host.indexOf("google") != -1 && segments[1] == "reader" ) config.googleReader = true;

		// Specification for gathering data for the overlay
		config.attributes = [
		{
			name: "url",
				get: function (cb) {
					if( ! config.googleReader ) {
						cb(window.location.href);
					} else {
						var href = $("#current-entry .entry-container a.entry-title-link").attr('href');
						if( ! href ) href = $('.entry').first().find(".entry-container a.entry-title-link").attr('href');
						cb(href);
					}
				},
				encode: function (val) {
							return encodeURIComponent(val);
						}
		},
		{
			name: "text",
			get: function (cb) {
				if( config.googleReader ) {
					var text = $("#current-entry .entry-container a.entry-title-link").text();
					if( ! text ) text = $('.entry').first().find(".entry-container a.entry-title-link").text();
					cb(text);
				} else if(document.getSelection() != false) {
					cb('"' + document.getSelection().toString() + '"');
				} else {
					cb(document.title);
				}
			},
			encode: function (val) {
						return encodeURIComponent(val);
					}
		},
		{
			name: "retweeted_tweet_id",
			get: function (cb) {
				cb(data.retweeted_tweet_id);
			},
			encode: function (val) {
						return encodeURIComponent(val);
					}
		},
		{
			name: "retweeted_user_id",
			get: function (cb) {
				cb(data.retweeted_user_id);
			},
			encode: function (val) {
						return encodeURIComponent(val);
					}
		},
		{
			name: "retweeted_user_name",
			get: function (cb) {
				cb(data.retweeted_user_name);
			},
			encode: function (val) {
						return encodeURIComponent(val);
					}
		},
		{
			name: "retweeted_user_display_name",
			get: function (cb) {
				cb(data.retweeted_user_display_name);
			},
			encode: function (val) {
						return encodeURIComponent(val);
					}
		},
		{
			name: "picture",
			get: function (cb) {
				cb(data.image);
			},
			encode: function (val) {
						return encodeURIComponent(val);
					}
		},
		{
			name: "embed",
			get: function (cb) {
				cb(data.embed);
			},
			encode: function (val) {
						return encodeURIComponent(val);
					}
		},
		{
			name: "local",
			get: function (cb) {
				cb(config.local);  
			},
			encode: function (val) {
						return encodeURIComponent(val);
					}
		},
		{
			name: "version",
			get: function (cb) {
				cb(data.version);  
			},
			encode: function (val) {
						return encodeURIComponent(val);
					}
		},
		{
			name: "placement",
			get: function (cb) {
				if( data.placement ) cb(data.placement);
				else if( config.googleReader ) cb('google-reader-general');
				else cb('general');
			},
			encode: function (val) {
						return encodeURIComponent(val);
					}
		},
		{
			name: "client_assistance",
			get: function (cb) {
				cb('1');
			},
			encode: function (val) {
						return encodeURIComponent(val);
					}
		}
		];
		config.overlay = {
			endpoint: (config.local ? 'http:' : document.location.protocol) + '//bufferapp.com/add/',
			localendpoint: (config.local ? 'http:' : document.location.protocol) + '//local.bufferapp.com/add/',
			getCSS: function () { return "border:none;height:100%;width:100%;position:fixed!important;z-index:99999999;top:0;left:0;display:block!important;max-width:100%!important;max-height:100%!important;padding:0!important;background: none; background-color: transparent; background-color: rgba(0, 0, 0, 0.1);"; }
		};

		return config; 
	};

    // Method for handling the async firing of the cb
    var executeAfter = function(done, count, data, cb) {
        if(done === count) {
            setTimeout(function(){
                cb(data)
            }, 0);
        }
    };


    // Asynchronously gather data about the page and from embedded sources,
    // like Twitter or Facebook. Currently the async is a bit over the top,
    // and not used, but if we need aysnc down the line, it's there.
    var getData = function (config, cb) {
        var count = config.attributes.length;
        var done = 0;
        var data = {};
        for(var i=0; i < count; i++) {
            // Wrapped in a self-executing function to ensure we don't overwrite ‘a’
            // and that the correct ‘i’ is used
            (function (i) {
                var a = config.attributes[i];
                a.get(function(d) {
                    done += 1;
                    data[a.name] = d;
                    executeAfter(done, count, data, cb);
                });
            }(i));
        }
    };


	;(function check() {
		//wait for xt to be initialized
		if(self.port) {
			xt.port.on('buffer_get_src', function(postData) {
                var config = getConfig(postData);
				getData(config, function(data) {
                    data = transformData(data);
					var src = buildSrc(config, data);
					xt.port.emit('buffer_return_src', src);
				});
			});
		}
		else {
			setTimeout(check, 50);
		}

	}());
}());
