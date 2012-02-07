(function (window, $) {

  var toString = Object.prototype.toString,
      slice = Array.prototype.slice,
      routeTokenMatcher = /:(\w+)/g,
      routeIsRegExpMatcher = /(?:\([^\)]+\)|:\w+)/,
      currentFragment;

  /**
   * 
   * @param route {String}
   * @param callback {Function|Array|String|Object}
   */
  $.route = function (route, callback) {

    var namespace,
        callbacks,
        separator;
    
    if (typeof callback === 'undefined') {
      
      if (typeof route === 'string') {
        return location.hash = route;
      }

      callback = route;
      route = '';

      if (!$.isPlainObject(callback)) {
        throw new Error('$.route: Invalid type.');
      }
    }
    
    switch ($.type(callback)) {

      case 'function':
        addRouteHandler(route, callback);
      break;

      case 'array':
        addRouteHandler(route, function () {

          var params = slice.call(arguments),
              now = $.when();

          $.each(callback, function (i, callback) {
            now = now.pipe(function (values) {
              if (typeof values === 'undefined') {
                values = [];
              } else if (!$.isArray(values)) {
                values = [values];
              }
              return callback.apply(null, params.concat(values));
            });
          });
        });
      break;

      case 'string':
        addRouteHandler(route, function () {
          location.hash = callback;
        });
      break;

      case 'object':
      
        namespace = route;
        callbacks = callback;
        
        for (route in callbacks) {
          if (callbacks.hasOwnProperty(route)) {

            callback = callbacks[route];
            
            // Allow use of . to assign an index callback
            if (route === '.') {
              route = '';
            }

            separator = route && namespace && namespace !== '/' ? '/' : '';

            $.route(namespace + separator + route, callback);
          }
        }
      break;
    }

    return $;
  };
  
  $.route.routes = {};

  /**
   * 
   * @param route {String}
   * @param callback {Function}
   */
  function addRouteHandler (route, callback) {

    var routeHandlers = $.route.routes[route];

    if (!routeHandlers) {
      routeHandlers = $.route.routes[route] = {
        matcher: (routeIsRegExpMatcher.test(route) ? makeRegExpMatcher : makeStringMatcher)(route),
        callbacks: []
      };
    }
    routeHandlers.callbacks.push(callback);
    evaluateRoute([callback], routeHandlers.matcher(currentFragment));
  }
  
  /**
   * 
   * @param route {String}
   */
  function makeRegExpMatcher (route) {

    var routeMatcher = new RegExp('^' + route.split('/').join('\\/').replace(routeTokenMatcher, '([^\/]+)') + '$');

    // Returns array of captured matches or null if none found
    return function (fragment) {
      var matches = routeMatcher.exec(fragment);
      return matches && matches.slice(1);
    };
  }

  /**
   * 
   * @param route {String}
   */
  function makeStringMatcher (route) {
    return function (fragment) {
      // Returns an empty array if matched, or null if unmatched, to mirror
      // the return signature of makeRegExpMatcher
      return fragment === route ? [] : null;
    };
  }

  /**
   * 
   * @param fragment {String}
   */
  function evaluateRoutes (fragment) {

    var route, matches;

    for (route in $.route.routes) {
      if ($.route.routes.hasOwnProperty(route)) {

        route = $.route.routes[route];
        evaluateRoute(route.callbacks, route.matcher(fragment));

      }
    }
  }

  /**
   * 
   * @param callbacks {Array}
   * @param params {Array|Null}
   */
  function evaluateRoute (callbacks, params) {
    var i, n;
    if (params) {
      for (i = 0, n = callbacks.length; i < n; ++i) {
        callbacks[i].apply(null, params);
      }
    }
  }

  $(window).bind('hashchange', function (evt) {
    currentFragment = evt.fragment;
    evaluateRoutes(currentFragment);
  }).trigger('hashchange');

})(this, jQuery);
