(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ImageData, MAX_PIXELS, MAX_TRIES, findClusters, toRgbVectors;

MAX_TRIES = 20;

MAX_PIXELS = 10000;

ImageData = require('./src/image-data');

toRgbVectors = require('./src/to-rgb-vectors');

findClusters = require('./src/find-clusters.coffee');

module.exports = function(srcOrImage, numColors, callback) {
  return ImageData(srcOrImage, MAX_PIXELS).then(function(data) {
    var cluster, clusters, vectors;
    vectors = toRgbVectors(data);
    clusters = findClusters(vectors, numColors, MAX_TRIES);
    clusters = clusters.sort(function(a, b) {
      return b.count() - a.count();
    });
    return callback({
      numSamples: vectors.length,
      colors: (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = clusters.length; _i < _len; _i++) {
          cluster = clusters[_i];
          _results.push(cluster.centroid());
        }
        return _results;
      })(),
      counts: (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = clusters.length; _i < _len; _i++) {
          cluster = clusters[_i];
          _results.push(cluster.count());
        }
        return _results;
      })()
    });
  });
};


},{"./src/find-clusters.coffee":12,"./src/image-data":13,"./src/to-rgb-vectors":15}],2:[function(require,module,exports){
'use strict';

module.exports = require('./lib')

},{"./lib":7}],3:[function(require,module,exports){
'use strict';

var asap = require('asap/raw');

function noop() {}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don't use symbols or Object.defineProperty to fully hide them
// because the performance isn't good enough.


// to avoid using try/catch inside critical functions, we
// extract them to here.
var LAST_ERROR = null;
var IS_ERROR = {};
function getThen(obj) {
  try {
    return obj.then;
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

function tryCallOne(fn, a) {
  try {
    return fn(a);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
function tryCallTwo(fn, a, b) {
  try {
    fn(a, b);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

module.exports = Promise;

function Promise(fn) {
  if (typeof this !== 'object') {
    throw new TypeError('Promises must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('not a function');
  }
  this._37 = 0;
  this._12 = null;
  this._59 = [];
  if (fn === noop) return;
  doResolve(fn, this);
}
Promise._99 = noop;

Promise.prototype.then = function(onFulfilled, onRejected) {
  if (this.constructor !== Promise) {
    return safeThen(this, onFulfilled, onRejected);
  }
  var res = new Promise(noop);
  handle(this, new Handler(onFulfilled, onRejected, res));
  return res;
};

function safeThen(self, onFulfilled, onRejected) {
  return new self.constructor(function (resolve, reject) {
    var res = new Promise(noop);
    res.then(resolve, reject);
    handle(self, new Handler(onFulfilled, onRejected, res));
  });
};
function handle(self, deferred) {
  while (self._37 === 3) {
    self = self._12;
  }
  if (self._37 === 0) {
    self._59.push(deferred);
    return;
  }
  asap(function() {
    var cb = self._37 === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      if (self._37 === 1) {
        resolve(deferred.promise, self._12);
      } else {
        reject(deferred.promise, self._12);
      }
      return;
    }
    var ret = tryCallOne(cb, self._12);
    if (ret === IS_ERROR) {
      reject(deferred.promise, LAST_ERROR);
    } else {
      resolve(deferred.promise, ret);
    }
  });
}
function resolve(self, newValue) {
  // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
  if (newValue === self) {
    return reject(
      self,
      new TypeError('A promise cannot be resolved with itself.')
    );
  }
  if (
    newValue &&
    (typeof newValue === 'object' || typeof newValue === 'function')
  ) {
    var then = getThen(newValue);
    if (then === IS_ERROR) {
      return reject(self, LAST_ERROR);
    }
    if (
      then === self.then &&
      newValue instanceof Promise
    ) {
      self._37 = 3;
      self._12 = newValue;
      finale(self);
      return;
    } else if (typeof then === 'function') {
      doResolve(then.bind(newValue), self);
      return;
    }
  }
  self._37 = 1;
  self._12 = newValue;
  finale(self);
}

function reject(self, newValue) {
  self._37 = 2;
  self._12 = newValue;
  finale(self);
}
function finale(self) {
  for (var i = 0; i < self._59.length; i++) {
    handle(self, self._59[i]);
  }
  self._59 = null;
}

function Handler(onFulfilled, onRejected, promise){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, promise) {
  var done = false;
  var res = tryCallTwo(fn, function (value) {
    if (done) return;
    done = true;
    resolve(promise, value);
  }, function (reason) {
    if (done) return;
    done = true;
    reject(promise, reason);
  })
  if (!done && res === IS_ERROR) {
    done = true;
    reject(promise, LAST_ERROR);
  }
}

},{"asap/raw":10}],4:[function(require,module,exports){
'use strict';

var Promise = require('./core.js');

module.exports = Promise;
Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this;
  self.then(null, function (err) {
    setTimeout(function () {
      throw err;
    }, 0);
  });
};

},{"./core.js":3}],5:[function(require,module,exports){
'use strict';

//This file contains the ES6 extensions to the core Promises/A+ API

var Promise = require('./core.js');

module.exports = Promise;

/* Static Functions */

var TRUE = valuePromise(true);
var FALSE = valuePromise(false);
var NULL = valuePromise(null);
var UNDEFINED = valuePromise(undefined);
var ZERO = valuePromise(0);
var EMPTYSTRING = valuePromise('');

function valuePromise(value) {
  var p = new Promise(Promise._99);
  p._37 = 1;
  p._12 = value;
  return p;
}
Promise.resolve = function (value) {
  if (value instanceof Promise) return value;

  if (value === null) return NULL;
  if (value === undefined) return UNDEFINED;
  if (value === true) return TRUE;
  if (value === false) return FALSE;
  if (value === 0) return ZERO;
  if (value === '') return EMPTYSTRING;

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then;
      if (typeof then === 'function') {
        return new Promise(then.bind(value));
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex);
      });
    }
  }
  return valuePromise(value);
};

Promise.all = function (arr) {
  var args = Array.prototype.slice.call(arr);

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([]);
    var remaining = args.length;
    function res(i, val) {
      if (val && (typeof val === 'object' || typeof val === 'function')) {
        if (val instanceof Promise && val.then === Promise.prototype.then) {
          while (val._37 === 3) {
            val = val._12;
          }
          if (val._37 === 1) return res(i, val._12);
          if (val._37 === 2) reject(val._12);
          val.then(function (val) {
            res(i, val);
          }, reject);
          return;
        } else {
          var then = val.then;
          if (typeof then === 'function') {
            var p = new Promise(then.bind(val));
            p.then(function (val) {
              res(i, val);
            }, reject);
            return;
          }
        }
      }
      args[i] = val;
      if (--remaining === 0) {
        resolve(args);
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) {
    reject(value);
  });
};

Promise.race = function (values) {
  return new Promise(function (resolve, reject) {
    values.forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    });
  });
};

/* Prototype Methods */

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};

},{"./core.js":3}],6:[function(require,module,exports){
'use strict';

var Promise = require('./core.js');

module.exports = Promise;
Promise.prototype['finally'] = function (f) {
  return this.then(function (value) {
    return Promise.resolve(f()).then(function () {
      return value;
    });
  }, function (err) {
    return Promise.resolve(f()).then(function () {
      throw err;
    });
  });
};

},{"./core.js":3}],7:[function(require,module,exports){
'use strict';

module.exports = require('./core.js');
require('./done.js');
require('./finally.js');
require('./es6-extensions.js');
require('./node-extensions.js');

},{"./core.js":3,"./done.js":4,"./es6-extensions.js":5,"./finally.js":6,"./node-extensions.js":8}],8:[function(require,module,exports){
'use strict';

// This file contains then/promise specific extensions that are only useful
// for node.js interop

var Promise = require('./core.js');
var asap = require('asap');

module.exports = Promise;

/* Static Functions */

Promise.denodeify = function (fn, argumentCount) {
  argumentCount = argumentCount || Infinity;
  return function () {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 0,
        argumentCount > 0 ? argumentCount : 0);
    return new Promise(function (resolve, reject) {
      args.push(function (err, res) {
        if (err) reject(err);
        else resolve(res);
      })
      var res = fn.apply(self, args);
      if (res &&
        (
          typeof res === 'object' ||
          typeof res === 'function'
        ) &&
        typeof res.then === 'function'
      ) {
        resolve(res);
      }
    })
  }
}
Promise.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    var callback =
      typeof args[args.length - 1] === 'function' ? args.pop() : null;
    var ctx = this;
    try {
      return fn.apply(this, arguments).nodeify(callback, ctx);
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new Promise(function (resolve, reject) {
          reject(ex);
        });
      } else {
        asap(function () {
          callback.call(ctx, ex);
        })
      }
    }
  }
}

Promise.prototype.nodeify = function (callback, ctx) {
  if (typeof callback != 'function') return this;

  this.then(function (value) {
    asap(function () {
      callback.call(ctx, null, value);
    });
  }, function (err) {
    asap(function () {
      callback.call(ctx, err);
    });
  });
}

},{"./core.js":3,"asap":9}],9:[function(require,module,exports){
"use strict";

// rawAsap provides everything we need except exception management.
var rawAsap = require("./raw");
// RawTasks are recycled to reduce GC churn.
var freeTasks = [];
// We queue errors to ensure they are thrown in right order (FIFO).
// Array-as-queue is good enough here, since we are just dealing with exceptions.
var pendingErrors = [];
var requestErrorThrow = rawAsap.makeRequestCallFromTimer(throwFirstError);

function throwFirstError() {
    if (pendingErrors.length) {
        throw pendingErrors.shift();
    }
}

/**
 * Calls a task as soon as possible after returning, in its own event, with priority
 * over other events like animation, reflow, and repaint. An error thrown from an
 * event will not interrupt, nor even substantially slow down the processing of
 * other events, but will be rather postponed to a lower priority event.
 * @param {{call}} task A callable object, typically a function that takes no
 * arguments.
 */
module.exports = asap;
function asap(task) {
    var rawTask;
    if (freeTasks.length) {
        rawTask = freeTasks.pop();
    } else {
        rawTask = new RawTask();
    }
    rawTask.task = task;
    rawAsap(rawTask);
}

// We wrap tasks with recyclable task objects.  A task object implements
// `call`, just like a function.
function RawTask() {
    this.task = null;
}

// The sole purpose of wrapping the task is to catch the exception and recycle
// the task object after its single use.
RawTask.prototype.call = function () {
    try {
        this.task.call();
    } catch (error) {
        if (asap.onerror) {
            // This hook exists purely for testing purposes.
            // Its name will be periodically randomized to break any code that
            // depends on its existence.
            asap.onerror(error);
        } else {
            // In a web browser, exceptions are not fatal. However, to avoid
            // slowing down the queue of pending tasks, we rethrow the error in a
            // lower priority turn.
            pendingErrors.push(error);
            requestErrorThrow();
        }
    } finally {
        this.task = null;
        freeTasks[freeTasks.length] = this;
    }
};

},{"./raw":10}],10:[function(require,module,exports){
(function (global){
"use strict";

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including IO, animation, reflow, and redraw
// events in browsers.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
module.exports = rawAsap;
function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
        flushing = true;
    }
    // Equivalent to push, but avoids a function call.
    queue[queue.length] = task;
}

var queue = [];
// Once a flush has been requested, no further calls to `requestFlush` are
// necessary until the next `flush` completes.
var flushing = false;
// `requestFlush` is an implementation-specific method that attempts to kick
// off a `flush` event as quickly as possible. `flush` will attempt to exhaust
// the event queue before yielding to the browser's own event loop.
var requestFlush;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory exhaustion, the task queue will periodically
// truncate already-completed tasks.
var capacity = 1024;

// The flush function processes all tasks that have been scheduled with
// `rawAsap` unless and until one of those tasks throws an exception.
// If a task throws an exception, `flush` ensures that its state will remain
// consistent and will resume where it left off when called again.
// However, `flush` does not make any arrangements to be called again if an
// exception is thrown.
function flush() {
    while (index < queue.length) {
        var currentIndex = index;
        // Advance the index before calling the task. This ensures that we will
        // begin flushing on the next task the task throws an error.
        index = index + 1;
        queue[currentIndex].call();
        // Prevent leaking memory for long chains of recursive calls to `asap`.
        // If we call `asap` within tasks scheduled by `asap`, the queue will
        // grow, but to avoid an O(n) walk for every task we execute, we don't
        // shift tasks off the queue after they have been executed.
        // Instead, we periodically shift 1024 tasks off the queue.
        if (index > capacity) {
            // Manually shift all values starting at the index back to the
            // beginning of the queue.
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                queue[scan] = queue[scan + index];
            }
            queue.length -= index;
            index = 0;
        }
    }
    queue.length = 0;
    index = 0;
    flushing = false;
}

// `requestFlush` is implemented using a strategy based on data collected from
// every available SauceLabs Selenium web driver worker at time of writing.
// https://docs.google.com/spreadsheets/d/1mG-5UYGup5qxGdEMWkhP6BWCz053NUb2E1QoUTU16uA/edit#gid=783724593

// Safari 6 and 6.1 for desktop, iPad, and iPhone are the only browsers that
// have WebKitMutationObserver but not un-prefixed MutationObserver.
// Must use `global` instead of `window` to work in both frames and web
// workers. `global` is a provision of Browserify, Mr, Mrs, or Mop.
var BrowserMutationObserver = global.MutationObserver || global.WebKitMutationObserver;

// MutationObservers are desirable because they have high priority and work
// reliably everywhere they are implemented.
// They are implemented in all modern browsers.
//
// - Android 4-4.3
// - Chrome 26-34
// - Firefox 14-29
// - Internet Explorer 11
// - iPad Safari 6-7.1
// - iPhone Safari 7-7.1
// - Safari 6-7
if (typeof BrowserMutationObserver === "function") {
    requestFlush = makeRequestCallFromMutationObserver(flush);

// MessageChannels are desirable because they give direct access to the HTML
// task queue, are implemented in Internet Explorer 10, Safari 5.0-1, and Opera
// 11-12, and in web workers in many engines.
// Although message channels yield to any queued rendering and IO tasks, they
// would be better than imposing the 4ms delay of timers.
// However, they do not work reliably in Internet Explorer or Safari.

// Internet Explorer 10 is the only browser that has setImmediate but does
// not have MutationObservers.
// Although setImmediate yields to the browser's renderer, it would be
// preferrable to falling back to setTimeout since it does not have
// the minimum 4ms penalty.
// Unfortunately there appears to be a bug in Internet Explorer 10 Mobile (and
// Desktop to a lesser extent) that renders both setImmediate and
// MessageChannel useless for the purposes of ASAP.
// https://github.com/kriskowal/q/issues/396

// Timers are implemented universally.
// We fall back to timers in workers in most engines, and in foreground
// contexts in the following browsers.
// However, note that even this simple case requires nuances to operate in a
// broad spectrum of browsers.
//
// - Firefox 3-13
// - Internet Explorer 6-9
// - iPad Safari 4.3
// - Lynx 2.8.7
} else {
    requestFlush = makeRequestCallFromTimer(flush);
}

// `requestFlush` requests that the high priority event queue be flushed as
// soon as possible.
// This is useful to prevent an error thrown in a task from stalling the event
// queue if the exception handled by Node.js’s
// `process.on("uncaughtException")` or by a domain.
rawAsap.requestFlush = requestFlush;

// To request a high priority event, we induce a mutation observer by toggling
// the text of a text node between "1" and "-1".
function makeRequestCallFromMutationObserver(callback) {
    var toggle = 1;
    var observer = new BrowserMutationObserver(callback);
    var node = document.createTextNode("");
    observer.observe(node, {characterData: true});
    return function requestCall() {
        toggle = -toggle;
        node.data = toggle;
    };
}

// The message channel technique was discovered by Malte Ubl and was the
// original foundation for this library.
// http://www.nonblocking.io/2011/06/windownexttick.html

// Safari 6.0.5 (at least) intermittently fails to create message ports on a
// page's first load. Thankfully, this version of Safari supports
// MutationObservers, so we don't need to fall back in that case.

// function makeRequestCallFromMessageChannel(callback) {
//     var channel = new MessageChannel();
//     channel.port1.onmessage = callback;
//     return function requestCall() {
//         channel.port2.postMessage(0);
//     };
// }

// For reasons explained above, we are also unable to use `setImmediate`
// under any circumstances.
// Even if we were, there is another bug in Internet Explorer 10.
// It is not sufficient to assign `setImmediate` to `requestFlush` because
// `setImmediate` must be called *by name* and therefore must be wrapped in a
// closure.
// Never forget.

// function makeRequestCallFromSetImmediate(callback) {
//     return function requestCall() {
//         setImmediate(callback);
//     };
// }

// Safari 6.0 has a problem where timers will get lost while the user is
// scrolling. This problem does not impact ASAP because Safari 6.0 supports
// mutation observers, so that implementation is used instead.
// However, if we ever elect to use timers in Safari, the prevalent work-around
// is to add a scroll event listener that calls for a flush.

// `setTimeout` does not call the passed callback if the delay is less than
// approximately 7 in web workers in Firefox 8 through 18, and sometimes not
// even then.

function makeRequestCallFromTimer(callback) {
    return function requestCall() {
        // We dispatch a timeout with a specified delay of 0 for engines that
        // can reliably accommodate that request. This will usually be snapped
        // to a 4 milisecond delay, but once we're flushing, there's no delay
        // between events.
        var timeoutHandle = setTimeout(handleTimer, 0);
        // However, since this timer gets frequently dropped in Firefox
        // workers, we enlist an interval handle that will try to fire
        // an event 20 times per second until it succeeds.
        var intervalHandle = setInterval(handleTimer, 50);

        function handleTimer() {
            // Whichever timer succeeds will cancel both timers and
            // execute the callback.
            clearTimeout(timeoutHandle);
            clearInterval(intervalHandle);
            callback();
        }
    };
}

// This is for `asap.js` only.
// Its name will be periodically randomized to break any code that depends on
// its existence.
rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;

// ASAP was originally a nextTick shim included in Q. This was factored out
// into this ASAP package. It was later adapted to RSVP which made further
// amendments. These decisions, particularly to marginalize MessageChannel and
// to capture the MutationObserver implementation in a closure, were integrated
// back into ASAP proper.
// https://github.com/tildeio/rsvp.js/blob/cddf7232546a9cf858524b75cde6f9edf72620a7/lib/rsvp/asap.js

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],11:[function(require,module,exports){
var distance;

distance = require('./square-distance');

module.exports = function() {
  var api, centroid, lastNumVectors, totals, vectors;
  api = {};
  totals = [0, 0, 0];
  vectors = [];
  centroid = null;
  lastNumVectors = null;
  api.add = function(vector) {
    var i, val, _i, _len;
    for (i = _i = 0, _len = vector.length; _i < _len; i = ++_i) {
      val = vector[i];
      totals[i] += val;
    }
    return vectors.push(vector);
  };
  api.count = function() {
    return vectors.length;
  };
  api.centroid = function() {
    var dist, mean, smallestDist, vector, _i, _len, _ref;
    if ((centroid != null) && lastNumVectors === vectors.length) {
      return centroid;
    }
    mean = api.mean();
    if (!mean) {
      return;
    }
    centroid = vectors[0];
    lastNumVectors = vectors.length;
    smallestDist = distance(mean, centroid);
    _ref = vectors.slice(1);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      vector = _ref[_i];
      if (!((dist = distance(mean, vector)) < smallestDist)) {
        continue;
      }
      centroid = vector;
      smallestDist = dist;
    }
    return centroid;
  };
  api.mean = function() {
    var count, total, _i, _len, _results;
    if ((count = vectors.length) === 0) {
      return;
    }
    _results = [];
    for (_i = 0, _len = totals.length; _i < _len; _i++) {
      total = totals[_i];
      _results.push(Math.round(total / count));
    }
    return _results;
  };
  api.clear = function() {
    totals = null;
    vectors.length = 0;
    centroid = null;
    return lastNumVectors = null;
  };
  return api;
};


},{"./square-distance":14}],12:[function(require,module,exports){
var Cluster, bail, centroidsEqual, closestClusterIdx, distance, pickEvenly, pickRandom, step, vectorsEqual;

Cluster = require('./cluster.coffee');

distance = require('./square-distance');

module.exports = function(vectors, numClusters, maxTries) {
  var centroids, clusters, i, numTries, prevClusters;
  numClusters = Math.min(vectors.length, numClusters);
  if (vectors.length === numClusters) {
    return bail(vectors, numClusters);
  }
  numTries = 0;
  centroids = pickEvenly(numClusters, 3, 255);
  prevClusters = null;
  while (numTries < maxTries && !centroidsEqual(centroids, prevClusters)) {
    prevClusters = clusters;
    clusters = (function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= numClusters ? _i < numClusters : _i > numClusters; i = 0 <= numClusters ? ++_i : --_i) {
        _results.push(Cluster());
      }
      return _results;
    })();
    centroids = step(vectors, centroids, clusters);
    numTries++;
  }
  return clusters;
};

step = function(vectors, centroids, clusters) {
  var cluster, i, vector, _i, _j, _len, _len1, _results;
  for (_i = 0, _len = vectors.length; _i < _len; _i++) {
    vector = vectors[_i];
    cluster = clusters[closestClusterIdx(centroids, vector)];
    cluster.add(vector);
  }
  _results = [];
  for (i = _j = 0, _len1 = clusters.length; _j < _len1; i = ++_j) {
    cluster = clusters[i];
    if (cluster.count() > 0) {
      _results.push(cluster.mean());
    }
  }
  return _results;
};

closestClusterIdx = function(centroids, vector) {
  var c, closest, dist, idx, smallestDist, _i, _len;
  closest = 0;
  smallestDist = 195076;
  for (idx = _i = 0, _len = centroids.length; _i < _len; idx = ++_i) {
    c = centroids[idx];
    dist = distance(c, vector);
    if (dist < smallestDist) {
      closest = idx;
      smallestDist = dist;
    }
  }
  return closest;
};

pickRandom = function(n, samples) {
  var idx, picks, v, _, _i;
  picks = [];
  samples = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = samples.length; _i < _len; _i++) {
      v = samples[_i];
      _results.push(v);
    }
    return _results;
  })();
  for (_ = _i = 0; 0 <= n ? _i < n : _i > n; _ = 0 <= n ? ++_i : --_i) {
    idx = Math.floor(Math.random() * samples.length);
    picks.push(samples[idx]);
    samples.splice(idx, 1);
  }
  return picks;
};

pickEvenly = function(n, dimensions, range) {
  var chunk, dim, i, s, vectors, _i;
  chunk = range / n;
  vectors = [];
  for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
    s = Math.round(chunk * i + chunk / 2);
    vectors.push((function() {
      var _j, _results;
      _results = [];
      for (dim = _j = 0; 0 <= dimensions ? _j < dimensions : _j > dimensions; dim = 0 <= dimensions ? ++_j : --_j) {
        _results.push(s);
      }
      return _results;
    })());
  }
  return vectors;
};

centroidsEqual = function(old, clusters) {
  var centroid, i, _i, _len;
  if (!clusters) {
    return false;
  }
  for (i = _i = 0, _len = old.length; _i < _len; i = ++_i) {
    centroid = old[i];
    if (!vectorsEqual(centroid, clusters[i].centroid())) {
      return false;
    }
  }
  return true;
};

vectorsEqual = function(a, b) {
  var i, val, _i, _len;
  if ((a && !b) || (b && !a) || (!a && !b)) {
    return false;
  }
  for (i = _i = 0, _len = a.length; _i < _len; i = ++_i) {
    val = a[i];
    if (val !== b[i]) {
      return false;
    }
  }
  return true;
};

bail = function(vectors, numClusters) {
  var cluster, clusters, i, _i, _len;
  clusters = (function() {
    var _i, _results;
    _results = [];
    for (i = _i = 0; 0 <= numClusters ? _i < numClusters : _i > numClusters; i = 0 <= numClusters ? ++_i : --_i) {
      _results.push(Cluster());
    }
    return _results;
  })();
  for (i = _i = 0, _len = clusters.length; _i < _len; i = ++_i) {
    cluster = clusters[i];
    cluster.add(vectors.at(i));
  }
  return clusters;
};


},{"./cluster.coffee":11,"./square-distance":14}],13:[function(require,module,exports){
var Promise = require('promise');

module.exports = function imageData(srcOrImg, maxPixels) {
  var image = new Image();
  var promise = new Promise(function(accept, reject) {
    image.onload = function() { accept(toData(image, maxPixels)); };
  });

  image.src = srcOrImg.src ? srcOrImg.src : (srcOrImg || '');

  return promise;
};

function toData(image, maxPixels) {
  var size = clampImageSize(image, maxPixels);
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');

  canvas.width = size.width;
  canvas.height = size.height;
  ctx.drawImage(image, 0, 0, size.width, size.height);

  return ctx.getImageData(0, 0, size.width, size.height)
    .data;
}

function clampImageSize(image, maxPixels) {
  var aspect = image.width / image.height;
  var height = Math.sqrt(maxPixels / aspect);
  var width = height * aspect;

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

},{"promise":2}],14:[function(require,module,exports){
// Calculates the square distance of two vectors (presented as arrays).
module.exports = function squareDistance(a, b) {
  var deltaSum = 0;
  var dim = a.length;

  for(var i = 0; i < dim; i++)
    deltaSum = deltaSum + Math.pow((b[i] - a[i]), 2);

  return deltaSum;
};

},{}],15:[function(require,module,exports){
module.exports = function toRgbArray(imageData) {
  var rgbVectors = [];
  var numPixels = imageData.length / 4;
  var offset;

  for (var i = 0; i < numPixels; i++) {
    offset = i * 4;
    rgbVectors.push(
      Array.prototype.slice.apply(imageData, [offset, offset+3])
    );
  }

  return rgbVectors;
};

},{}],16:[function(require,module,exports){
var ImageData, Palette, i, makePaletteEl, showTestImage, _i;

ImageData = require("../src/image-data");

Palette = require("../index.coffee");

makePaletteEl = function(image, palette) {
  var c, colorContainer, colorEl, container, countContainer, countEl, i, _i, _len, _ref;
  image.style.border = '1px solid #ccc';
  image.style.maxWidth = '280px';
  container = document.createElement('div');
  container.style.display = 'inline-block';
  container.style.textAlign = 'center';
  container.style.padding = '0 16px';
  colorContainer = document.createElement('div');
  colorContainer.style.textAlign = 'left';
  colorContainer.style.border = '1px solid #ddd';
  colorContainer.style.fontSize = '0';
  countContainer = document.createElement('div');
  countContainer.style.textAlign = 'left';
  _ref = palette.colors;
  for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
    c = _ref[i];
    if (c == null) {
      c = [];
    }
    colorEl = document.createElement('div');
    colorEl.style.display = 'inline-block';
    colorEl.style.width = 40 + 'px';
    colorEl.style.height = 20 + 'px';
    colorEl.style.backgroundColor = "rgb(" + (c.join(',')) + ")";
    countEl = document.createElement('div');
    countEl.style.display = 'inline-block';
    countEl.style.width = 40 + 'px';
    countEl.style.height = 20 + 'px';
    countEl.style.fontSize = 11 + 'px';
    countEl.style.textAlign = 'center';
    countEl.innerHTML = palette.counts[i];
    colorContainer.appendChild(colorEl);
    countContainer.appendChild(countEl);
  }
  container.appendChild(image);
  container.appendChild(colorContainer);
  container.appendChild(countContainer);
  return container;
};

showTestImage = function(i) {
  return Palette("" + i + ".jpg", 7, function(palette) {
    var img;
    img = new Image();
    img.src = "" + i + ".jpg";
    img.style.marginTop = 20 + 'px';
    return document.body.appendChild(makePaletteEl(img, palette));
  });
};

for (i = _i = 1; _i <= 6; i = ++_i) {
  showTestImage(i);
}


},{"../index.coffee":1,"../src/image-data":13}]},{},[16])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9mZWxpeC9Xb3Jrc3BhY2UvcGFsZXR0ZS5qcy9pbmRleC5jb2ZmZWUiLCJub2RlX21vZHVsZXMvcHJvbWlzZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9taXNlL2xpYi9jb3JlLmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2UvbGliL2RvbmUuanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZS9saWIvZXM2LWV4dGVuc2lvbnMuanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZS9saWIvZmluYWxseS5qcyIsIm5vZGVfbW9kdWxlcy9wcm9taXNlL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9taXNlL2xpYi9ub2RlLWV4dGVuc2lvbnMuanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZS9ub2RlX21vZHVsZXMvYXNhcC9icm93c2VyLWFzYXAuanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZS9ub2RlX21vZHVsZXMvYXNhcC9icm93c2VyLXJhdy5qcyIsIi9Vc2Vycy9mZWxpeC9Xb3Jrc3BhY2UvcGFsZXR0ZS5qcy9zcmMvY2x1c3Rlci5jb2ZmZWUiLCIvVXNlcnMvZmVsaXgvV29ya3NwYWNlL3BhbGV0dGUuanMvc3JjL2ZpbmQtY2x1c3RlcnMuY29mZmVlIiwic3JjL2ltYWdlLWRhdGEuanMiLCJzcmMvc3F1YXJlLWRpc3RhbmNlLmpzIiwic3JjL3RvLXJnYi12ZWN0b3JzLmpzIiwiL1VzZXJzL2ZlbGl4L1dvcmtzcGFjZS9wYWxldHRlLmpzL3Rlc3QvdGVzdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFBLDREQUFBOztBQUFBLFNBQUEsR0FBWSxFQUFaLENBQUE7O0FBQUEsVUFDQSxHQUFhLEtBRGIsQ0FBQTs7QUFBQSxTQUdBLEdBQVksT0FBQSxDQUFRLGtCQUFSLENBSFosQ0FBQTs7QUFBQSxZQUlBLEdBQWUsT0FBQSxDQUFRLHNCQUFSLENBSmYsQ0FBQTs7QUFBQSxZQUtBLEdBQWUsT0FBQSxDQUFRLDRCQUFSLENBTGYsQ0FBQTs7QUFBQSxNQU9NLENBQUMsT0FBUCxHQUFpQixTQUFDLFVBQUQsRUFBYSxTQUFiLEVBQXdCLFFBQXhCLEdBQUE7U0FDZixTQUFBLENBQVUsVUFBVixFQUFzQixVQUF0QixDQUNFLENBQUMsSUFESCxDQUNRLFNBQUMsSUFBRCxHQUFBO0FBQ0osUUFBQSwwQkFBQTtBQUFBLElBQUEsT0FBQSxHQUFVLFlBQUEsQ0FBYSxJQUFiLENBQVYsQ0FBQTtBQUFBLElBQ0EsUUFBQSxHQUFXLFlBQUEsQ0FBYSxPQUFiLEVBQXNCLFNBQXRCLEVBQWlDLFNBQWpDLENBRFgsQ0FBQTtBQUFBLElBRUEsUUFBQSxHQUFXLFFBQVEsQ0FBQyxJQUFULENBQWMsU0FBQyxDQUFELEVBQUcsQ0FBSCxHQUFBO2FBQVMsQ0FBQyxDQUFDLEtBQUYsQ0FBQSxDQUFBLEdBQVksQ0FBQyxDQUFDLEtBQUYsQ0FBQSxFQUFyQjtJQUFBLENBQWQsQ0FGWCxDQUFBO1dBSUEsUUFBQSxDQUFTO0FBQUEsTUFDUCxVQUFBLEVBQVksT0FBTyxDQUFDLE1BRGI7QUFBQSxNQUVQLE1BQUE7O0FBQVM7YUFBQSwrQ0FBQTtpQ0FBQTtBQUFBLHdCQUFBLE9BQU8sQ0FBQyxRQUFSLENBQUEsRUFBQSxDQUFBO0FBQUE7O1VBRkY7QUFBQSxNQUdQLE1BQUE7O0FBQVM7YUFBQSwrQ0FBQTtpQ0FBQTtBQUFBLHdCQUFBLE9BQU8sQ0FBQyxLQUFSLENBQUEsRUFBQSxDQUFBO0FBQUE7O1VBSEY7S0FBVCxFQUxJO0VBQUEsQ0FEUixFQURlO0FBQUEsQ0FQakIsQ0FBQTs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNU5BLElBQUEsUUFBQTs7QUFBQSxRQUFBLEdBQVcsT0FBQSxDQUFRLG1CQUFSLENBQVgsQ0FBQTs7QUFBQSxNQUVNLENBQUMsT0FBUCxHQUFpQixTQUFBLEdBQUE7QUFDZixNQUFBLDhDQUFBO0FBQUEsRUFBQSxHQUFBLEdBQU0sRUFBTixDQUFBO0FBQUEsRUFFQSxNQUFBLEdBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FGVCxDQUFBO0FBQUEsRUFHQSxPQUFBLEdB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QkFBMUIsR0FBQTtBQUFBLEVBQUEsYUFBQSxDQUFjLENBQWQsQ0FBQSxDQUFBO0FBQUEsQ0FwREEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiTUFYX1RSSUVTID0gMjBcbk1BWF9QSVhFTFMgPSAxMDAwMFxuXG5JbWFnZURhdGEgPSByZXF1aXJlICcuL3NyYy9pbWFnZS1kYXRhJ1xudG9SZ2JWZWN0b3JzID0gcmVxdWlyZSAnLi9zcmMvdG8tcmdiLXZlY3RvcnMnXG5maW5kQ2x1c3RlcnMgPSByZXF1aXJlICcuL3NyYy9maW5kLWNsdXN0ZXJzLmNvZmZlZSdcblxubW9kdWxlLmV4cG9ydHMgPSAoc3JjT3JJbWFnZSwgbnVtQ29sb3JzLCBjYWxsYmFjaykgLT5cbiAgSW1hZ2VEYXRhKHNyY09ySW1hZ2UsIE1BWF9QSVhFTFMpXG4gICAgLnRoZW4gKGRhdGEpIC0+XG4gICAgICB2ZWN0b3JzID0gdG9SZ2JWZWN0b3JzKGRhdGEpXG4gICAgICBjbHVzdGVycyA9IGZpbmRDbHVzdGVycyh2ZWN0b3JzLCBudW1Db2xvcnMsIE1BWF9UUklFUylcbiAgICAgIGNsdXN0ZXJzID0gY2x1c3RlcnMuc29ydCAoYSxiKSAtPiBiLmNvdW50KCkgLSBhLmNvdW50KClcblxuICAgICAgY2FsbGJhY2sge1xuICAgICAgICBudW1TYW1wbGVzOiB2ZWN0b3JzLmxlbmd0aFxuICAgICAgICBjb2xvcnM6IChjbHVzdGVyLmNlbnRyb2lkKCkgZm9yIGNsdXN0ZXIgaW4gY2x1c3RlcnMpXG4gICAgICAgIGNvdW50czogKGNsdXN0ZXIuY291bnQoKSBmb3IgY2x1c3RlciBpbiBjbHVzdGVycylcbiAgICAgIH1cblxuXG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWInKVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXNhcCA9IHJlcXVpcmUoJ2FzYXAvcmF3Jyk7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG4vLyBTdGF0ZXM6XG4vL1xuLy8gMCAtIHBlbmRpbmdcbi8vIDEgLSBmdWxmaWxsZWQgd2l0aCBfdmFsdWVcbi8vIDIgLSByZWplY3RlZCB3aXRoIF92YWx1ZVxuLy8gMyAtIGFkb3B0ZWQgdGhlIHN0YXRlIG9mIGFub3RoZXIgcHJvbWlzZSwgX3ZhbHVlXG4vL1xuLy8gb25jZSB0aGUgc3RhdGUgaXMgbm8gbG9uZ2VyIHBlbmRpbmcgKDApIGl0IGlzIGltbXV0YWJsZVxuXG4vLyBBbGwgYF9gIHByZWZpeGVkIHByb3BlcnRpZXMgd2lsbCBiZSByZWR1Y2VkIHRvIGBfe3JhbmRvbSBudW1iZXJ9YFxuLy8gYXQgYnVpbGQgdGltZSB0byBvYmZ1c2NhdGUgdGhlbSBhbmQgZGlzY291cmFnZSB0aGVpciB1c2UuXG4vLyBXZSBkb24ndCB1c2Ugc3ltYm9scyBvciBPYmplY3QuZGVmaW5lUHJvcGVydHkgdG8gZnVsbHkgaGlkZSB0aGVtXG4vLyBiZWNhdXNlIHRoZSBwZXJmb3JtYW5jZSBpc24ndCBnb29kIGVub3VnaC5cblxuXG4vLyB0byBhdm9pZCB1c2luZyB0cnkvY2F0Y2ggaW5zaWRlIGNyaXRpY2FsIGZ1bmN0aW9ucywgd2Vcbi8vIGV4dHJhY3QgdGhlbSB0byBoZXJlLlxudmFyIExBU1RfRVJST1IgPSBudWxsO1xudmFyIElTX0VSUk9SID0ge307XG5mdW5jdGlvbiBnZXRUaGVuKG9iaikge1xuICB0cnkge1xuICAgIHJldHVybiBvYmoudGhlbjtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBMQVNUX0VSUk9SID0gZXg7XG4gICAgcmV0dXJuIElTX0VSUk9SO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRyeUNhbGxPbmUoZm4sIGEpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZm4oYSk7XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgTEFTVF9FUlJPUiA9IGV4O1xuICAgIHJldHVybiBJU19FUlJPUjtcbiAgfVxufVxuZnVuY3Rpb24gdHJ5Q2FsbFR3byhmbiwgYSwgYikge1xuICB0cnkge1xuICAgIGZuKGEsIGIpO1xuICB9IGNhdGNoIChleCkge1xuICAgIExBU1RfRVJST1IgPSBleDtcbiAgICByZXR1cm4gSVNfRVJST1I7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlO1xuXG5mdW5jdGlvbiBQcm9taXNlKGZuKSB7XG4gIGlmICh0eXBlb2YgdGhpcyAhPT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdQcm9taXNlcyBtdXN0IGJlIGNvbnN0cnVjdGVkIHZpYSBuZXcnKTtcbiAgfVxuICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbm90IGEgZnVuY3Rpb24nKTtcbiAgfVxuICB0aGlzLl8zNyA9IDA7XG4gIHRoaXMuXzEyID0gbnVsbDtcbiAgdGhpcy5fNTkgPSBbXTtcbiAgaWYgKGZuID09PSBub29wKSByZXR1cm47XG4gIGRvUmVzb2x2ZShmbiwgdGhpcyk7XG59XG5Qcm9taXNlLl85OSA9IG5vb3A7XG5cblByb21pc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICBpZiAodGhpcy5jb25zdHJ1Y3RvciAhPT0gUHJvbWlzZSkge1xuICAgIHJldHVybiBzYWZlVGhlbih0aGlzLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCk7XG4gIH1cbiAgdmFyIHJlcyA9IG5ldyBQcm9taXNlKG5vb3ApO1xuICBoYW5kbGUodGhpcywgbmV3IEhhbmRsZXIob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHJlcykpO1xuICByZXR1cm4gcmVzO1xufTtcblxuZnVuY3Rpb24gc2FmZVRoZW4oc2VsZiwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgcmV0dXJuIG5ldyBzZWxmLmNvbnN0cnVjdG9yKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgcmVzID0gbmV3IFByb21pc2Uobm9vcCk7XG4gICAgcmVzLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICBoYW5kbGUoc2VsZiwgbmV3IEhhbmRsZXIob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHJlcykpO1xuICB9KTtcbn07XG5mdW5jdGlvbiBoYW5kbGUoc2VsZiwgZGVmZXJyZWQpIHtcbiAgd2hpbGUgKHNlbGYuXzM3ID09PSAzKSB7XG4gICAgc2VsZiA9IHNlbGYuXzEyO1xuICB9XG4gIGlmIChzZWxmLl8zNyA9PT0gMCkge1xuICAgIHNlbGYuXzU5LnB1c2goZGVmZXJyZWQpO1xuICAgIHJldHVybjtcbiAgfVxuICBhc2FwKGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYiA9IHNlbGYuXzM3ID09PSAxID8gZGVmZXJyZWQub25GdWxmaWxsZWQgOiBkZWZlcnJlZC5vblJlamVjdGVkO1xuICAgIGlmIChjYiA9PT0gbnVsbCkge1xuICAgICAgaWYgKHNlbGYuXzM3ID09PSAxKSB7XG4gICAgICAgIHJlc29sdmUoZGVmZXJyZWQucHJvbWlzZSwgc2VsZi5fMTIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVqZWN0KGRlZmVycmVkLnByb21pc2UsIHNlbGYuXzEyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHJldCA9IHRyeUNhbGxPbmUoY2IsIHNlbGYuXzEyKTtcbiAgICBpZiAocmV0ID09PSBJU19FUlJPUikge1xuICAgICAgcmVqZWN0KGRlZmVycmVkLnByb21pc2UsIExBU1RfRVJST1IpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXNvbHZlKGRlZmVycmVkLnByb21pc2UsIHJldCk7XG4gICAgfVxuICB9KTtcbn1cbmZ1bmN0aW9uIHJlc29sdmUoc2VsZiwgbmV3VmFsdWUpIHtcbiAgLy8gUHJvbWlzZSBSZXNvbHV0aW9uIFByb2NlZHVyZTogaHR0cHM6Ly9naXRodWIuY29tL3Byb21pc2VzLWFwbHVzL3Byb21pc2VzLXNwZWMjdGhlLXByb21pc2UtcmVzb2x1dGlvbi1wcm9jZWR1cmVcbiAgaWYgKG5ld1ZhbHVlID09PSBzZWxmKSB7XG4gICAgcmV0dXJuIHJlamVjdChcbiAgICAgIHNlbGYsXG4gICAgICBuZXcgVHlwZUVycm9yKCdBIHByb21pc2UgY2Fubm90IGJlIHJlc29sdmVkIHdpdGggaXRzZWxmLicpXG4gICAgKTtcbiAgfVxuICBpZiAoXG4gICAgbmV3VmFsdWUgJiZcbiAgICAodHlwZW9mIG5ld1ZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgbmV3VmFsdWUgPT09ICdmdW5jdGlvbicpXG4gICkge1xuICAgIHZhciB0aGVuID0gZ2V0VGhlbihuZXdWYWx1ZSk7XG4gICAgaWYgKHRoZW4gPT09IElTX0VSUk9SKSB7XG4gICAgICByZXR1cm4gcmVqZWN0KHNlbGYsIExBU1RfRVJST1IpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICB0aGVuID09PSBzZWxmLnRoZW4gJiZcbiAgICAgIG5ld1ZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZVxuICAgICkge1xuICAgICAgc2VsZi5fMzcgPSAzO1xuICAgICAgc2VsZi5fMTIgPSBuZXdWYWx1ZTtcbiAgICAgIGZpbmFsZShzZWxmKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBkb1Jlc29sdmUodGhlbi5iaW5kKG5ld1ZhbHVlKSwgc2VsZik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIHNlbGYuXzM3ID0gMTtcbiAgc2VsZi5fMTIgPSBuZXdWYWx1ZTtcbiAgZmluYWxlKHNlbGYpO1xufVxuXG5mdW5jdGlvbiByZWplY3Qoc2VsZiwgbmV3VmFsdWUpIHtcbiAgc2VsZi5fMzcgPSAyO1xuICBzZWxmLl8xMiA9IG5ld1ZhbHVlO1xuICBmaW5hbGUoc2VsZik7XG59XG5mdW5jdGlvbiBmaW5hbGUoc2VsZikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuXzU5Lmxlbmd0aDsgaSsrKSB7XG4gICAgaGFuZGxlKHNlbGYsIHNlbGYuXzU5W2ldKTtcbiAgfVxuICBzZWxmLl81OSA9IG51bGw7XG59XG5cbmZ1bmN0aW9uIEhhbmRsZXIob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHByb21pc2Upe1xuICB0aGlzLm9uRnVsZmlsbGVkID0gdHlwZW9mIG9uRnVsZmlsbGVkID09PSAnZnVuY3Rpb24nID8gb25GdWxmaWxsZWQgOiBudWxsO1xuICB0aGlzLm9uUmVqZWN0ZWQgPSB0eXBlb2Ygb25SZWplY3RlZCA9PT0gJ2Z1bmN0aW9uJyA/IG9uUmVqZWN0ZWQgOiBudWxsO1xuICB0aGlzLnByb21pc2UgPSBwcm9taXNlO1xufVxuXG4vKipcbiAqIFRha2UgYSBwb3RlbnRpYWxseSBtaXNiZWhhdmluZyByZXNvbHZlciBmdW5jdGlvbiBhbmQgbWFrZSBzdXJlXG4gKiBvbkZ1bGZpbGxlZCBhbmQgb25SZWplY3RlZCBhcmUgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBNYWtlcyBubyBndWFyYW50ZWVzIGFib3V0IGFzeW5jaHJvbnkuXG4gKi9cbmZ1bmN0aW9uIGRvUmVzb2x2ZShmbiwgcHJvbWlzZSkge1xuICB2YXIgZG9uZSA9IGZhbHNlO1xuICB2YXIgcmVzID0gdHJ5Q2FsbFR3byhmbiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKGRvbmUpIHJldHVybjtcbiAgICBkb25lID0gdHJ1ZTtcbiAgICByZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIGlmIChkb25lKSByZXR1cm47XG4gICAgZG9uZSA9IHRydWU7XG4gICAgcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gIH0pXG4gIGlmICghZG9uZSAmJiByZXMgPT09IElTX0VSUk9SKSB7XG4gICAgZG9uZSA9IHRydWU7XG4gICAgcmVqZWN0KHByb21pc2UsIExBU1RfRVJST1IpO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZTtcblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgdmFyIHNlbGYgPSBhcmd1bWVudHMubGVuZ3RoID8gdGhpcy50aGVuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgOiB0aGlzO1xuICBzZWxmLnRoZW4obnVsbCwgZnVuY3Rpb24gKGVycikge1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH0sIDApO1xuICB9KTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBFUzYgZXh0ZW5zaW9ucyB0byB0aGUgY29yZSBQcm9taXNlcy9BKyBBUElcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlO1xuXG4vKiBTdGF0aWMgRnVuY3Rpb25zICovXG5cbnZhciBUUlVFID0gdmFsdWVQcm9taXNlKHRydWUpO1xudmFyIEZBTFNFID0gdmFsdWVQcm9taXNlKGZhbHNlKTtcbnZhciBOVUxMID0gdmFsdWVQcm9taXNlKG51bGwpO1xudmFyIFVOREVGSU5FRCA9IHZhbHVlUHJvbWlzZSh1bmRlZmluZWQpO1xudmFyIFpFUk8gPSB2YWx1ZVByb21pc2UoMCk7XG52YXIgRU1QVFlTVFJJTkcgPSB2YWx1ZVByb21pc2UoJycpO1xuXG5mdW5jdGlvbiB2YWx1ZVByb21pc2UodmFsdWUpIHtcbiAgdmFyIHAgPSBuZXcgUHJvbWlzZShQcm9taXNlLl85OSk7XG4gIHAuXzM3ID0gMTtcbiAgcC5fMTIgPSB2YWx1ZTtcbiAgcmV0dXJuIHA7XG59XG5Qcm9taXNlLnJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkgcmV0dXJuIHZhbHVlO1xuXG4gIGlmICh2YWx1ZSA9PT0gbnVsbCkgcmV0dXJuIE5VTEw7XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gVU5ERUZJTkVEO1xuICBpZiAodmFsdWUgPT09IHRydWUpIHJldHVybiBUUlVFO1xuICBpZiAodmFsdWUgPT09IGZhbHNlKSByZXR1cm4gRkFMU0U7XG4gIGlmICh2YWx1ZSA9PT0gMCkgcmV0dXJuIFpFUk87XG4gIGlmICh2YWx1ZSA9PT0gJycpIHJldHVybiBFTVBUWVNUUklORztcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIHRoZW4gPSB2YWx1ZS50aGVuO1xuICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSh0aGVuLmJpbmQodmFsdWUpKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWVQcm9taXNlKHZhbHVlKTtcbn07XG5cblByb21pc2UuYWxsID0gZnVuY3Rpb24gKGFycikge1xuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFycik7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDApIHJldHVybiByZXNvbHZlKFtdKTtcbiAgICB2YXIgcmVtYWluaW5nID0gYXJncy5sZW5ndGg7XG4gICAgZnVuY3Rpb24gcmVzKGksIHZhbCkge1xuICAgICAgaWYgKHZhbCAmJiAodHlwZW9mIHZhbCA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbCA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIFByb21pc2UgJiYgdmFsLnRoZW4gPT09IFByb21pc2UucHJvdG90eXBlLnRoZW4pIHtcbiAgICAgICAgICB3aGlsZSAodmFsLl8zNyA9PT0gMykge1xuICAgICAgICAgICAgdmFsID0gdmFsLl8xMjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHZhbC5fMzcgPT09IDEpIHJldHVybiByZXMoaSwgdmFsLl8xMik7XG4gICAgICAgICAgaWYgKHZhbC5fMzcgPT09IDIpIHJlamVjdCh2YWwuXzEyKTtcbiAgICAgICAgICB2YWwudGhlbihmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICByZXMoaSwgdmFsKTtcbiAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgdGhlbiA9IHZhbC50aGVuO1xuICAgICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdmFyIHAgPSBuZXcgUHJvbWlzZSh0aGVuLmJpbmQodmFsKSk7XG4gICAgICAgICAgICBwLnRoZW4oZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICByZXMoaSwgdmFsKTtcbiAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhcmdzW2ldID0gdmFsO1xuICAgICAgaWYgKC0tcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgIHJlc29sdmUoYXJncyk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzKGksIGFyZ3NbaV0pO1xuICAgIH1cbiAgfSk7XG59O1xuXG5Qcm9taXNlLnJlamVjdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHJlamVjdCh2YWx1ZSk7XG4gIH0pO1xufTtcblxuUHJvbWlzZS5yYWNlID0gZnVuY3Rpb24gKHZhbHVlcykge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgIFByb21pc2UucmVzb2x2ZSh2YWx1ZSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbi8qIFByb3RvdHlwZSBNZXRob2RzICovXG5cblByb21pc2UucHJvdG90eXBlWydjYXRjaCddID0gZnVuY3Rpb24gKG9uUmVqZWN0ZWQpIHtcbiAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGVkKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZTtcblByb21pc2UucHJvdG90eXBlWydmaW5hbGx5J10gPSBmdW5jdGlvbiAoZikge1xuICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZigpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9KTtcbiAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZigpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9KTtcbiAgfSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xucmVxdWlyZSgnLi9kb25lLmpzJyk7XG5yZXF1aXJlKCcuL2ZpbmFsbHkuanMnKTtcbnJlcXVpcmUoJy4vZXM2LWV4dGVuc2lvbnMuanMnKTtcbnJlcXVpcmUoJy4vbm9kZS1leHRlbnNpb25zLmpzJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIFRoaXMgZmlsZSBjb250YWlucyB0aGVuL3Byb21pc2Ugc3BlY2lmaWMgZXh0ZW5zaW9ucyB0aGF0IGFyZSBvbmx5IHVzZWZ1bFxuLy8gZm9yIG5vZGUuanMgaW50ZXJvcFxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xudmFyIGFzYXAgPSByZXF1aXJlKCdhc2FwJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZTtcblxuLyogU3RhdGljIEZ1bmN0aW9ucyAqL1xuXG5Qcm9taXNlLmRlbm9kZWlmeSA9IGZ1bmN0aW9uIChmbiwgYXJndW1lbnRDb3VudCkge1xuICBhcmd1bWVudENvdW50ID0gYXJndW1lbnRDb3VudCB8fCBJbmZpbml0eTtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsXG4gICAgICAgIGFyZ3VtZW50Q291bnQgPiAwID8gYXJndW1lbnRDb3VudCA6IDApO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBhcmdzLnB1c2goZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgIGlmIChlcnIpIHJlamVjdChlcnIpO1xuICAgICAgICBlbHNlIHJlc29sdmUocmVzKTtcbiAgICAgIH0pXG4gICAgICB2YXIgcmVzID0gZm4uYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICBpZiAocmVzICYmXG4gICAgICAgIChcbiAgICAgICAgICB0eXBlb2YgcmVzID09PSAnb2JqZWN0JyB8fFxuICAgICAgICAgIHR5cGVvZiByZXMgPT09ICdmdW5jdGlvbidcbiAgICAgICAgKSAmJlxuICAgICAgICB0eXBlb2YgcmVzLnRoZW4gPT09ICdmdW5jdGlvbidcbiAgICAgICkge1xuICAgICAgICByZXNvbHZlKHJlcyk7XG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuUHJvbWlzZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgIHZhciBjYWxsYmFjayA9XG4gICAgICB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09PSAnZnVuY3Rpb24nID8gYXJncy5wb3AoKSA6IG51bGw7XG4gICAgdmFyIGN0eCA9IHRoaXM7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLm5vZGVpZnkoY2FsbGJhY2ssIGN0eCk7XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIGlmIChjYWxsYmFjayA9PT0gbnVsbCB8fCB0eXBlb2YgY2FsbGJhY2sgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICByZWplY3QoZXgpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNhbGxiYWNrLmNhbGwoY3R4LCBleCk7XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblByb21pc2UucHJvdG90eXBlLm5vZGVpZnkgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGN0eCkge1xuICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdmdW5jdGlvbicpIHJldHVybiB0aGlzO1xuXG4gIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrLmNhbGwoY3R4LCBudWxsLCB2YWx1ZSk7XG4gICAgfSk7XG4gIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrLmNhbGwoY3R4LCBlcnIpO1xuICAgIH0pO1xuICB9KTtcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vLyByYXdBc2FwIHByb3ZpZGVzIGV2ZXJ5dGhpbmcgd2UgbmVlZCBleGNlcHQgZXhjZXB0aW9uIG1hbmFnZW1lbnQuXG52YXIgcmF3QXNhcCA9IHJlcXVpcmUoXCIuL3Jhd1wiKTtcbi8vIFJhd1Rhc2tzIGFyZSByZWN5Y2xlZCB0byByZWR1Y2UgR0MgY2h1cm4uXG52YXIgZnJlZVRhc2tzID0gW107XG4vLyBXZSBxdWV1ZSBlcnJvcnMgdG8gZW5zdXJlIHRoZXkgYXJlIHRocm93biBpbiByaWdodCBvcmRlciAoRklGTykuXG4vLyBBcnJheS1hcy1xdWV1ZSBpcyBnb29kIGVub3VnaCBoZXJlLCBzaW5jZSB3ZSBhcmUganVzdCBkZWFsaW5nIHdpdGggZXhjZXB0aW9ucy5cbnZhciBwZW5kaW5nRXJyb3JzID0gW107XG52YXIgcmVxdWVzdEVycm9yVGhyb3cgPSByYXdBc2FwLm1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcih0aHJvd0ZpcnN0RXJyb3IpO1xuXG5mdW5jdGlvbiB0aHJvd0ZpcnN0RXJyb3IoKSB7XG4gICAgaWYgKHBlbmRpbmdFcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IHBlbmRpbmdFcnJvcnMuc2hpZnQoKTtcbiAgICB9XG59XG5cbi8qKlxuICogQ2FsbHMgYSB0YXNrIGFzIHNvb24gYXMgcG9zc2libGUgYWZ0ZXIgcmV0dXJuaW5nLCBpbiBpdHMgb3duIGV2ZW50LCB3aXRoIHByaW9yaXR5XG4gKiBvdmVyIG90aGVyIGV2ZW50cyBsaWtlIGFuaW1hdGlvbiwgcmVmbG93LCBhbmQgcmVwYWludC4gQW4gZXJyb3IgdGhyb3duIGZyb20gYW5cbiAqIGV2ZW50IHdpbGwgbm90IGludGVycnVwdCwgbm9yIGV2ZW4gc3Vic3RhbnRpYWxseSBzbG93IGRvd24gdGhlIHByb2Nlc3Npbmcgb2ZcbiAqIG90aGVyIGV2ZW50cywgYnV0IHdpbGwgYmUgcmF0aGVyIHBvc3Rwb25lZCB0byBhIGxvd2VyIHByaW9yaXR5IGV2ZW50LlxuICogQHBhcmFtIHt7Y2FsbH19IHRhc2sgQSBjYWxsYWJsZSBvYmplY3QsIHR5cGljYWxseSBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgbm9cbiAqIGFyZ3VtZW50cy5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBhc2FwO1xuZnVuY3Rpb24gYXNhcCh0YXNrKSB7XG4gICAgdmFyIHJhd1Rhc2s7XG4gICAgaWYgKGZyZWVUYXNrcy5sZW5ndGgpIHtcbiAgICAgICAgcmF3VGFzayA9IGZyZWVUYXNrcy5wb3AoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByYXdUYXNrID0gbmV3IFJhd1Rhc2soKTtcbiAgICB9XG4gICAgcmF3VGFzay50YXNrID0gdGFzaztcbiAgICByYXdBc2FwKHJhd1Rhc2spO1xufVxuXG4vLyBXZSB3cmFwIHRhc2tzIHdpdGggcmVjeWNsYWJsZSB0YXNrIG9iamVjdHMuICBBIHRhc2sgb2JqZWN0IGltcGxlbWVudHNcbi8vIGBjYWxsYCwganVzdCBsaWtlIGEgZnVuY3Rpb24uXG5mdW5jdGlvbiBSYXdUYXNrKCkge1xuICAgIHRoaXMudGFzayA9IG51bGw7XG59XG5cbi8vIFRoZSBzb2xlIHB1cnBvc2Ugb2Ygd3JhcHBpbmcgdGhlIHRhc2sgaXMgdG8gY2F0Y2ggdGhlIGV4Y2VwdGlvbiBhbmQgcmVjeWNsZVxuLy8gdGhlIHRhc2sgb2JqZWN0IGFmdGVyIGl0cyBzaW5nbGUgdXNlLlxuUmF3VGFzay5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICB0aGlzLnRhc2suY2FsbCgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGlmIChhc2FwLm9uZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaG9vayBleGlzdHMgcHVyZWx5IGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuICAgICAgICAgICAgLy8gSXRzIG5hbWUgd2lsbCBiZSBwZXJpb2RpY2FsbHkgcmFuZG9taXplZCB0byBicmVhayBhbnkgY29kZSB0aGF0XG4gICAgICAgICAgICAvLyBkZXBlbmRzIG9uIGl0cyBleGlzdGVuY2UuXG4gICAgICAgICAgICBhc2FwLm9uZXJyb3IoZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSW4gYSB3ZWIgYnJvd3NlciwgZXhjZXB0aW9ucyBhcmUgbm90IGZhdGFsLiBIb3dldmVyLCB0byBhdm9pZFxuICAgICAgICAgICAgLy8gc2xvd2luZyBkb3duIHRoZSBxdWV1ZSBvZiBwZW5kaW5nIHRhc2tzLCB3ZSByZXRocm93IHRoZSBlcnJvciBpbiBhXG4gICAgICAgICAgICAvLyBsb3dlciBwcmlvcml0eSB0dXJuLlxuICAgICAgICAgICAgcGVuZGluZ0Vycm9ycy5wdXNoKGVycm9yKTtcbiAgICAgICAgICAgIHJlcXVlc3RFcnJvclRocm93KCk7XG4gICAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgICB0aGlzLnRhc2sgPSBudWxsO1xuICAgICAgICBmcmVlVGFza3NbZnJlZVRhc2tzLmxlbmd0aF0gPSB0aGlzO1xuICAgIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLy8gVXNlIHRoZSBmYXN0ZXN0IG1lYW5zIHBvc3NpYmxlIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGl0cyBvd24gdHVybiwgd2l0aFxuLy8gcHJpb3JpdHkgb3ZlciBvdGhlciBldmVudHMgaW5jbHVkaW5nIElPLCBhbmltYXRpb24sIHJlZmxvdywgYW5kIHJlZHJhd1xuLy8gZXZlbnRzIGluIGJyb3dzZXJzLlxuLy9cbi8vIEFuIGV4Y2VwdGlvbiB0aHJvd24gYnkgYSB0YXNrIHdpbGwgcGVybWFuZW50bHkgaW50ZXJydXB0IHRoZSBwcm9jZXNzaW5nIG9mXG4vLyBzdWJzZXF1ZW50IHRhc2tzLiBUaGUgaGlnaGVyIGxldmVsIGBhc2FwYCBmdW5jdGlvbiBlbnN1cmVzIHRoYXQgaWYgYW5cbi8vIGV4Y2VwdGlvbiBpcyB0aHJvd24gYnkgYSB0YXNrLCB0aGF0IHRoZSB0YXNrIHF1ZXVlIHdpbGwgY29udGludWUgZmx1c2hpbmcgYXNcbi8vIHNvb24gYXMgcG9zc2libGUsIGJ1dCBpZiB5b3UgdXNlIGByYXdBc2FwYCBkaXJlY3RseSwgeW91IGFyZSByZXNwb25zaWJsZSB0b1xuLy8gZWl0aGVyIGVuc3VyZSB0aGF0IG5vIGV4Y2VwdGlvbnMgYXJlIHRocm93biBmcm9tIHlvdXIgdGFzaywgb3IgdG8gbWFudWFsbHlcbi8vIGNhbGwgYHJhd0FzYXAucmVxdWVzdEZsdXNoYCBpZiBhbiBleGNlcHRpb24gaXMgdGhyb3duLlxubW9kdWxlLmV4cG9ydHMgPSByYXdBc2FwO1xuZnVuY3Rpb24gcmF3QXNhcCh0YXNrKSB7XG4gICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcmVxdWVzdEZsdXNoKCk7XG4gICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICB9XG4gICAgLy8gRXF1aXZhbGVudCB0byBwdXNoLCBidXQgYXZvaWRzIGEgZnVuY3Rpb24gY2FsbC5cbiAgICBxdWV1ZVtxdWV1ZS5sZW5ndGhdID0gdGFzaztcbn1cblxudmFyIHF1ZXVlID0gW107XG4vLyBPbmNlIGEgZmx1c2ggaGFzIGJlZW4gcmVxdWVzdGVkLCBubyBmdXJ0aGVyIGNhbGxzIHRvIGByZXF1ZXN0Rmx1c2hgIGFyZVxuLy8gbmVjZXNzYXJ5IHVudGlsIHRoZSBuZXh0IGBmbHVzaGAgY29tcGxldGVzLlxudmFyIGZsdXNoaW5nID0gZmFsc2U7XG4vLyBgcmVxdWVzdEZsdXNoYCBpcyBhbiBpbXBsZW1lbnRhdGlvbi1zcGVjaWZpYyBtZXRob2QgdGhhdCBhdHRlbXB0cyB0byBraWNrXG4vLyBvZmYgYSBgZmx1c2hgIGV2ZW50IGFzIHF1aWNrbHkgYXMgcG9zc2libGUuIGBmbHVzaGAgd2lsbCBhdHRlbXB0IHRvIGV4aGF1c3Rcbi8vIHRoZSBldmVudCBxdWV1ZSBiZWZvcmUgeWllbGRpbmcgdG8gdGhlIGJyb3dzZXIncyBvd24gZXZlbnQgbG9vcC5cbnZhciByZXF1ZXN0Rmx1c2g7XG4vLyBUaGUgcG9zaXRpb24gb2YgdGhlIG5leHQgdGFzayB0byBleGVjdXRlIGluIHRoZSB0YXNrIHF1ZXVlLiBUaGlzIGlzXG4vLyBwcmVzZXJ2ZWQgYmV0d2VlbiBjYWxscyB0byBgZmx1c2hgIHNvIHRoYXQgaXQgY2FuIGJlIHJlc3VtZWQgaWZcbi8vIGEgdGFzayB0aHJvd3MgYW4gZXhjZXB0aW9uLlxudmFyIGluZGV4ID0gMDtcbi8vIElmIGEgdGFzayBzY2hlZHVsZXMgYWRkaXRpb25hbCB0YXNrcyByZWN1cnNpdmVseSwgdGhlIHRhc2sgcXVldWUgY2FuIGdyb3dcbi8vIHVuYm91bmRlZC4gVG8gcHJldmVudCBtZW1vcnkgZXhoYXVzdGlvbiwgdGhlIHRhc2sgcXVldWUgd2lsbCBwZXJpb2RpY2FsbHlcbi8vIHRydW5jYXRlIGFscmVhZHktY29tcGxldGVkIHRhc2tzLlxudmFyIGNhcGFjaXR5ID0gMTAyNDtcblxuLy8gVGhlIGZsdXNoIGZ1bmN0aW9uIHByb2Nlc3NlcyBhbGwgdGFza3MgdGhhdCBoYXZlIGJlZW4gc2NoZWR1bGVkIHdpdGhcbi8vIGByYXdBc2FwYCB1bmxlc3MgYW5kIHVudGlsIG9uZSBvZiB0aG9zZSB0YXNrcyB0aHJvd3MgYW4gZXhjZXB0aW9uLlxuLy8gSWYgYSB0YXNrIHRocm93cyBhbiBleGNlcHRpb24sIGBmbHVzaGAgZW5zdXJlcyB0aGF0IGl0cyBzdGF0ZSB3aWxsIHJlbWFpblxuLy8gY29uc2lzdGVudCBhbmQgd2lsbCByZXN1bWUgd2hlcmUgaXQgbGVmdCBvZmYgd2hlbiBjYWxsZWQgYWdhaW4uXG4vLyBIb3dldmVyLCBgZmx1c2hgIGRvZXMgbm90IG1ha2UgYW55IGFycmFuZ2VtZW50cyB0byBiZSBjYWxsZWQgYWdhaW4gaWYgYW5cbi8vIGV4Y2VwdGlvbiBpcyB0aHJvd24uXG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgICB3aGlsZSAoaW5kZXggPCBxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRJbmRleCA9IGluZGV4O1xuICAgICAgICAvLyBBZHZhbmNlIHRoZSBpbmRleCBiZWZvcmUgY2FsbGluZyB0aGUgdGFzay4gVGhpcyBlbnN1cmVzIHRoYXQgd2Ugd2lsbFxuICAgICAgICAvLyBiZWdpbiBmbHVzaGluZyBvbiB0aGUgbmV4dCB0YXNrIHRoZSB0YXNrIHRocm93cyBhbiBlcnJvci5cbiAgICAgICAgaW5kZXggPSBpbmRleCArIDE7XG4gICAgICAgIHF1ZXVlW2N1cnJlbnRJbmRleF0uY2FsbCgpO1xuICAgICAgICAvLyBQcmV2ZW50IGxlYWtpbmcgbWVtb3J5IGZvciBsb25nIGNoYWlucyBvZiByZWN1cnNpdmUgY2FsbHMgdG8gYGFzYXBgLlxuICAgICAgICAvLyBJZiB3ZSBjYWxsIGBhc2FwYCB3aXRoaW4gdGFza3Mgc2NoZWR1bGVkIGJ5IGBhc2FwYCwgdGhlIHF1ZXVlIHdpbGxcbiAgICAgICAgLy8gZ3JvdywgYnV0IHRvIGF2b2lkIGFuIE8obikgd2FsayBmb3IgZXZlcnkgdGFzayB3ZSBleGVjdXRlLCB3ZSBkb24ndFxuICAgICAgICAvLyBzaGlmdCB0YXNrcyBvZmYgdGhlIHF1ZXVlIGFmdGVyIHRoZXkgaGF2ZSBiZWVuIGV4ZWN1dGVkLlxuICAgICAgICAvLyBJbnN0ZWFkLCB3ZSBwZXJpb2RpY2FsbHkgc2hpZnQgMTAyNCB0YXNrcyBvZmYgdGhlIHF1ZXVlLlxuICAgICAgICBpZiAoaW5kZXggPiBjYXBhY2l0eSkge1xuICAgICAgICAgICAgLy8gTWFudWFsbHkgc2hpZnQgYWxsIHZhbHVlcyBzdGFydGluZyBhdCB0aGUgaW5kZXggYmFjayB0byB0aGVcbiAgICAgICAgICAgIC8vIGJlZ2lubmluZyBvZiB0aGUgcXVldWUuXG4gICAgICAgICAgICBmb3IgKHZhciBzY2FuID0gMCwgbmV3TGVuZ3RoID0gcXVldWUubGVuZ3RoIC0gaW5kZXg7IHNjYW4gPCBuZXdMZW5ndGg7IHNjYW4rKykge1xuICAgICAgICAgICAgICAgIHF1ZXVlW3NjYW5dID0gcXVldWVbc2NhbiArIGluZGV4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHF1ZXVlLmxlbmd0aCAtPSBpbmRleDtcbiAgICAgICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICAgIGluZGV4ID0gMDtcbiAgICBmbHVzaGluZyA9IGZhbHNlO1xufVxuXG4vLyBgcmVxdWVzdEZsdXNoYCBpcyBpbXBsZW1lbnRlZCB1c2luZyBhIHN0cmF0ZWd5IGJhc2VkIG9uIGRhdGEgY29sbGVjdGVkIGZyb21cbi8vIGV2ZXJ5IGF2YWlsYWJsZSBTYXVjZUxhYnMgU2VsZW5pdW0gd2ViIGRyaXZlciB3b3JrZXIgYXQgdGltZSBvZiB3cml0aW5nLlxuLy8gaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMW1HLTVVWUd1cDVxeEdkRU1Xa2hQNkJXQ3owNTNOVWIyRTFRb1VUVTE2dUEvZWRpdCNnaWQ9NzgzNzI0NTkzXG5cbi8vIFNhZmFyaSA2IGFuZCA2LjEgZm9yIGRlc2t0b3AsIGlQYWQsIGFuZCBpUGhvbmUgYXJlIHRoZSBvbmx5IGJyb3dzZXJzIHRoYXRcbi8vIGhhdmUgV2ViS2l0TXV0YXRpb25PYnNlcnZlciBidXQgbm90IHVuLXByZWZpeGVkIE11dGF0aW9uT2JzZXJ2ZXIuXG4vLyBNdXN0IHVzZSBgZ2xvYmFsYCBpbnN0ZWFkIG9mIGB3aW5kb3dgIHRvIHdvcmsgaW4gYm90aCBmcmFtZXMgYW5kIHdlYlxuLy8gd29ya2Vycy4gYGdsb2JhbGAgaXMgYSBwcm92aXNpb24gb2YgQnJvd3NlcmlmeSwgTXIsIE1ycywgb3IgTW9wLlxudmFyIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gZ2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIgfHwgZ2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG5cbi8vIE11dGF0aW9uT2JzZXJ2ZXJzIGFyZSBkZXNpcmFibGUgYmVjYXVzZSB0aGV5IGhhdmUgaGlnaCBwcmlvcml0eSBhbmQgd29ya1xuLy8gcmVsaWFibHkgZXZlcnl3aGVyZSB0aGV5IGFyZSBpbXBsZW1lbnRlZC5cbi8vIFRoZXkgYXJlIGltcGxlbWVudGVkIGluIGFsbCBtb2Rlcm4gYnJvd3NlcnMuXG4vL1xuLy8gLSBBbmRyb2lkIDQtNC4zXG4vLyAtIENocm9tZSAyNi0zNFxuLy8gLSBGaXJlZm94IDE0LTI5XG4vLyAtIEludGVybmV0IEV4cGxvcmVyIDExXG4vLyAtIGlQYWQgU2FmYXJpIDYtNy4xXG4vLyAtIGlQaG9uZSBTYWZhcmkgNy03LjFcbi8vIC0gU2FmYXJpIDYtN1xuaWYgKHR5cGVvZiBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgcmVxdWVzdEZsdXNoID0gbWFrZVJlcXVlc3RDYWxsRnJvbU11dGF0aW9uT2JzZXJ2ZXIoZmx1c2gpO1xuXG4vLyBNZXNzYWdlQ2hhbm5lbHMgYXJlIGRlc2lyYWJsZSBiZWNhdXNlIHRoZXkgZ2l2ZSBkaXJlY3QgYWNjZXNzIHRvIHRoZSBIVE1MXG4vLyB0YXNrIHF1ZXVlLCBhcmUgaW1wbGVtZW50ZWQgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAsIFNhZmFyaSA1LjAtMSwgYW5kIE9wZXJhXG4vLyAxMS0xMiwgYW5kIGluIHdlYiB3b3JrZXJzIGluIG1hbnkgZW5naW5lcy5cbi8vIEFsdGhvdWdoIG1lc3NhZ2UgY2hhbm5lbHMgeWllbGQgdG8gYW55IHF1ZXVlZCByZW5kZXJpbmcgYW5kIElPIHRhc2tzLCB0aGV5XG4vLyB3b3VsZCBiZSBiZXR0ZXIgdGhhbiBpbXBvc2luZyB0aGUgNG1zIGRlbGF5IG9mIHRpbWVycy5cbi8vIEhvd2V2ZXIsIHRoZXkgZG8gbm90IHdvcmsgcmVsaWFibHkgaW4gSW50ZXJuZXQgRXhwbG9yZXIgb3IgU2FmYXJpLlxuXG4vLyBJbnRlcm5ldCBFeHBsb3JlciAxMCBpcyB0aGUgb25seSBicm93c2VyIHRoYXQgaGFzIHNldEltbWVkaWF0ZSBidXQgZG9lc1xuLy8gbm90IGhhdmUgTXV0YXRpb25PYnNlcnZlcnMuXG4vLyBBbHRob3VnaCBzZXRJbW1lZGlhdGUgeWllbGRzIHRvIHRoZSBicm93c2VyJ3MgcmVuZGVyZXIsIGl0IHdvdWxkIGJlXG4vLyBwcmVmZXJyYWJsZSB0byBmYWxsaW5nIGJhY2sgdG8gc2V0VGltZW91dCBzaW5jZSBpdCBkb2VzIG5vdCBoYXZlXG4vLyB0aGUgbWluaW11bSA0bXMgcGVuYWx0eS5cbi8vIFVuZm9ydHVuYXRlbHkgdGhlcmUgYXBwZWFycyB0byBiZSBhIGJ1ZyBpbiBJbnRlcm5ldCBFeHBsb3JlciAxMCBNb2JpbGUgKGFuZFxuLy8gRGVza3RvcCB0byBhIGxlc3NlciBleHRlbnQpIHRoYXQgcmVuZGVycyBib3RoIHNldEltbWVkaWF0ZSBhbmRcbi8vIE1lc3NhZ2VDaGFubmVsIHVzZWxlc3MgZm9yIHRoZSBwdXJwb3NlcyBvZiBBU0FQLlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9xL2lzc3Vlcy8zOTZcblxuLy8gVGltZXJzIGFyZSBpbXBsZW1lbnRlZCB1bml2ZXJzYWxseS5cbi8vIFdlIGZhbGwgYmFjayB0byB0aW1lcnMgaW4gd29ya2VycyBpbiBtb3N0IGVuZ2luZXMsIGFuZCBpbiBmb3JlZ3JvdW5kXG4vLyBjb250ZXh0cyBpbiB0aGUgZm9sbG93aW5nIGJyb3dzZXJzLlxuLy8gSG93ZXZlciwgbm90ZSB0aGF0IGV2ZW4gdGhpcyBzaW1wbGUgY2FzZSByZXF1aXJlcyBudWFuY2VzIHRvIG9wZXJhdGUgaW4gYVxuLy8gYnJvYWQgc3BlY3RydW0gb2YgYnJvd3NlcnMuXG4vL1xuLy8gLSBGaXJlZm94IDMtMTNcbi8vIC0gSW50ZXJuZXQgRXhwbG9yZXIgNi05XG4vLyAtIGlQYWQgU2FmYXJpIDQuM1xuLy8gLSBMeW54IDIuOC43XG59IGVsc2Uge1xuICAgIHJlcXVlc3RGbHVzaCA9IG1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcihmbHVzaCk7XG59XG5cbi8vIGByZXF1ZXN0Rmx1c2hgIHJlcXVlc3RzIHRoYXQgdGhlIGhpZ2ggcHJpb3JpdHkgZXZlbnQgcXVldWUgYmUgZmx1c2hlZCBhc1xuLy8gc29vbiBhcyBwb3NzaWJsZS5cbi8vIFRoaXMgaXMgdXNlZnVsIHRvIHByZXZlbnQgYW4gZXJyb3IgdGhyb3duIGluIGEgdGFzayBmcm9tIHN0YWxsaW5nIHRoZSBldmVudFxuLy8gcXVldWUgaWYgdGhlIGV4Y2VwdGlvbiBoYW5kbGVkIGJ5IE5vZGUuanPigJlzXG4vLyBgcHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIpYCBvciBieSBhIGRvbWFpbi5cbnJhd0FzYXAucmVxdWVzdEZsdXNoID0gcmVxdWVzdEZsdXNoO1xuXG4vLyBUbyByZXF1ZXN0IGEgaGlnaCBwcmlvcml0eSBldmVudCwgd2UgaW5kdWNlIGEgbXV0YXRpb24gb2JzZXJ2ZXIgYnkgdG9nZ2xpbmdcbi8vIHRoZSB0ZXh0IG9mIGEgdGV4dCBub2RlIGJldHdlZW4gXCIxXCIgYW5kIFwiLTFcIi5cbmZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21NdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKSB7XG4gICAgdmFyIHRvZ2dsZSA9IDE7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKTtcbiAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwge2NoYXJhY3RlckRhdGE6IHRydWV9KTtcbiAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG4gICAgICAgIHRvZ2dsZSA9IC10b2dnbGU7XG4gICAgICAgIG5vZGUuZGF0YSA9IHRvZ2dsZTtcbiAgICB9O1xufVxuXG4vLyBUaGUgbWVzc2FnZSBjaGFubmVsIHRlY2huaXF1ZSB3YXMgZGlzY292ZXJlZCBieSBNYWx0ZSBVYmwgYW5kIHdhcyB0aGVcbi8vIG9yaWdpbmFsIGZvdW5kYXRpb24gZm9yIHRoaXMgbGlicmFyeS5cbi8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG5cbi8vIFNhZmFyaSA2LjAuNSAoYXQgbGVhc3QpIGludGVybWl0dGVudGx5IGZhaWxzIHRvIGNyZWF0ZSBtZXNzYWdlIHBvcnRzIG9uIGFcbi8vIHBhZ2UncyBmaXJzdCBsb2FkLiBUaGFua2Z1bGx5LCB0aGlzIHZlcnNpb24gb2YgU2FmYXJpIHN1cHBvcnRzXG4vLyBNdXRhdGlvbk9ic2VydmVycywgc28gd2UgZG9uJ3QgbmVlZCB0byBmYWxsIGJhY2sgaW4gdGhhdCBjYXNlLlxuXG4vLyBmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tTWVzc2FnZUNoYW5uZWwoY2FsbGJhY2spIHtcbi8vICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuLy8gICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gY2FsbGJhY2s7XG4vLyAgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuLy8gICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuLy8gICAgIH07XG4vLyB9XG5cbi8vIEZvciByZWFzb25zIGV4cGxhaW5lZCBhYm92ZSwgd2UgYXJlIGFsc28gdW5hYmxlIHRvIHVzZSBgc2V0SW1tZWRpYXRlYFxuLy8gdW5kZXIgYW55IGNpcmN1bXN0YW5jZXMuXG4vLyBFdmVuIGlmIHdlIHdlcmUsIHRoZXJlIGlzIGFub3RoZXIgYnVnIGluIEludGVybmV0IEV4cGxvcmVyIDEwLlxuLy8gSXQgaXMgbm90IHN1ZmZpY2llbnQgdG8gYXNzaWduIGBzZXRJbW1lZGlhdGVgIHRvIGByZXF1ZXN0Rmx1c2hgIGJlY2F1c2Vcbi8vIGBzZXRJbW1lZGlhdGVgIG11c3QgYmUgY2FsbGVkICpieSBuYW1lKiBhbmQgdGhlcmVmb3JlIG11c3QgYmUgd3JhcHBlZCBpbiBhXG4vLyBjbG9zdXJlLlxuLy8gTmV2ZXIgZm9yZ2V0LlxuXG4vLyBmdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tU2V0SW1tZWRpYXRlKGNhbGxiYWNrKSB7XG4vLyAgICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuLy8gICAgICAgICBzZXRJbW1lZGlhdGUoY2FsbGJhY2spO1xuLy8gICAgIH07XG4vLyB9XG5cbi8vIFNhZmFyaSA2LjAgaGFzIGEgcHJvYmxlbSB3aGVyZSB0aW1lcnMgd2lsbCBnZXQgbG9zdCB3aGlsZSB0aGUgdXNlciBpc1xuLy8gc2Nyb2xsaW5nLiBUaGlzIHByb2JsZW0gZG9lcyBub3QgaW1wYWN0IEFTQVAgYmVjYXVzZSBTYWZhcmkgNi4wIHN1cHBvcnRzXG4vLyBtdXRhdGlvbiBvYnNlcnZlcnMsIHNvIHRoYXQgaW1wbGVtZW50YXRpb24gaXMgdXNlZCBpbnN0ZWFkLlxuLy8gSG93ZXZlciwgaWYgd2UgZXZlciBlbGVjdCB0byB1c2UgdGltZXJzIGluIFNhZmFyaSwgdGhlIHByZXZhbGVudCB3b3JrLWFyb3VuZFxuLy8gaXMgdG8gYWRkIGEgc2Nyb2xsIGV2ZW50IGxpc3RlbmVyIHRoYXQgY2FsbHMgZm9yIGEgZmx1c2guXG5cbi8vIGBzZXRUaW1lb3V0YCBkb2VzIG5vdCBjYWxsIHRoZSBwYXNzZWQgY2FsbGJhY2sgaWYgdGhlIGRlbGF5IGlzIGxlc3MgdGhhblxuLy8gYXBwcm94aW1hdGVseSA3IGluIHdlYiB3b3JrZXJzIGluIEZpcmVmb3ggOCB0aHJvdWdoIDE4LCBhbmQgc29tZXRpbWVzIG5vdFxuLy8gZXZlbiB0aGVuLlxuXG5mdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXIoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG4gICAgICAgIC8vIFdlIGRpc3BhdGNoIGEgdGltZW91dCB3aXRoIGEgc3BlY2lmaWVkIGRlbGF5IG9mIDAgZm9yIGVuZ2luZXMgdGhhdFxuICAgICAgICAvLyBjYW4gcmVsaWFibHkgYWNjb21tb2RhdGUgdGhhdCByZXF1ZXN0LiBUaGlzIHdpbGwgdXN1YWxseSBiZSBzbmFwcGVkXG4gICAgICAgIC8vIHRvIGEgNCBtaWxpc2Vjb25kIGRlbGF5LCBidXQgb25jZSB3ZSdyZSBmbHVzaGluZywgdGhlcmUncyBubyBkZWxheVxuICAgICAgICAvLyBiZXR3ZWVuIGV2ZW50cy5cbiAgICAgICAgdmFyIHRpbWVvdXRIYW5kbGUgPSBzZXRUaW1lb3V0KGhhbmRsZVRpbWVyLCAwKTtcbiAgICAgICAgLy8gSG93ZXZlciwgc2luY2UgdGhpcyB0aW1lciBnZXRzIGZyZXF1ZW50bHkgZHJvcHBlZCBpbiBGaXJlZm94XG4gICAgICAgIC8vIHdvcmtlcnMsIHdlIGVubGlzdCBhbiBpbnRlcnZhbCBoYW5kbGUgdGhhdCB3aWxsIHRyeSB0byBmaXJlXG4gICAgICAgIC8vIGFuIGV2ZW50IDIwIHRpbWVzIHBlciBzZWNvbmQgdW50aWwgaXQgc3VjY2VlZHMuXG4gICAgICAgIHZhciBpbnRlcnZhbEhhbmRsZSA9IHNldEludGVydmFsKGhhbmRsZVRpbWVyLCA1MCk7XG5cbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlVGltZXIoKSB7XG4gICAgICAgICAgICAvLyBXaGljaGV2ZXIgdGltZXIgc3VjY2VlZHMgd2lsbCBjYW5jZWwgYm90aCB0aW1lcnMgYW5kXG4gICAgICAgICAgICAvLyBleGVjdXRlIHRoZSBjYWxsYmFjay5cbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SGFuZGxlKTtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGUpO1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8vIFRoaXMgaXMgZm9yIGBhc2FwLmpzYCBvbmx5LlxuLy8gSXRzIG5hbWUgd2lsbCBiZSBwZXJpb2RpY2FsbHkgcmFuZG9taXplZCB0byBicmVhayBhbnkgY29kZSB0aGF0IGRlcGVuZHMgb25cbi8vIGl0cyBleGlzdGVuY2UuXG5yYXdBc2FwLm1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lciA9IG1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcjtcblxuLy8gQVNBUCB3YXMgb3JpZ2luYWxseSBhIG5leHRUaWNrIHNoaW0gaW5jbHVkZWQgaW4gUS4gVGhpcyB3YXMgZmFjdG9yZWQgb3V0XG4vLyBpbnRvIHRoaXMgQVNBUCBwYWNrYWdlLiBJdCB3YXMgbGF0ZXIgYWRhcHRlZCB0byBSU1ZQIHdoaWNoIG1hZGUgZnVydGhlclxuLy8gYW1lbmRtZW50cy4gVGhlc2UgZGVjaXNpb25zLCBwYXJ0aWN1bGFybHkgdG8gbWFyZ2luYWxpemUgTWVzc2FnZUNoYW5uZWwgYW5kXG4vLyB0byBjYXB0dXJlIHRoZSBNdXRhdGlvbk9ic2VydmVyIGltcGxlbWVudGF0aW9uIGluIGEgY2xvc3VyZSwgd2VyZSBpbnRlZ3JhdGVkXG4vLyBiYWNrIGludG8gQVNBUCBwcm9wZXIuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vdGlsZGVpby9yc3ZwLmpzL2Jsb2IvY2RkZjcyMzI1NDZhOWNmODU4NTI0Yjc1Y2RlNmY5ZWRmNzI2MjBhNy9saWIvcnN2cC9hc2FwLmpzXG4iLCJkaXN0YW5jZSA9IHJlcXVpcmUgJy4vc3F1YXJlLWRpc3RhbmNlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGFwaSA9IHt9XG5cbiAgdG90YWxzID0gWzAsIDAsIDBdXG4gIHZlY3RvcnMgPSBbXVxuICBjZW50cm9pZCA9IG51bGxcbiAgbGFzdE51bVZlY3RvcnMgPSBudWxsXG5cbiAgYXBpLmFkZCA9ICh2ZWN0b3IpIC0+XG4gICAgdG90YWxzW2ldICs9IHZhbCBmb3IgdmFsLCBpIGluIHZlY3RvclxuICAgIHZlY3RvcnMucHVzaCB2ZWN0b3JcblxuICBhcGkuY291bnQgPSAtPlxuICAgIHZlY3RvcnMubGVuZ3RoXG5cbiAgYXBpLmNlbnRyb2lkID0gLT5cbiAgICByZXR1cm4gY2VudHJvaWQgaWYgY2VudHJvaWQ/IGFuZCBsYXN0TnVtVmVjdG9ycyA9PSB2ZWN0b3JzLmxlbmd0aFxuICAgIG1lYW4gPSBhcGkubWVhbigpXG5cbiAgICByZXR1cm4gdW5sZXNzIG1lYW5cbiAgICBjZW50cm9pZCA9IHZlY3RvcnNbMF1cbiAgICBsYXN0TnVtVmVjdG9ycyA9IHZlY3RvcnMubGVuZ3RoXG4gICAgc21hbGxlc3REaXN0ID0gZGlzdGFuY2UobWVhbiwgY2VudHJvaWQpXG5cbiAgICBmb3IgdmVjdG9yIGluIHZlY3RvcnNbMS4uXVxuICAgICAgY29udGludWUgdW5sZXNzIChkaXN0ID0gZGlzdGFuY2UobWVhbiwgdmVjdG9yKSkgPCBzbWFsbGVzdERpc3RcbiAgICAgIGNlbnRyb2lkID0gdmVjdG9yXG4gICAgICBzbWFsbGVzdERpc3QgPSBkaXN0XG5cbiAgICBjZW50cm9pZFxuXG4gIGFwaS5tZWFuID0gLT5cbiAgICByZXR1cm4gaWYgKGNvdW50ID0gdmVjdG9ycy5sZW5ndGgpID09IDBcbiAgICAoTWF0aC5yb3VuZCh0b3RhbC9jb3VudCkgZm9yIHRvdGFsIGluIHRvdGFscylcblxuICBhcGkuY2xlYXIgPSAtPlxuICAgIHRvdGFscyA9IG51bGxcbiAgICB2ZWN0b3JzLmxlbmd0aCA9IDBcbiAgICBjZW50cm9pZCA9IG51bGxcbiAgICBsYXN0TnVtVmVjdG9ycyA9IG51bGxcblxuICBhcGlcbiIsIkNsdXN0ZXIgID0gcmVxdWlyZSAnLi9jbHVzdGVyLmNvZmZlZSdcbmRpc3RhbmNlID0gcmVxdWlyZSAnLi9zcXVhcmUtZGlzdGFuY2UnXG5cbiMgRmluZHMgbnVtQ2x1c3RlcnMgY2x1c3RlcnMgaW4gdmVjdG9ycyAoYmFzZWQgb24gZ2VvbWV0cmljIGRpc3RhbmNlKVxuIyBTb21ld2hhdCBrLW1lYW5zIGxpa2UsIEkgZ3Vlc3Ncbm1vZHVsZS5leHBvcnRzID0gKHZlY3RvcnMsIG51bUNsdXN0ZXJzLCBtYXhUcmllcykgLT5cbiAgbnVtQ2x1c3RlcnMgPSBNYXRoLm1pbiB2ZWN0b3JzLmxlbmd0aCwgbnVtQ2x1c3RlcnNcbiAgcmV0dXJuIGJhaWwodmVjdG9ycywgbnVtQ2x1c3RlcnMpIGlmIHZlY3RvcnMubGVuZ3RoID09IG51bUNsdXN0ZXJzXG5cbiAgbnVtVHJpZXMgID0gMFxuICBjZW50cm9pZHMgPSBwaWNrRXZlbmx5KG51bUNsdXN0ZXJzLCAzLCAyNTUpXG4gIHByZXZDbHVzdGVycyA9IG51bGxcblxuICB3aGlsZSBudW1UcmllcyA8IG1heFRyaWVzIGFuZCAhY2VudHJvaWRzRXF1YWwoY2VudHJvaWRzLCBwcmV2Q2x1c3RlcnMpXG4gICAgcHJldkNsdXN0ZXJzID0gY2x1c3RlcnNcbiAgICBjbHVzdGVycyAgPSAoQ2x1c3RlcigpIGZvciBpIGluIFswLi4ubnVtQ2x1c3RlcnNdKVxuICAgIGNlbnRyb2lkcyA9IHN0ZXAodmVjdG9ycywgY2VudHJvaWRzLCBjbHVzdGVycylcbiAgICBudW1UcmllcysrXG5cbiAgY2x1c3RlcnNcblxuc3RlcCA9ICh2ZWN0b3JzLCBjZW50cm9pZHMsIGNsdXN0ZXJzKSAtPlxuICBmb3IgdmVjdG9yIGluIHZlY3RvcnNcbiAgICBjbHVzdGVyID0gY2x1c3RlcnNbY2xvc2VzdENsdXN0ZXJJZHgoY2VudHJvaWRzLCB2ZWN0b3IpXVxuICAgIGNsdXN0ZXIuYWRkIHZlY3RvclxuXG4gIChjbHVzdGVyLm1lYW4oKSBmb3IgY2x1c3RlciwgaSBpbiBjbHVzdGVycyB3aGVuIGNsdXN0ZXIuY291bnQoKSA+IDApXG5cbmNsb3Nlc3RDbHVzdGVySWR4ID0gKGNlbnRyb2lkcywgdmVjdG9yKSAtPlxuICBjbG9zZXN0ID0gMFxuICBzbWFsbGVzdERpc3QgPSAxOTUwNzYgIyBsYXJnZXN0IHBvc3NpYmxlIHNxdWFyZSBkaXN0YW5jZSBpcyAxOTUwNzUgKDI1NV4yICogMylcblxuICBmb3IgYywgaWR4IGluIGNlbnRyb2lkc1xuICAgIGRpc3QgPSBkaXN0YW5jZShjLCB2ZWN0b3IpXG4gICAgaWYgZGlzdCA8IHNtYWxsZXN0RGlzdFxuICAgICAgY2xvc2VzdCA9IGlkeFxuICAgICAgc21hbGxlc3REaXN0ID0gZGlzdFxuXG4gIGNsb3Nlc3RcblxucGlja1JhbmRvbSA9IChuLCBzYW1wbGVzKSAtPlxuICBwaWNrcyA9IFtdXG4gIHNhbXBsZXMgPSAodiBmb3IgdiBpbiBzYW1wbGVzKVxuXG4gIGZvciBfIGluIFswLi4ubl1cbiAgICBpZHggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzYW1wbGVzLmxlbmd0aClcbiAgICBwaWNrcy5wdXNoKHNhbXBsZXNbaWR4XSlcbiAgICBzYW1wbGVzLnNwbGljZShpZHgsIDEpXG4gIHBpY2tzXG5cbnBpY2tFdmVubHkgPSAobiwgZGltZW5zaW9ucywgcmFuZ2UpIC0+XG4gIGNodW5rID0gcmFuZ2UgLyBuXG4gIHZlY3RvcnMgPSBbXVxuXG4gIGZvciBpIGluIFswLi4ubl1cbiAgICBzID0gTWF0aC5yb3VuZCBjaHVuayAqIGkgKyBjaHVuay8yXG4gICAgdmVjdG9ycy5wdXNoIChzIGZvciBkaW0gaW4gWzAuLi5kaW1lbnNpb25zXSlcblxuICB2ZWN0b3JzXG5cbmNlbnRyb2lkc0VxdWFsID0gKG9sZCwgY2x1c3RlcnMpIC0+XG4gIHJldHVybiBmYWxzZSB1bmxlc3MgY2x1c3RlcnNcbiAgZm9yIGNlbnRyb2lkLCBpIGluIG9sZFxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgdmVjdG9yc0VxdWFsKGNlbnRyb2lkLCBjbHVzdGVyc1tpXS5jZW50cm9pZCgpKVxuXG4gIHRydWVcblxudmVjdG9yc0VxdWFsID0gKGEsIGIpIC0+XG4gIHJldHVybiBmYWxzZSBpZiAoYSBhbmQgIWIpIG9yIChiIGFuZCAhYSkgb3IgKCFhIGFuZCAhYilcbiAgZm9yIHZhbCwgaSBpbiBhXG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyB2YWwgPT0gYltpXVxuXG4gIHRydWVcblxuYmFpbCA9ICh2ZWN0b3JzLCBudW1DbHVzdGVycykgLT5cbiAgY2x1c3RlcnMgPSAoQ2x1c3RlcigpIGZvciBpIGluIFswLi4ubnVtQ2x1c3RlcnNdKVxuICBjbHVzdGVyLmFkZCh2ZWN0b3JzLmF0KGkpKSBmb3IgY2x1c3RlciwgaSBpbiBjbHVzdGVyc1xuICBjbHVzdGVyc1xuIiwidmFyIFByb21pc2UgPSByZXF1aXJlKCdwcm9taXNlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW1hZ2VEYXRhKHNyY09ySW1nLCBtYXhQaXhlbHMpIHtcbiAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24oYWNjZXB0LCByZWplY3QpIHtcbiAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHsgYWNjZXB0KHRvRGF0YShpbWFnZSwgbWF4UGl4ZWxzKSk7IH07XG4gIH0pO1xuXG4gIGltYWdlLnNyYyA9IHNyY09ySW1nLnNyYyA/IHNyY09ySW1nLnNyYyA6IChzcmNPckltZyB8fCAnJyk7XG5cbiAgcmV0dXJuIHByb21pc2U7XG59O1xuXG5mdW5jdGlvbiB0b0RhdGEoaW1hZ2UsIG1heFBpeGVscykge1xuICB2YXIgc2l6ZSA9IGNsYW1wSW1hZ2VTaXplKGltYWdlLCBtYXhQaXhlbHMpO1xuICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICBjYW52YXMud2lkdGggPSBzaXplLndpZHRoO1xuICBjYW52YXMuaGVpZ2h0ID0gc2l6ZS5oZWlnaHQ7XG4gIGN0eC5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDAsIHNpemUud2lkdGgsIHNpemUuaGVpZ2h0KTtcblxuICByZXR1cm4gY3R4LmdldEltYWdlRGF0YSgwLCAwLCBzaXplLndpZHRoLCBzaXplLmhlaWdodClcbiAgICAuZGF0YTtcbn1cblxuZnVuY3Rpb24gY2xhbXBJbWFnZVNpemUoaW1hZ2UsIG1heFBpeGVscykge1xuICB2YXIgYXNwZWN0ID0gaW1hZ2Uud2lkdGggLyBpbWFnZS5oZWlnaHQ7XG4gIHZhciBoZWlnaHQgPSBNYXRoLnNxcnQobWF4UGl4ZWxzIC8gYXNwZWN0KTtcbiAgdmFyIHdpZHRoID0gaGVpZ2h0ICogYXNwZWN0O1xuXG4gIHJldHVybiB7XG4gICAgd2lkdGg6IE1hdGgucm91bmQod2lkdGgpLFxuICAgIGhlaWdodDogTWF0aC5yb3VuZChoZWlnaHQpXG4gIH07XG59XG4iLCIvLyBDYWxjdWxhdGVzIHRoZSBzcXVhcmUgZGlzdGFuY2Ugb2YgdHdvIHZlY3RvcnMgKHByZXNlbnRlZCBhcyBhcnJheXMpLlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzcXVhcmVEaXN0YW5jZShhLCBiKSB7XG4gIHZhciBkZWx0YVN1bSA9IDA7XG4gIHZhciBkaW0gPSBhLmxlbmd0aDtcblxuICBmb3IodmFyIGkgPSAwOyBpIDwgZGltOyBpKyspXG4gICAgZGVsdGFTdW0gPSBkZWx0YVN1bSArIE1hdGgucG93KChiW2ldIC0gYVtpXSksIDIpO1xuXG4gIHJldHVybiBkZWx0YVN1bTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRvUmdiQXJyYXkoaW1hZ2VEYXRhKSB7XG4gIHZhciByZ2JWZWN0b3JzID0gW107XG4gIHZhciBudW1QaXhlbHMgPSBpbWFnZURhdGEubGVuZ3RoIC8gNDtcbiAgdmFyIG9mZnNldDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVBpeGVsczsgaSsrKSB7XG4gICAgb2Zmc2V0ID0gaSAqIDQ7XG4gICAgcmdiVmVjdG9ycy5wdXNoKFxuICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGltYWdlRGF0YSwgW29mZnNldCwgb2Zmc2V0KzNdKVxuICAgICk7XG4gIH1cblxuICByZXR1cm4gcmdiVmVjdG9ycztcbn07XG4iLCJJbWFnZURhdGEgPSByZXF1aXJlIFwiLi4vc3JjL2ltYWdlLWRhdGFcIlxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9pbmRleC5jb2ZmZWVcIlxuXG5tYWtlUGFsZXR0ZUVsID0gKGltYWdlLCBwYWxldHRlKSAtPlxuICBpbWFnZS5zdHlsZS5ib3JkZXIgPSAnMXB4IHNvbGlkICNjY2MnXG4gIGltYWdlLnN0eWxlLm1heFdpZHRoID0gJzI4MHB4J1xuXG4gIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcbiAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJ1xuICBjb250YWluZXIuc3R5bGUudGV4dEFsaWduID0gJ2NlbnRlcidcbiAgY29udGFpbmVyLnN0eWxlLnBhZGRpbmcgPSAnMCAxNnB4J1xuXG4gIGNvbG9yQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuICBjb2xvckNvbnRhaW5lci5zdHlsZS50ZXh0QWxpZ24gPSAnbGVmdCdcbiAgY29sb3JDb250YWluZXIuc3R5bGUuYm9yZGVyID0gJzFweCBzb2xpZCAjZGRkJ1xuICBjb2xvckNvbnRhaW5lci5zdHlsZS5mb250U2l6ZSA9ICcwJ1xuXG4gIGNvdW50Q29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuICBjb3VudENvbnRhaW5lci5zdHlsZS50ZXh0QWxpZ24gPSAnbGVmdCdcbiAgZm9yIGMsIGkgaW4gcGFsZXR0ZS5jb2xvcnNcbiAgICBjID89IFtdXG4gICAgY29sb3JFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcbiAgICBjb2xvckVsLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJ1xuICAgIGNvbG9yRWwuc3R5bGUud2lkdGggICA9IDQwICsncHgnXG4gICAgY29sb3JFbC5zdHlsZS5oZWlnaHQgID0gMjAgKydweCdcbiAgICBjb2xvckVsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmdiKCN7Yy5qb2luKCcsJyl9KVwiXG5cbiAgICBjb3VudEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuICAgIGNvdW50RWwuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snXG5cbiAgICBjb3VudEVsLnN0eWxlLndpZHRoICAgPSA0MCArJ3B4J1xuICAgIGNvdW50RWwuc3R5bGUuaGVpZ2h0ICA9IDIwICsncHgnXG4gICAgY291bnRFbC5zdHlsZS5mb250U2l6ZSA9IDExKydweCdcbiAgICBjb3VudEVsLnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInXG4gICAgY291bnRFbC5pbm5lckhUTUwgPSBwYWxldHRlLmNvdW50c1tpXVxuXG4gICAgY29sb3JDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sb3JFbClcbiAgICBjb3VudENvbnRhaW5lci5hcHBlbmRDaGlsZChjb3VudEVsKVxuXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChpbWFnZSlcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNvbG9yQ29udGFpbmVyKVxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY291bnRDb250YWluZXIpXG4gIGNvbnRhaW5lclxuXG5zaG93VGVzdEltYWdlID0gKGkpIC0+XG4gIFBhbGV0dGUgXCIje2l9LmpwZ1wiLCA3LCAocGFsZXR0ZSkgLT5cbiAgICBpbWcgPSBuZXcgSW1hZ2UoKVxuICAgIGltZy5zcmMgPSBcIiN7aX0uanBnXCJcbiAgICBpbWcuc3R5bGUubWFyZ2luVG9wID0gMjArJ3B4J1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBtYWtlUGFsZXR0ZUVsKGltZywgcGFsZXR0ZSlcblxuc2hvd1Rlc3RJbWFnZShpKSBmb3IgaSBpbiBbMS4uNl1cblxuIl19
