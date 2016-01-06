(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ImageData, MAX_PIXELS, MAX_TRIES, findClusters, toRgbVectors;

MAX_TRIES = 20;

MAX_PIXELS = 10000;

ImageData = require('./src/image-data');

toRgbVectors = require('./src/to-rgb-vectors');

findClusters = require('./src/find-clusters');

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


},{"./src/find-clusters":12,"./src/image-data":13,"./src/to-rgb-vectors":15}],2:[function(require,module,exports){
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

Cluster = require('./cluster');

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


},{"./cluster":11,"./square-distance":14}],13:[function(require,module,exports){
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

},{}]},{},[1]);
