/*
 * Shim to make buffermetrics.js work in the context of a background script.
 *
 * - Web app deps shimmed: buffer.application
 *
 * - Other behaviors shimmed: transform relative URLs to absolute ones to make sure
 *   we reach buffer.com instead of a local URI
 *
 * - Firefox-specific shims: window, jQuery.post, and build details.
 *   Background scripts in Firefox don't execute in the context of a regular document,
 *   hence there's no window object, and jQuery isn't included either. On Firefox,
 *   buffermetrics.js and buffermetrics-bg-shim.js are appended at the end of main.js
 *   (the Firefox "background page") to make the shim work (otherwise it'd be executed
 *   in a different CommonJS module and wouldn't have any impact on buffermetrics.js).
 *   using the Firefox-specific Request object.
 *   For the jQuery.post shim, the XHR constructor isn't available either, so we're
 */
/* globals isFirefox */

// ## Shims for Firefox

if (typeof isFirefox != 'undefined' && isFirefox) {
  // buffermetrics.js attaches _bmq to window, which isn't available in Firefox bg scripts
  var window = this;

  // jQuery isn't included in the Firefox background script, so jQuery.post is shimmed with
  // a Firefox-specific Request object.
  var jQuery = {
    post: function(url, params) {
      var Request = require('sdk/request').Request;

      Request({
        url: url,
        content: params,
        onComplete: function (response) {
          console.error('YES!');
          console.error(response);
        }
      }).post();
    }
  };
}


// ## Shims for all browsers

// buffer.application is used by buffermetrics.js
var buffer = { application: 'OVERLAY' };

// Automatically transform relative URLs to absolute ones to make
// relative URLs work in this context
jQuery.post = (function() {
  var orig = jQuery.post;

  return function() {
    // The first argument to $.post() is the URL string
    if (arguments[0] && arguments[0].length) {
      if (arguments[0][0] == '/') arguments[0] = 'https://buffer.com' + arguments[0];
    }

    return orig.apply(jQuery, arguments);
  };
}());
