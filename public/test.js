(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/felix/Workspace/palette.js/index.coffee":[function(require,module,exports){
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



},{"./src/find-clusters":"/Users/felix/Workspace/palette.js/src/find-clusters.coffee","./src/image-data":"/Users/felix/Workspace/palette.js/src/image-data.js","./src/to-rgb-vectors":"/Users/felix/Workspace/palette.js/src/to-rgb-vectors.js"}],"/Users/felix/Workspace/palette.js/node_modules/promise/index.js":[function(require,module,exports){
'use strict';

module.exports = require('./lib')

},{"./lib":"/Users/felix/Workspace/palette.js/node_modules/promise/lib/index.js"}],"/Users/felix/Workspace/palette.js/node_modules/promise/lib/core.js":[function(require,module,exports){
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

},{"asap/raw":"/Users/felix/Workspace/palette.js/node_modules/promise/node_modules/asap/raw.js"}],"/Users/felix/Workspace/palette.js/node_modules/promise/lib/done.js":[function(require,module,exports){
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

},{"./core.js":"/Users/felix/Workspace/palette.js/node_modules/promise/lib/core.js"}],"/Users/felix/Workspace/palette.js/node_modules/promise/lib/es6-extensions.js":[function(require,module,exports){
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

},{"./core.js":"/Users/felix/Workspace/palette.js/node_modules/promise/lib/core.js"}],"/Users/felix/Workspace/palette.js/node_modules/promise/lib/finally.js":[function(require,module,exports){
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

},{"./core.js":"/Users/felix/Workspace/palette.js/node_modules/promise/lib/core.js"}],"/Users/felix/Workspace/palette.js/node_modules/promise/lib/index.js":[function(require,module,exports){
'use strict';

module.exports = require('./core.js');
require('./done.js');
require('./finally.js');
require('./es6-extensions.js');
require('./node-extensions.js');

},{"./core.js":"/Users/felix/Workspace/palette.js/node_modules/promise/lib/core.js","./done.js":"/Users/felix/Workspace/palette.js/node_modules/promise/lib/done.js","./es6-extensions.js":"/Users/felix/Workspace/palette.js/node_modules/promise/lib/es6-extensions.js","./finally.js":"/Users/felix/Workspace/palette.js/node_modules/promise/lib/finally.js","./node-extensions.js":"/Users/felix/Workspace/palette.js/node_modules/promise/lib/node-extensions.js"}],"/Users/felix/Workspace/palette.js/node_modules/promise/lib/node-extensions.js":[function(require,module,exports){
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

},{"./core.js":"/Users/felix/Workspace/palette.js/node_modules/promise/lib/core.js","asap":"/Users/felix/Workspace/palette.js/node_modules/promise/node_modules/asap/browser-asap.js"}],"/Users/felix/Workspace/palette.js/node_modules/promise/node_modules/asap/browser-asap.js":[function(require,module,exports){
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

},{"./raw":"/Users/felix/Workspace/palette.js/node_modules/promise/node_modules/asap/browser-raw.js"}],"/Users/felix/Workspace/palette.js/node_modules/promise/node_modules/asap/browser-raw.js":[function(require,module,exports){
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

},{}],"/Users/felix/Workspace/palette.js/node_modules/promise/node_modules/asap/raw.js":[function(require,module,exports){
(function (process){
"use strict";

var domain; // The domain module is executed on demand
var hasSetImmediate = typeof setImmediate === "function";

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including network IO events in Node.js.
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
    // Avoids a function call
    queue[queue.length] = task;
}

var queue = [];
// Once a flush has been requested, no further calls to `requestFlush` are
// necessary until the next `flush` completes.
var flushing = false;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory excaustion, the task queue will periodically
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

rawAsap.requestFlush = requestFlush;
function requestFlush() {
    // Ensure flushing is not bound to any domain.
    // It is not sufficient to exit the domain, because domains exist on a stack.
    // To execute code outside of any domain, the following dance is necessary.
    var parentDomain = process.domain;
    if (parentDomain) {
        if (!domain) {
            // Lazy execute the domain module.
            // Only employed if the user elects to use domains.
            domain = require("domain");
        }
        domain.active = process.domain = null;
    }

    // `setImmediate` is slower that `process.nextTick`, but `process.nextTick`
    // cannot handle recursion.
    // `requestFlush` will only be called recursively from `asap.js`, to resume
    // flushing after an error is thrown into a domain.
    // Conveniently, `setImmediate` was introduced in the same version
    // `process.nextTick` started throwing recursion errors.
    if (flushing && hasSetImmediate) {
        setImmediate(flush);
    } else {
        process.nextTick(flush);
    }

    if (parentDomain) {
        domain.active = process.domain = parentDomain;
    }
}

}).call(this,require('_process'))

},{"_process":"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/process/browser.js","domain":"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/domain-browser/index.js"}],"/Users/felix/Workspace/palette.js/src/cluster.coffee":[function(require,module,exports){
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



},{"./square-distance":"/Users/felix/Workspace/palette.js/src/square-distance.js"}],"/Users/felix/Workspace/palette.js/src/find-clusters.coffee":[function(require,module,exports){
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



},{"./cluster":"/Users/felix/Workspace/palette.js/src/cluster.coffee","./square-distance":"/Users/felix/Workspace/palette.js/src/square-distance.js"}],"/Users/felix/Workspace/palette.js/src/image-data.js":[function(require,module,exports){
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

},{"promise":"/Users/felix/Workspace/palette.js/node_modules/promise/index.js"}],"/Users/felix/Workspace/palette.js/src/square-distance.js":[function(require,module,exports){
// Calculates the square distance of two vectors (presented as arrays).
module.exports = function squareDistance(a, b) {
  var deltaSum = 0;
  var dim = a.length;

  for(var i = 0; i < dim; i++)
    deltaSum = deltaSum + Math.pow((b[i] - a[i]), 2);

  return deltaSum;
};

},{}],"/Users/felix/Workspace/palette.js/src/to-rgb-vectors.js":[function(require,module,exports){
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

},{}],"/Users/felix/Workspace/palette.js/test/test.coffee":[function(require,module,exports){
var ImageData, Palette, i, makePaletteEl, showTestImage, _i;

ImageData = require("../src/image-data");

Palette = require("../");

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



},{"../":"/Users/felix/Workspace/palette.js/index.coffee","../src/image-data":"/Users/felix/Workspace/palette.js/src/image-data.js"}],"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/domain-browser/index.js":[function(require,module,exports){
/*global define:false require:false */
module.exports = (function(){
	// Import Events
	var events = require('events');

	// Export Domain
	var domain = {};
	domain.createDomain = domain.create = function(){
		var d = new events.EventEmitter();

		function emitError(e) {
			d.emit('error', e)
		}

		d.add = function(emitter){
			emitter.on('error', emitError);
		}
		d.remove = function(emitter){
			emitter.removeListener('error', emitError);
		}
		d.run = function(fn){
			try {
				fn();
			}
			catch (err) {
				this.emit('error', err);
			}
			return this;
		};
		d.dispose = function(){
			this.removeAllListeners();
			return this;
		};
		return d;
	};
	return domain;
}).call(this);
},{"events":"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/events/events.js"}],"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/events/events.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/process/browser.js":[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},["/Users/felix/Workspace/palette.js/test/test.coffee"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZmVsaXgvV29ya3NwYWNlL3BhbGV0dGUuanMvaW5kZXguY29mZmVlIiwibm9kZV9tb2R1bGVzL3Byb21pc2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZS9saWIvY29yZS5qcyIsIm5vZGVfbW9kdWxlcy9wcm9taXNlL2xpYi9kb25lLmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2UvbGliL2VzNi1leHRlbnNpb25zLmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2UvbGliL2ZpbmFsbHkuanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZS9saWIvbm9kZS1leHRlbnNpb25zLmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2Uvbm9kZV9tb2R1bGVzL2FzYXAvYnJvd3Nlci1hc2FwLmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2Uvbm9kZV9tb2R1bGVzL2FzYXAvYnJvd3Nlci1yYXcuanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZS9ub2RlX21vZHVsZXMvYXNhcC9yYXcuanMiLCIvVXNlcnMvZmVsaXgvV29ya3NwYWNlL3BhbGV0dGUuanMvc3JjL2NsdXN0ZXIuY29mZmVlIiwiL1VzZXJzL2ZlbGl4L1dvcmtzcGFjZS9wYWxldHRlLmpzL3NyYy9maW5kLWNsdXN0ZXJzLmNvZmZlZSIsInNyYy9pbWFnZS1kYXRhLmpzIiwic3JjL3NxdWFyZS1kaXN0YW5jZS5qcyIsInNyYy90by1yZ2ItdmVjdG9ycy5qcyIsIi9Vc2Vycy9mZWxpeC9Xb3Jrc3BhY2UvcGFsZXR0ZS5qcy90ZXN0L3Rlc3QuY29mZmVlIiwiLi4vLi4vLi4vLi4vdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2RvbWFpbi1icm93c2VyL2luZGV4LmpzIiwiLi4vLi4vLi4vLi4vdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCIuLi8uLi8uLi8uLi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSw0REFBQTs7QUFBQSxTQUFBLEdBQVksRUFBWixDQUFBOztBQUFBLFVBQ0EsR0FBYSxLQURiLENBQUE7O0FBQUEsU0FHQSxHQUFZLE9BQUEsQ0FBUSxrQkFBUixDQUhaLENBQUE7O0FBQUEsWUFJQSxHQUFlLE9BQUEsQ0FBUSxzQkFBUixDQUpmLENBQUE7O0FBQUEsWUFLQSxHQUFlLE9BQUEsQ0FBUSxxQkFBUixDQUxmLENBQUE7O0FBQUEsTUFPTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxVQUFELEVBQWEsU0FBYixFQUF3QixRQUF4QixHQUFBO1NBQ2YsU0FBQSxDQUFVLFVBQVYsRUFBc0IsVUFBdEIsQ0FDRSxDQUFDLElBREgsQ0FDUSxTQUFDLElBQUQsR0FBQTtBQUNKLFFBQUEsMEJBQUE7QUFBQSxJQUFBLE9BQUEsR0FBVSxZQUFBLENBQWEsSUFBYixDQUFWLENBQUE7QUFBQSxJQUNBLFFBQUEsR0FBVyxZQUFBLENBQWEsT0FBYixFQUFzQixTQUF0QixFQUFpQyxTQUFqQyxDQURYLENBQUE7QUFBQSxJQUVBLFFBQUEsR0FBVyxRQUFRLENBQUMsSUFBVCxDQUFjLFNBQUMsQ0FBRCxFQUFHLENBQUgsR0FBQTthQUFTLENBQUMsQ0FBQyxLQUFGLENBQUEsQ0FBQSxHQUFZLENBQUMsQ0FBQyxLQUFGLENBQUEsRUFBckI7SUFBQSxDQUFkLENBRlgsQ0FBQTtXQUlBLFFBQUEsQ0FBUztBQUFBLE1BQ1AsVUFBQSxFQUFZLE9BQU8sQ0FBQyxNQURiO0FBQUEsTUFFUCxNQUFBOztBQUFTO2FBQUEsK0NBQUE7aUNBQUE7QUFBQSx3QkFBQSxPQUFPLENBQUMsUUFBUixDQUFBLEVBQUEsQ0FBQTtBQUFBOztVQUZGO0FBQUEsTUFHUCxNQUFBOztBQUFTO2FBQUEsK0NBQUE7aUNBQUE7QUFBQSx3QkFBQSxPQUFPLENBQUMsS0FBUixDQUFBLEVBQUEsQ0FBQTtBQUFBOztVQUhGO0tBQVQsRUFMSTtFQUFBLENBRFIsRUFEZTtBQUFBLENBUGpCLENBQUE7Ozs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDNU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JHQSxJQUFBLFFBQUE7O0FBQUEsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUixDQUFYLENBQUE7O0FBQUEsTUFFTSxDQUFDLE9BQVAsR0FBaUIsU0FBQSxHQUFBO0FBQ2YsTUFBQSw4Q0FBQTtBQUFBLEVBQUEsR0FBQSxHQUFNLEVBQU4sQ0FBQTtBQUFBLEVBRUEsTUFBQSxHQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLENBRlQsQ0FBQTtBQUFBLEVBR0EsT0FBQSxHQUFVLEVBSFYsQ0FBQTtBQUFBLEVBSUEsUUFBQSxHQUFXLElBSlgsQ0FBQTtBQUFBLEVBS0EsY0FBQSxHQUFpQixJQUxqQixDQUFBO0FBQUEsRUFPQSxHQUFHLENBQUMsR0FBSixHQUFVLFNBQUMsTUFBRCxHQUFBO0FBQ1IsUUFBQSxnQkFBQTtBQUFBLFNBQUEscURBQUE7c0JBQUE7QUFBQSxNQUFBLE1BQU8sQ0FBQSxDQUFBLENBQVAsSUFBYSxHQUFiLENBQUE7QUFBQSxLQUFBO1dBQ0EsT0FBTyxDQUFDLElBQVIsQ0FBYSxNQUFiLEVBRlE7RUFBQSxDQVBWLENBQUE7QUFBQSxFQVdBLEdBQUcsQ0FBQyxLQUFKLEdBQVksU0FBQSxHQUFBO1dBQ1YsT0FBTyxDQUFDLE9BREU7RUFBQSxDQVhaLENBQUE7QUFBQSxFQWNBLEdBQUcsQ0FBQyxRQUFKLEdBQWUsU0FBQSxHQUFBO0FBQ2IsUUFBQSxnREFBQTtBQUFBLElBQUEsSUFBbUIsa0JBQUEsSUFBYyxjQUFBLEtBQWtCLE9BQU8sQ0FBQyxNQUEzRDtBQUFBLGFBQU8sUUFBUCxDQUFBO0tBQUE7QUFBQSxJQUNBLElBQUEsR0FBTyxHQUFHLENBQUMsSUFBSixDQUFBLENBRFAsQ0FBQTtBQUdBLElBQUEsSUFBQSxDQUFBLElBQUE7QUFBQSxZQUFBLENBQUE7S0FIQTtBQUFBLElBSUEsUUFBQSxHQUFXLE9BQVEsQ0FBQSxDQUFBLENBSm5CLENBQUE7QUFBQSxJQUtBLGNBQUEsR0FBaUIsT0FBTyxDQUFDLE1BTHpCLENBQUE7QUFBQSxJQU1BLFlBQUEsR0FBZSxRQUFBLENBQVMsSUFBVCxFQUFlLFFBQWYsQ0FOZixDQUFBO0FBUUE7QUFBQSxTQUFBLDJDQUFBO3dCQUFBO0FBQ0UsTUFBQSxJQUFBLENBQUEsQ0FBZ0IsQ0FBQyxJQUFBLEdBQU8sUUFBQSxDQUFTLElBQVQsRUFBZSxNQUFmLENBQVIsQ0FBQSxHQUFrQyxZQUFsRCxDQUFBO0FBQUEsaUJBQUE7T0FBQTtBQUFBLE1BQ0EsUUFBQSxHQUFXLE1BRFgsQ0FBQTtBQUFBLE1BRUEsWUFBQSxHQUFlLElBRmYsQ0FERjtBQUFBLEtBUkE7V0FhQSxTQWRhO0VBQUEsQ0FkZixDQUFBO0FBQUEsRUE4QkEsR0FBRyxDQUFDLElBQUosR0FBVyxTQUFBLEdBQUE7QUFDVCxRQUFBLGdDQUFBO0FBQUEsSUFBQSxJQUFVLENBQUMsS0FBQSxHQUFRLE9BQU8sQ0FBQyxNQUFqQixDQUFBLEtBQTRCLENBQXRDO0FBQUEsWUFBQSxDQUFBO0tBQUE7QUFDQztTQUFBLDZDQUFBO3lCQUFBO0FBQUEsb0JBQUEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxLQUFBLEdBQU0sS0FBakIsRUFBQSxDQUFBO0FBQUE7b0JBRlE7RUFBQSxDQTlCWCxDQUFBO0FBQUEsRUFrQ0EsR0FBRyxDQUFDLEtBQUosR0FBWSxTQUFBLEdBQUE7QUFDVixJQUFBLE1BQUEsR0FBUyxJQUFULENBQUE7QUFBQSxJQUNBLE9BQU8sQ0FBQyxNQUFSLEdBQWlCLENBRGpCLENBQUE7QUFBQSxJQUVBLFFBQUEsR0FBVyxJQUZYLENBQUE7V0FHQSxjQUFBLEdBQWlCLEtBSlA7RUFBQSxDQWxDWixDQUFBO1NBd0NBLElBekNlO0FBQUEsQ0FGakIsQ0FBQTs7Ozs7QUNBQSxJQUFBLHNHQUFBOztBQUFBLE9BQUEsR0FBVyxPQUFBLENBQVEsV0FBUixDQUFYLENBQUE7O0FBQUEsUUFDQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUixDQURYLENBQUE7O0FBQUEsTUFLTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxPQUFELEVBQVUsV0FBVixFQUF1QixRQUF2QixHQUFBO0FBQ2YsTUFBQSw4Q0FBQTtBQUFBLEVBQUEsV0FBQSxHQUFjLElBQUksQ0FBQyxHQUFMLENBQVMsT0FBTyxDQUFDLE1BQWpCLEVBQXlCLFdBQXpCLENBQWQsQ0FBQTtBQUNBLEVBQUEsSUFBcUMsT0FBTyxDQUFDLE1BQVIsS0FBa0IsV0FBdkQ7QUFBQSxXQUFPLElBQUEsQ0FBSyxPQUFMLEVBQWMsV0FBZCxDQUFQLENBQUE7R0FEQTtBQUFBLEVBR0EsUUFBQSxHQUFZLENBSFosQ0FBQTtBQUFBLEVBSUEsU0FBQSxHQUFZLFVBQUEsQ0FBVyxXQUFYLEVBQXdCLENBQXhCLEVBQTJCLEdBQTNCLENBSlosQ0FBQTtBQUFBLEVBS0EsWUFBQSxHQUFlLElBTGYsQ0FBQTtBQU9BLFNBQU0sUUFBQSxHQUFXLFFBQVgsSUFBd0IsQ0FBQSxjQUFDLENBQWUsU0FBZixFQUEwQixZQUExQixDQUEvQixHQUFBO0FBQ0UsSUFBQSxZQUFBLEdBQWUsUUFBZixDQUFBO0FBQUEsSUFDQSxRQUFBOztBQUFhO1dBQW1CLHNHQUFuQixHQUFBO0FBQUEsc0JBQUEsT0FBQSxDQUFBLEVBQUEsQ0FBQTtBQUFBOztRQURiLENBQUE7QUFBQSxJQUVBLFNBQUEsR0FBWSxJQUFBLENBQUssT0FBTCxFQUFjLFNBQWQsRUFBeUIsUUFBekIsQ0FGWixDQUFBO0FBQUEsSUFHQSxRQUFBLEVBSEEsQ0FERjtFQUFBLENBUEE7U0FhQSxTQWRlO0FBQUEsQ0FMakIsQ0FBQTs7QUFBQSxJQXFCQSxHQUFPLFNBQUMsT0FBRCxFQUFVLFNBQVYsRUFBcUIsUUFBckIsR0FBQTtBQUNMLE1BQUEsaURBQUE7QUFBQSxPQUFBLDhDQUFBO3lCQUFBO0FBQ0UsSUFBQSxPQUFBLEdBQVUsUUFBUyxDQUFBLGlCQUFBLENBQWtCLFNBQWxCLEVBQTZCLE1BQTdCLENBQUEsQ0FBbkIsQ0FBQTtBQUFBLElBQ0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxNQUFaLENBREEsQ0FERjtBQUFBLEdBQUE7QUFJQztPQUFBLHlEQUFBOzBCQUFBO1FBQStDLE9BQU8sQ0FBQyxLQUFSLENBQUEsQ0FBQSxHQUFrQjtBQUFqRSxvQkFBQSxPQUFPLENBQUMsSUFBUixDQUFBLEVBQUE7S0FBQTtBQUFBO2tCQUxJO0FBQUEsQ0FyQlAsQ0FBQTs7QUFBQSxpQkE0QkEsR0FBb0IsU0FBQyxTQUFELEVBQVksTUFBWixHQUFBO0FBQ2xCLE1BQUEsNkNBQUE7QUFBQSxFQUFBLE9BQUEsR0FBVSxDQUFWLENBQUE7QUFBQSxFQUNBLFlBQUEsR0FBZSxNQURmLENBQUE7QUFHQSxPQUFBLDREQUFBO3VCQUFBO0FBQ0UsSUFBQSxJQUFBLEdBQU8sUUFBQSxDQUFTLENBQVQsRUFBWSxNQUFaLENBQVAsQ0FBQTtBQUNBLElBQUEsSUFBRyxJQUFBLEdBQU8sWUFBVjtBQUNFLE1BQUEsT0FBQSxHQUFVLEdBQVYsQ0FBQTtBQUFBLE1BQ0EsWUFBQSxHQUFlLElBRGYsQ0FERjtLQUZGO0FBQUEsR0FIQTtTQVNBLFFBVmtCO0FBQUEsQ0E1QnBCLENBQUE7O0FBQUEsVUF3Q0EsR0FBYSxTQUFDLENBQUQsRUFBSSxPQUFKLEdBQUE7QUFDWCxNQUFBLG9CQUFBO0FBQUEsRUFBQSxLQUFBLEdBQVEsRUFBUixDQUFBO0FBQUEsRUFDQSxPQUFBOztBQUFXO1NBQUEsOENBQUE7c0JBQUE7QUFBQSxvQkFBQSxFQUFBLENBQUE7QUFBQTs7TUFEWCxDQUFBO0FBR0EsT0FBUyw4REFBVCxHQUFBO0FBQ0UsSUFBQSxHQUFBLEdBQU0sSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsR0FBZ0IsT0FBTyxDQUFDLE1BQW5DLENBQU4sQ0FBQTtBQUFBLElBQ0EsS0FBSyxDQUFDLElBQU4sQ0FBVyxPQUFRLENBQUEsR0FBQSxDQUFuQixDQURBLENBQUE7QUFBQSxJQUVBLE9BQU8sQ0FBQyxNQUFSLENBQWUsR0FBZixFQUFvQixDQUFwQixDQUZBLENBREY7QUFBQSxHQUhBO1NBT0EsTUFSVztBQUFBLENBeENiLENBQUE7O0FBQUEsVUFrREEsR0FBYSxTQUFDLENBQUQsRUFBSSxVQUFKLEVBQWdCLEtBQWhCLEdBQUE7QUFDWCxNQUFBLDZCQUFBO0FBQUEsRUFBQSxLQUFBLEdBQVEsS0FBQSxHQUFRLENBQWhCLENBQUE7QUFBQSxFQUNBLE9BQUEsR0FBVSxFQURWLENBQUE7QUFHQSxPQUFTLDhEQUFULEdBQUE7QUFDRSxJQUFBLENBQUEsR0FBSSxJQUFJLENBQUMsS0FBTCxDQUFXLEtBQUEsR0FBUSxDQUFSLEdBQVksS0FBQSxHQUFNLENBQTdCLENBQUosQ0FBQTtBQUFBLElBQ0EsT0FBTyxDQUFDLElBQVI7O0FBQWM7V0FBYSxzR0FBYixHQUFBO0FBQUEsc0JBQUEsRUFBQSxDQUFBO0FBQUE7O1FBQWQsQ0FEQSxDQURGO0FBQUEsR0FIQTtTQU9BLFFBUlc7QUFBQSxDQWxEYixDQUFBOztBQUFBLGNBNERBLEdBQWlCLFNBQUMsR0FBRCxFQUFNLFFBQU4sR0FBQTtBQUNmLE1BQUEscUJBQUE7QUFBQSxFQUFBLElBQUEsQ0FBQSxRQUFBO0FBQUEsV0FBTyxLQUFQLENBQUE7R0FBQTtBQUNBLE9BQUEsa0RBQUE7c0JBQUE7QUFDRSxJQUFBLElBQUEsQ0FBQSxZQUFvQixDQUFhLFFBQWIsRUFBdUIsUUFBUyxDQUFBLENBQUEsQ0FBRSxDQUFDLFFBQVosQ0FBQSxDQUF2QixDQUFwQjtBQUFBLGFBQU8sS0FBUCxDQUFBO0tBREY7QUFBQSxHQURBO1NBSUEsS0FMZTtBQUFBLENBNURqQixDQUFBOztBQUFBLFlBbUVBLEdBQWUsU0FBQyxDQUFELEVBQUksQ0FBSixHQUFBO0FBQ2IsTUFBQSxnQkFBQTtBQUFBLEVBQUEsSUFBZ0IsQ0FBQyxDQUFBLElBQU0sQ0FBQSxDQUFQLENBQUEsSUFBYyxDQUFDLENBQUEsSUFBTSxDQUFBLENBQVAsQ0FBZCxJQUE0QixDQUFDLENBQUEsQ0FBQSxJQUFPLENBQUEsQ0FBUixDQUE1QztBQUFBLFdBQU8sS0FBUCxDQUFBO0dBQUE7QUFDQSxPQUFBLGdEQUFBO2VBQUE7QUFDRSxJQUFBLElBQW9CLEdBQUEsS0FBTyxDQUFFLENBQUEsQ0FBQSxDQUE3QjtBQUFBLGFBQU8sS0FBUCxDQUFBO0tBREY7QUFBQSxHQURBO1NBSUEsS0FMYTtBQUFBLENBbkVmLENBQUE7O0FBQUEsSUEwRUEsR0FBTyxTQUFDLE9BQUQsRUFBVSxXQUFWLEdBQUE7QUFDTCxNQUFBLDhCQUFBO0FBQUEsRUFBQSxRQUFBOztBQUFZO1NBQW1CLHNHQUFuQixHQUFBO0FBQUEsb0JBQUEsT0FBQSxDQUFBLEVBQUEsQ0FBQTtBQUFBOztNQUFaLENBQUE7QUFDQSxPQUFBLHVEQUFBOzBCQUFBO0FBQUEsSUFBQSxPQUFPLENBQUMsR0FBUixDQUFZLE9BQU8sQ0FBQyxFQUFSLENBQVcsQ0FBWCxDQUFaLENBQUEsQ0FBQTtBQUFBLEdBREE7U0FFQSxTQUhLO0FBQUEsQ0ExRVAsQ0FBQTs7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEEsSUFBQSx1REFBQTs7QUFBQSxTQUFBLEdBQVksT0FBQSxDQUFRLG1CQUFSLENBQVosQ0FBQTs7QUFBQSxPQUNBLEdBQVUsT0FBQSxDQUFRLEtBQVIsQ0FEVixDQUFBOztBQUFBLGFBR0EsR0FBZ0IsU0FBQyxLQUFELEVBQVEsT0FBUixHQUFBO0FBQ2QsTUFBQSxpRkFBQTtBQUFBLEVBQUEsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFaLEdBQXFCLGdCQUFyQixDQUFBO0FBQUEsRUFDQSxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVosR0FBdUIsT0FEdkIsQ0FBQTtBQUFBLEVBR0EsU0FBQSxHQUFZLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCLENBSFosQ0FBQTtBQUFBLEVBSUEsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFoQixHQUEwQixjQUoxQixDQUFBO0FBQUEsRUFLQSxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQWhCLEdBQTRCLFFBTDVCLENBQUE7QUFBQSxFQU1BLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBaEIsR0FBMEIsUUFOMUIsQ0FBQTtBQUFBLEVBUUEsY0FBQSxHQUFpQixRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QixDQVJqQixDQUFBO0FBQUEsRUFTQSxjQUFjLENBQUMsS0FBSyxDQUFDLFNBQXJCLEdBQWlDLE1BVGpDLENBQUE7QUFBQSxFQVVBLGNBQWMsQ0FBQyxLQUFLLENBQUMsTUFBckIsR0FBOEIsZ0JBVjlCLENBQUE7QUFBQSxFQVdBLGNBQWMsQ0FBQyxLQUFLLENBQUMsUUFBckIsR0FBZ0MsR0FYaEMsQ0FBQTtBQUFBLEVBYUEsY0FBQSxHQUFpQixRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QixDQWJqQixDQUFBO0FBQUEsRUFjQSxjQUFjLENBQUMsS0FBSyxDQUFDLFNBQXJCLEdBQWlDLE1BZGpDLENBQUE7QUFlQTtBQUFBLE9BQUEsbURBQUE7Z0JBQUE7O01BQ0UsSUFBSztLQUFMO0FBQUEsSUFDQSxPQUFBLEdBQVUsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FEVixDQUFBO0FBQUEsSUFFQSxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQWQsR0FBd0IsY0FGeEIsQ0FBQTtBQUFBLElBR0EsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFkLEdBQXdCLEVBQUEsR0FBSSxJQUg1QixDQUFBO0FBQUEsSUFJQSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQWQsR0FBd0IsRUFBQSxHQUFJLElBSjVCLENBQUE7QUFBQSxJQUtBLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZCxHQUFpQyxNQUFBLEdBQUssQ0FBQSxDQUFDLENBQUMsSUFBRixDQUFPLEdBQVAsQ0FBQSxDQUFMLEdBQWtCLEdBTG5ELENBQUE7QUFBQSxJQU9BLE9BQUEsR0FBVSxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QixDQVBWLENBQUE7QUFBQSxJQVFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBZCxHQUF3QixjQVJ4QixDQUFBO0FBQUEsSUFVQSxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQWQsR0FBd0IsRUFBQSxHQUFJLElBVjVCLENBQUE7QUFBQSxJQVdBLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBZCxHQUF3QixFQUFBLEdBQUksSUFYNUIsQ0FBQTtBQUFBLElBWUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFkLEdBQXlCLEVBQUEsR0FBRyxJQVo1QixDQUFBO0FBQUEsSUFhQSxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQWQsR0FBMEIsUUFiMUIsQ0FBQTtBQUFBLElBY0EsT0FBTyxDQUFDLFNBQVIsR0FBb0IsT0FBTyxDQUFDLE1BQU8sQ0FBQSxDQUFBLENBZG5DLENBQUE7QUFBQSxJQWdCQSxjQUFjLENBQUMsV0FBZixDQUEyQixPQUEzQixDQWhCQSxDQUFBO0FBQUEsSUFpQkEsY0FBYyxDQUFDLFdBQWYsQ0FBMkIsT0FBM0IsQ0FqQkEsQ0FERjtBQUFBLEdBZkE7QUFBQSxFQW1DQSxTQUFTLENBQUMsV0FBVixDQUFzQixLQUF0QixDQW5DQSxDQUFBO0FBQUEsRUFvQ0EsU0FBUyxDQUFDLFdBQVYsQ0FBc0IsY0FBdEIsQ0FwQ0EsQ0FBQTtBQUFBLEVBcUNBLFNBQVMsQ0FBQyxXQUFWLENBQXNCLGNBQXRCLENBckNBLENBQUE7U0FzQ0EsVUF2Q2M7QUFBQSxDQUhoQixDQUFBOztBQUFBLGFBNENBLEdBQWdCLFNBQUMsQ0FBRCxHQUFBO1NBQ2QsT0FBQSxDQUFRLEVBQUEsR0FBRSxDQUFGLEdBQUssTUFBYixFQUFvQixDQUFwQixFQUF1QixTQUFDLE9BQUQsR0FBQTtBQUNyQixRQUFBLEdBQUE7QUFBQSxJQUFBLEdBQUEsR0FBVSxJQUFBLEtBQUEsQ0FBQSxDQUFWLENBQUE7QUFBQSxJQUNBLEdBQUcsQ0FBQyxHQUFKLEdBQVUsRUFBQSxHQUFFLENBQUYsR0FBSyxNQURmLENBQUE7QUFBQSxJQUVBLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBVixHQUFzQixFQUFBLEdBQUcsSUFGekIsQ0FBQTtXQUlBLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBZCxDQUEwQixhQUFBLENBQWMsR0FBZCxFQUFtQixPQUFuQixDQUExQixFQUxxQjtFQUFBLENBQXZCLEVBRGM7QUFBQSxDQTVDaEIsQ0FBQTs7QUFvREEsS0FBMEIsNkJBQTFCLEdBQUE7QUFBQSxFQUFBLGFBQUEsQ0FBYyxDQUFkLENBQUEsQ0FBQTtBQUFBLENBcERBOzs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiTUFYX1RSSUVTID0gMjBcbk1BWF9QSVhFTFMgPSAxMDAwMFxuXG5JbWFnZURhdGEgPSByZXF1aXJlICcuL3NyYy9pbWFnZS1kYXRhJ1xudG9SZ2JWZWN0b3JzID0gcmVxdWlyZSAnLi9zcmMvdG8tcmdiLXZlY3RvcnMnXG5maW5kQ2x1c3RlcnMgPSByZXF1aXJlICcuL3NyYy9maW5kLWNsdXN0ZXJzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IChzcmNPckltYWdlLCBudW1Db2xvcnMsIGNhbGxiYWNrKSAtPlxuICBJbWFnZURhdGEoc3JjT3JJbWFnZSwgTUFYX1BJWEVMUylcbiAgICAudGhlbiAoZGF0YSkgLT5cbiAgICAgIHZlY3RvcnMgPSB0b1JnYlZlY3RvcnMoZGF0YSlcbiAgICAgIGNsdXN0ZXJzID0gZmluZENsdXN0ZXJzKHZlY3RvcnMsIG51bUNvbG9ycywgTUFYX1RSSUVTKVxuICAgICAgY2x1c3RlcnMgPSBjbHVzdGVycy5zb3J0IChhLGIpIC0+IGIuY291bnQoKSAtIGEuY291bnQoKVxuXG4gICAgICBjYWxsYmFjayB7XG4gICAgICAgIG51bVNhbXBsZXM6IHZlY3RvcnMubGVuZ3RoXG4gICAgICAgIGNvbG9yczogKGNsdXN0ZXIuY2VudHJvaWQoKSBmb3IgY2x1c3RlciBpbiBjbHVzdGVycylcbiAgICAgICAgY291bnRzOiAoY2x1c3Rlci5jb3VudCgpIGZvciBjbHVzdGVyIGluIGNsdXN0ZXJzKVxuICAgICAgfVxuXG5cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYicpXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBhc2FwID0gcmVxdWlyZSgnYXNhcC9yYXcnKTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbi8vIFN0YXRlczpcbi8vXG4vLyAwIC0gcGVuZGluZ1xuLy8gMSAtIGZ1bGZpbGxlZCB3aXRoIF92YWx1ZVxuLy8gMiAtIHJlamVjdGVkIHdpdGggX3ZhbHVlXG4vLyAzIC0gYWRvcHRlZCB0aGUgc3RhdGUgb2YgYW5vdGhlciBwcm9taXNlLCBfdmFsdWVcbi8vXG4vLyBvbmNlIHRoZSBzdGF0ZSBpcyBubyBsb25nZXIgcGVuZGluZyAoMCkgaXQgaXMgaW1tdXRhYmxlXG5cbi8vIEFsbCBgX2AgcHJlZml4ZWQgcHJvcGVydGllcyB3aWxsIGJlIHJlZHVjZWQgdG8gYF97cmFuZG9tIG51bWJlcn1gXG4vLyBhdCBidWlsZCB0aW1lIHRvIG9iZnVzY2F0ZSB0aGVtIGFuZCBkaXNjb3VyYWdlIHRoZWlyIHVzZS5cbi8vIFdlIGRvbid0IHVzZSBzeW1ib2xzIG9yIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSB0byBmdWxseSBoaWRlIHRoZW1cbi8vIGJlY2F1c2UgdGhlIHBlcmZvcm1hbmNlIGlzbid0IGdvb2QgZW5vdWdoLlxuXG5cbi8vIHRvIGF2b2lkIHVzaW5nIHRyeS9jYXRjaCBpbnNpZGUgY3JpdGljYWwgZnVuY3Rpb25zLCB3ZVxuLy8gZXh0cmFjdCB0aGVtIHRvIGhlcmUuXG52YXIgTEFTVF9FUlJPUiA9IG51bGw7XG52YXIgSVNfRVJST1IgPSB7fTtcbmZ1bmN0aW9uIGdldFRoZW4ob2JqKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG9iai50aGVuO1xuICB9IGNhdGNoIChleCkge1xuICAgIExBU1RfRVJST1IgPSBleDtcbiAgICByZXR1cm4gSVNfRVJST1I7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJ5Q2FsbE9uZShmbiwgYSkge1xuICB0cnkge1xuICAgIHJldHVybiBmbihhKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBMQVNUX0VSUk9SID0gZXg7XG4gICAgcmV0dXJuIElTX0VSUk9SO1xuICB9XG59XG5mdW5jdGlvbiB0cnlDYWxsVHdvKGZuLCBhLCBiKSB7XG4gIHRyeSB7XG4gICAgZm4oYSwgYik7XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgTEFTVF9FUlJPUiA9IGV4O1xuICAgIHJldHVybiBJU19FUlJPUjtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2U7XG5cbmZ1bmN0aW9uIFByb21pc2UoZm4pIHtcbiAgaWYgKHR5cGVvZiB0aGlzICE9PSAnb2JqZWN0Jykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Byb21pc2VzIG11c3QgYmUgY29uc3RydWN0ZWQgdmlhIG5ldycpO1xuICB9XG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdub3QgYSBmdW5jdGlvbicpO1xuICB9XG4gIHRoaXMuXzM3ID0gMDtcbiAgdGhpcy5fMTIgPSBudWxsO1xuICB0aGlzLl81OSA9IFtdO1xuICBpZiAoZm4gPT09IG5vb3ApIHJldHVybjtcbiAgZG9SZXNvbHZlKGZuLCB0aGlzKTtcbn1cblByb21pc2UuXzk5ID0gbm9vcDtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gIGlmICh0aGlzLmNvbnN0cnVjdG9yICE9PSBQcm9taXNlKSB7XG4gICAgcmV0dXJuIHNhZmVUaGVuKHRoaXMsIG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKTtcbiAgfVxuICB2YXIgcmVzID0gbmV3IFByb21pc2Uobm9vcCk7XG4gIGhhbmRsZSh0aGlzLCBuZXcgSGFuZGxlcihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcmVzKSk7XG4gIHJldHVybiByZXM7XG59O1xuXG5mdW5jdGlvbiBzYWZlVGhlbihzZWxmLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICByZXR1cm4gbmV3IHNlbGYuY29uc3RydWN0b3IoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciByZXMgPSBuZXcgUHJvbWlzZShub29wKTtcbiAgICByZXMudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgIGhhbmRsZShzZWxmLCBuZXcgSGFuZGxlcihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcmVzKSk7XG4gIH0pO1xufTtcbmZ1bmN0aW9uIGhhbmRsZShzZWxmLCBkZWZlcnJlZCkge1xuICB3aGlsZSAoc2VsZi5fMzcgPT09IDMpIHtcbiAgICBzZWxmID0gc2VsZi5fMTI7XG4gIH1cbiAgaWYgKHNlbGYuXzM3ID09PSAwKSB7XG4gICAgc2VsZi5fNTkucHVzaChkZWZlcnJlZCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGFzYXAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNiID0gc2VsZi5fMzcgPT09IDEgPyBkZWZlcnJlZC5vbkZ1bGZpbGxlZCA6IGRlZmVycmVkLm9uUmVqZWN0ZWQ7XG4gICAgaWYgKGNiID09PSBudWxsKSB7XG4gICAgICBpZiAoc2VsZi5fMzcgPT09IDEpIHtcbiAgICAgICAgcmVzb2x2ZShkZWZlcnJlZC5wcm9taXNlLCBzZWxmLl8xMik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWplY3QoZGVmZXJyZWQucHJvbWlzZSwgc2VsZi5fMTIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcmV0ID0gdHJ5Q2FsbE9uZShjYiwgc2VsZi5fMTIpO1xuICAgIGlmIChyZXQgPT09IElTX0VSUk9SKSB7XG4gICAgICByZWplY3QoZGVmZXJyZWQucHJvbWlzZSwgTEFTVF9FUlJPUik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc29sdmUoZGVmZXJyZWQucHJvbWlzZSwgcmV0KTtcbiAgICB9XG4gIH0pO1xufVxuZnVuY3Rpb24gcmVzb2x2ZShzZWxmLCBuZXdWYWx1ZSkge1xuICAvLyBQcm9taXNlIFJlc29sdXRpb24gUHJvY2VkdXJlOiBodHRwczovL2dpdGh1Yi5jb20vcHJvbWlzZXMtYXBsdXMvcHJvbWlzZXMtc3BlYyN0aGUtcHJvbWlzZS1yZXNvbHV0aW9uLXByb2NlZHVyZVxuICBpZiAobmV3VmFsdWUgPT09IHNlbGYpIHtcbiAgICByZXR1cm4gcmVqZWN0KFxuICAgICAgc2VsZixcbiAgICAgIG5ldyBUeXBlRXJyb3IoJ0EgcHJvbWlzZSBjYW5ub3QgYmUgcmVzb2x2ZWQgd2l0aCBpdHNlbGYuJylcbiAgICApO1xuICB9XG4gIGlmIChcbiAgICBuZXdWYWx1ZSAmJlxuICAgICh0eXBlb2YgbmV3VmFsdWUgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBuZXdWYWx1ZSA9PT0gJ2Z1bmN0aW9uJylcbiAgKSB7XG4gICAgdmFyIHRoZW4gPSBnZXRUaGVuKG5ld1ZhbHVlKTtcbiAgICBpZiAodGhlbiA9PT0gSVNfRVJST1IpIHtcbiAgICAgIHJldHVybiByZWplY3Qoc2VsZiwgTEFTVF9FUlJPUik7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIHRoZW4gPT09IHNlbGYudGhlbiAmJlxuICAgICAgbmV3VmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlXG4gICAgKSB7XG4gICAgICBzZWxmLl8zNyA9IDM7XG4gICAgICBzZWxmLl8xMiA9IG5ld1ZhbHVlO1xuICAgICAgZmluYWxlKHNlbGYpO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGRvUmVzb2x2ZSh0aGVuLmJpbmQobmV3VmFsdWUpLCBzZWxmKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbiAgc2VsZi5fMzcgPSAxO1xuICBzZWxmLl8xMiA9IG5ld1ZhbHVlO1xuICBmaW5hbGUoc2VsZik7XG59XG5cbmZ1bmN0aW9uIHJlamVjdChzZWxmLCBuZXdWYWx1ZSkge1xuICBzZWxmLl8zNyA9IDI7XG4gIHNlbGYuXzEyID0gbmV3VmFsdWU7XG4gIGZpbmFsZShzZWxmKTtcbn1cbmZ1bmN0aW9uIGZpbmFsZShzZWxmKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5fNTkubGVuZ3RoOyBpKyspIHtcbiAgICBoYW5kbGUoc2VsZiwgc2VsZi5fNTlbaV0pO1xuICB9XG4gIHNlbGYuXzU5ID0gbnVsbDtcbn1cblxuZnVuY3Rpb24gSGFuZGxlcihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcHJvbWlzZSl7XG4gIHRoaXMub25GdWxmaWxsZWQgPSB0eXBlb2Ygb25GdWxmaWxsZWQgPT09ICdmdW5jdGlvbicgPyBvbkZ1bGZpbGxlZCA6IG51bGw7XG4gIHRoaXMub25SZWplY3RlZCA9IHR5cGVvZiBvblJlamVjdGVkID09PSAnZnVuY3Rpb24nID8gb25SZWplY3RlZCA6IG51bGw7XG4gIHRoaXMucHJvbWlzZSA9IHByb21pc2U7XG59XG5cbi8qKlxuICogVGFrZSBhIHBvdGVudGlhbGx5IG1pc2JlaGF2aW5nIHJlc29sdmVyIGZ1bmN0aW9uIGFuZCBtYWtlIHN1cmVcbiAqIG9uRnVsZmlsbGVkIGFuZCBvblJlamVjdGVkIGFyZSBvbmx5IGNhbGxlZCBvbmNlLlxuICpcbiAqIE1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgYXN5bmNocm9ueS5cbiAqL1xuZnVuY3Rpb24gZG9SZXNvbHZlKGZuLCBwcm9taXNlKSB7XG4gIHZhciBkb25lID0gZmFsc2U7XG4gIHZhciByZXMgPSB0cnlDYWxsVHdvKGZuLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAoZG9uZSkgcmV0dXJuO1xuICAgIGRvbmUgPSB0cnVlO1xuICAgIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgaWYgKGRvbmUpIHJldHVybjtcbiAgICBkb25lID0gdHJ1ZTtcbiAgICByZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgfSlcbiAgaWYgKCFkb25lICYmIHJlcyA9PT0gSVNfRVJST1IpIHtcbiAgICBkb25lID0gdHJ1ZTtcbiAgICByZWplY3QocHJvbWlzZSwgTEFTVF9FUlJPUik7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlO1xuUHJvbWlzZS5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uIChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICB2YXIgc2VsZiA9IGFyZ3VtZW50cy5sZW5ndGggPyB0aGlzLnRoZW4uYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IHRoaXM7XG4gIHNlbGYudGhlbihudWxsLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSwgMCk7XG4gIH0pO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy9UaGlzIGZpbGUgY29udGFpbnMgdGhlIEVTNiBleHRlbnNpb25zIHRvIHRoZSBjb3JlIFByb21pc2VzL0ErIEFQSVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2U7XG5cbi8qIFN0YXRpYyBGdW5jdGlvbnMgKi9cblxudmFyIFRSVUUgPSB2YWx1ZVByb21pc2UodHJ1ZSk7XG52YXIgRkFMU0UgPSB2YWx1ZVByb21pc2UoZmFsc2UpO1xudmFyIE5VTEwgPSB2YWx1ZVByb21pc2UobnVsbCk7XG52YXIgVU5ERUZJTkVEID0gdmFsdWVQcm9taXNlKHVuZGVmaW5lZCk7XG52YXIgWkVSTyA9IHZhbHVlUHJvbWlzZSgwKTtcbnZhciBFTVBUWVNUUklORyA9IHZhbHVlUHJvbWlzZSgnJyk7XG5cbmZ1bmN0aW9uIHZhbHVlUHJvbWlzZSh2YWx1ZSkge1xuICB2YXIgcCA9IG5ldyBQcm9taXNlKFByb21pc2UuXzk5KTtcbiAgcC5fMzcgPSAxO1xuICBwLl8xMiA9IHZhbHVlO1xuICByZXR1cm4gcDtcbn1cblByb21pc2UucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSByZXR1cm4gdmFsdWU7XG5cbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gTlVMTDtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiBVTkRFRklORUQ7XG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkgcmV0dXJuIFRSVUU7XG4gIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHJldHVybiBGQUxTRTtcbiAgaWYgKHZhbHVlID09PSAwKSByZXR1cm4gWkVSTztcbiAgaWYgKHZhbHVlID09PSAnJykgcmV0dXJuIEVNUFRZU1RSSU5HO1xuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRyeSB7XG4gICAgICB2YXIgdGhlbiA9IHZhbHVlLnRoZW47XG4gICAgICBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHRoZW4uYmluZCh2YWx1ZSkpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICByZWplY3QoZXgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZVByb21pc2UodmFsdWUpO1xufTtcblxuUHJvbWlzZS5hbGwgPSBmdW5jdGlvbiAoYXJyKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyKTtcblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHJlc29sdmUoW10pO1xuICAgIHZhciByZW1haW5pbmcgPSBhcmdzLmxlbmd0aDtcbiAgICBmdW5jdGlvbiByZXMoaSwgdmFsKSB7XG4gICAgICBpZiAodmFsICYmICh0eXBlb2YgdmFsID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgUHJvbWlzZSAmJiB2YWwudGhlbiA9PT0gUHJvbWlzZS5wcm90b3R5cGUudGhlbikge1xuICAgICAgICAgIHdoaWxlICh2YWwuXzM3ID09PSAzKSB7XG4gICAgICAgICAgICB2YWwgPSB2YWwuXzEyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodmFsLl8zNyA9PT0gMSkgcmV0dXJuIHJlcyhpLCB2YWwuXzEyKTtcbiAgICAgICAgICBpZiAodmFsLl8zNyA9PT0gMikgcmVqZWN0KHZhbC5fMTIpO1xuICAgICAgICAgIHZhbC50aGVuKGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgIHJlcyhpLCB2YWwpO1xuICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciB0aGVuID0gdmFsLnRoZW47XG4gICAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB2YXIgcCA9IG5ldyBQcm9taXNlKHRoZW4uYmluZCh2YWwpKTtcbiAgICAgICAgICAgIHAudGhlbihmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgIHJlcyhpLCB2YWwpO1xuICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGFyZ3NbaV0gPSB2YWw7XG4gICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgcmVzb2x2ZShhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXMoaSwgYXJnc1tpXSk7XG4gICAgfVxuICB9KTtcbn07XG5cblByb21pc2UucmVqZWN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgcmVqZWN0KHZhbHVlKTtcbiAgfSk7XG59O1xuXG5Qcm9taXNlLnJhY2UgPSBmdW5jdGlvbiAodmFsdWVzKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFsdWVzLmZvckVhY2goZnVuY3Rpb24odmFsdWUpe1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKHZhbHVlKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLyogUHJvdG90eXBlIE1ldGhvZHMgKi9cblxuUHJvbWlzZS5wcm90b3R5cGVbJ2NhdGNoJ10gPSBmdW5jdGlvbiAob25SZWplY3RlZCkge1xuICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0ZWQpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlO1xuUHJvbWlzZS5wcm90b3R5cGVbJ2ZpbmFsbHknXSA9IGZ1bmN0aW9uIChmKSB7XG4gIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmKCkpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0pO1xuICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmKCkpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH0pO1xuICB9KTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XG5yZXF1aXJlKCcuL2RvbmUuanMnKTtcbnJlcXVpcmUoJy4vZmluYWxseS5qcycpO1xucmVxdWlyZSgnLi9lczYtZXh0ZW5zaW9ucy5qcycpO1xucmVxdWlyZSgnLi9ub2RlLWV4dGVuc2lvbnMuanMnKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIHRoZW4vcHJvbWlzZSBzcGVjaWZpYyBleHRlbnNpb25zIHRoYXQgYXJlIG9ubHkgdXNlZnVsXG4vLyBmb3Igbm9kZS5qcyBpbnRlcm9wXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XG52YXIgYXNhcCA9IHJlcXVpcmUoJ2FzYXAnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlO1xuXG4vKiBTdGF0aWMgRnVuY3Rpb25zICovXG5cblByb21pc2UuZGVub2RlaWZ5ID0gZnVuY3Rpb24gKGZuLCBhcmd1bWVudENvdW50KSB7XG4gIGFyZ3VtZW50Q291bnQgPSBhcmd1bWVudENvdW50IHx8IEluZmluaXR5O1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCxcbiAgICAgICAgYXJndW1lbnRDb3VudCA+IDAgPyBhcmd1bWVudENvdW50IDogMCk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGFyZ3MucHVzaChmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgICAgaWYgKGVycikgcmVqZWN0KGVycik7XG4gICAgICAgIGVsc2UgcmVzb2x2ZShyZXMpO1xuICAgICAgfSlcbiAgICAgIHZhciByZXMgPSBmbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgIGlmIChyZXMgJiZcbiAgICAgICAgKFxuICAgICAgICAgIHR5cGVvZiByZXMgPT09ICdvYmplY3QnIHx8XG4gICAgICAgICAgdHlwZW9mIHJlcyA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICApICYmXG4gICAgICAgIHR5cGVvZiByZXMudGhlbiA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgKSB7XG4gICAgICAgIHJlc29sdmUocmVzKTtcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5Qcm9taXNlLm5vZGVpZnkgPSBmdW5jdGlvbiAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgdmFyIGNhbGxiYWNrID1cbiAgICAgIHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09ICdmdW5jdGlvbicgPyBhcmdzLnBvcCgpIDogbnVsbDtcbiAgICB2YXIgY3R4ID0gdGhpcztcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykubm9kZWlmeShjYWxsYmFjaywgY3R4KTtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgaWYgKGNhbGxiYWNrID09PSBudWxsIHx8IHR5cGVvZiBjYWxsYmFjayA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY2FsbGJhY2suY2FsbChjdHgsIGV4KTtcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuUHJvbWlzZS5wcm90b3R5cGUubm9kZWlmeSA9IGZ1bmN0aW9uIChjYWxsYmFjaywgY3R4KSB7XG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHRoaXM7XG5cbiAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgY2FsbGJhY2suY2FsbChjdHgsIG51bGwsIHZhbHVlKTtcbiAgICB9KTtcbiAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgIGFzYXAoZnVuY3Rpb24gKCkge1xuICAgICAgY2FsbGJhY2suY2FsbChjdHgsIGVycik7XG4gICAgfSk7XG4gIH0pO1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIHJhd0FzYXAgcHJvdmlkZXMgZXZlcnl0aGluZyB3ZSBuZWVkIGV4Y2VwdCBleGNlcHRpb24gbWFuYWdlbWVudC5cbnZhciByYXdBc2FwID0gcmVxdWlyZShcIi4vcmF3XCIpO1xuLy8gUmF3VGFza3MgYXJlIHJlY3ljbGVkIHRvIHJlZHVjZSBHQyBjaHVybi5cbnZhciBmcmVlVGFza3MgPSBbXTtcbi8vIFdlIHF1ZXVlIGVycm9ycyB0byBlbnN1cmUgdGhleSBhcmUgdGhyb3duIGluIHJpZ2h0IG9yZGVyIChGSUZPKS5cbi8vIEFycmF5LWFzLXF1ZXVlIGlzIGdvb2QgZW5vdWdoIGhlcmUsIHNpbmNlIHdlIGFyZSBqdXN0IGRlYWxpbmcgd2l0aCBleGNlcHRpb25zLlxudmFyIHBlbmRpbmdFcnJvcnMgPSBbXTtcbnZhciByZXF1ZXN0RXJyb3JUaHJvdyA9IHJhd0FzYXAubWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKHRocm93Rmlyc3RFcnJvcik7XG5cbmZ1bmN0aW9uIHRocm93Rmlyc3RFcnJvcigpIHtcbiAgICBpZiAocGVuZGluZ0Vycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgcGVuZGluZ0Vycm9ycy5zaGlmdCgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDYWxscyBhIHRhc2sgYXMgc29vbiBhcyBwb3NzaWJsZSBhZnRlciByZXR1cm5pbmcsIGluIGl0cyBvd24gZXZlbnQsIHdpdGggcHJpb3JpdHlcbiAqIG92ZXIgb3RoZXIgZXZlbnRzIGxpa2UgYW5pbWF0aW9uLCByZWZsb3csIGFuZCByZXBhaW50LiBBbiBlcnJvciB0aHJvd24gZnJvbSBhblxuICogZXZlbnQgd2lsbCBub3QgaW50ZXJydXB0LCBub3IgZXZlbiBzdWJzdGFudGlhbGx5IHNsb3cgZG93biB0aGUgcHJvY2Vzc2luZyBvZlxuICogb3RoZXIgZXZlbnRzLCBidXQgd2lsbCBiZSByYXRoZXIgcG9zdHBvbmVkIHRvIGEgbG93ZXIgcHJpb3JpdHkgZXZlbnQuXG4gKiBAcGFyYW0ge3tjYWxsfX0gdGFzayBBIGNhbGxhYmxlIG9iamVjdCwgdHlwaWNhbGx5IGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBub1xuICogYXJndW1lbnRzLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGFzYXA7XG5mdW5jdGlvbiBhc2FwKHRhc2spIHtcbiAgICB2YXIgcmF3VGFzaztcbiAgICBpZiAoZnJlZVRhc2tzLmxlbmd0aCkge1xuICAgICAgICByYXdUYXNrID0gZnJlZVRhc2tzLnBvcCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJhd1Rhc2sgPSBuZXcgUmF3VGFzaygpO1xuICAgIH1cbiAgICByYXdUYXNrLnRhc2sgPSB0YXNrO1xuICAgIHJhd0FzYXAocmF3VGFzayk7XG59XG5cbi8vIFdlIHdyYXAgdGFza3Mgd2l0aCByZWN5Y2xhYmxlIHRhc2sgb2JqZWN0cy4gIEEgdGFzayBvYmplY3QgaW1wbGVtZW50c1xuLy8gYGNhbGxgLCBqdXN0IGxpa2UgYSBmdW5jdGlvbi5cbmZ1bmN0aW9uIFJhd1Rhc2soKSB7XG4gICAgdGhpcy50YXNrID0gbnVsbDtcbn1cblxuLy8gVGhlIHNvbGUgcHVycG9zZSBvZiB3cmFwcGluZyB0aGUgdGFzayBpcyB0byBjYXRjaCB0aGUgZXhjZXB0aW9uIGFuZCByZWN5Y2xlXG4vLyB0aGUgdGFzayBvYmplY3QgYWZ0ZXIgaXRzIHNpbmdsZSB1c2UuXG5SYXdUYXNrLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIHRoaXMudGFzay5jYWxsKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgaWYgKGFzYXAub25lcnJvcikge1xuICAgICAgICAgICAgLy8gVGhpcyBob29rIGV4aXN0cyBwdXJlbHkgZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gICAgICAgICAgICAvLyBJdHMgbmFtZSB3aWxsIGJlIHBlcmlvZGljYWxseSByYW5kb21pemVkIHRvIGJyZWFrIGFueSBjb2RlIHRoYXRcbiAgICAgICAgICAgIC8vIGRlcGVuZHMgb24gaXRzIGV4aXN0ZW5jZS5cbiAgICAgICAgICAgIGFzYXAub25lcnJvcihlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBJbiBhIHdlYiBicm93c2VyLCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuIEhvd2V2ZXIsIHRvIGF2b2lkXG4gICAgICAgICAgICAvLyBzbG93aW5nIGRvd24gdGhlIHF1ZXVlIG9mIHBlbmRpbmcgdGFza3MsIHdlIHJldGhyb3cgdGhlIGVycm9yIGluIGFcbiAgICAgICAgICAgIC8vIGxvd2VyIHByaW9yaXR5IHR1cm4uXG4gICAgICAgICAgICBwZW5kaW5nRXJyb3JzLnB1c2goZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdEVycm9yVGhyb3coKTtcbiAgICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRoaXMudGFzayA9IG51bGw7XG4gICAgICAgIGZyZWVUYXNrc1tmcmVlVGFza3MubGVuZ3RoXSA9IHRoaXM7XG4gICAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vLyBVc2UgdGhlIGZhc3Rlc3QgbWVhbnMgcG9zc2libGUgdG8gZXhlY3V0ZSBhIHRhc2sgaW4gaXRzIG93biB0dXJuLCB3aXRoXG4vLyBwcmlvcml0eSBvdmVyIG90aGVyIGV2ZW50cyBpbmNsdWRpbmcgSU8sIGFuaW1hdGlvbiwgcmVmbG93LCBhbmQgcmVkcmF3XG4vLyBldmVudHMgaW4gYnJvd3NlcnMuXG4vL1xuLy8gQW4gZXhjZXB0aW9uIHRocm93biBieSBhIHRhc2sgd2lsbCBwZXJtYW5lbnRseSBpbnRlcnJ1cHQgdGhlIHByb2Nlc3Npbmcgb2Zcbi8vIHN1YnNlcXVlbnQgdGFza3MuIFRoZSBoaWdoZXIgbGV2ZWwgYGFzYXBgIGZ1bmN0aW9uIGVuc3VyZXMgdGhhdCBpZiBhblxuLy8gZXhjZXB0aW9uIGlzIHRocm93biBieSBhIHRhc2ssIHRoYXQgdGhlIHRhc2sgcXVldWUgd2lsbCBjb250aW51ZSBmbHVzaGluZyBhc1xuLy8gc29vbiBhcyBwb3NzaWJsZSwgYnV0IGlmIHlvdSB1c2UgYHJhd0FzYXBgIGRpcmVjdGx5LCB5b3UgYXJlIHJlc3BvbnNpYmxlIHRvXG4vLyBlaXRoZXIgZW5zdXJlIHRoYXQgbm8gZXhjZXB0aW9ucyBhcmUgdGhyb3duIGZyb20geW91ciB0YXNrLCBvciB0byBtYW51YWxseVxuLy8gY2FsbCBgcmF3QXNhcC5yZXF1ZXN0Rmx1c2hgIGlmIGFuIGV4Y2VwdGlvbiBpcyB0aHJvd24uXG5tb2R1bGUuZXhwb3J0cyA9IHJhd0FzYXA7XG5mdW5jdGlvbiByYXdBc2FwKHRhc2spIHtcbiAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuICAgICAgICByZXF1ZXN0Rmx1c2goKTtcbiAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgIH1cbiAgICAvLyBFcXVpdmFsZW50IHRvIHB1c2gsIGJ1dCBhdm9pZHMgYSBmdW5jdGlvbiBjYWxsLlxuICAgIHF1ZXVlW3F1ZXVlLmxlbmd0aF0gPSB0YXNrO1xufVxuXG52YXIgcXVldWUgPSBbXTtcbi8vIE9uY2UgYSBmbHVzaCBoYXMgYmVlbiByZXF1ZXN0ZWQsIG5vIGZ1cnRoZXIgY2FsbHMgdG8gYHJlcXVlc3RGbHVzaGAgYXJlXG4vLyBuZWNlc3NhcnkgdW50aWwgdGhlIG5leHQgYGZsdXNoYCBjb21wbGV0ZXMuXG52YXIgZmx1c2hpbmcgPSBmYWxzZTtcbi8vIGByZXF1ZXN0Rmx1c2hgIGlzIGFuIGltcGxlbWVudGF0aW9uLXNwZWNpZmljIG1ldGhvZCB0aGF0IGF0dGVtcHRzIHRvIGtpY2tcbi8vIG9mZiBhIGBmbHVzaGAgZXZlbnQgYXMgcXVpY2tseSBhcyBwb3NzaWJsZS4gYGZsdXNoYCB3aWxsIGF0dGVtcHQgdG8gZXhoYXVzdFxuLy8gdGhlIGV2ZW50IHF1ZXVlIGJlZm9yZSB5aWVsZGluZyB0byB0aGUgYnJvd3NlcidzIG93biBldmVudCBsb29wLlxudmFyIHJlcXVlc3RGbHVzaDtcbi8vIFRoZSBwb3NpdGlvbiBvZiB0aGUgbmV4dCB0YXNrIHRvIGV4ZWN1dGUgaW4gdGhlIHRhc2sgcXVldWUuIFRoaXMgaXNcbi8vIHByZXNlcnZlZCBiZXR3ZWVuIGNhbGxzIHRvIGBmbHVzaGAgc28gdGhhdCBpdCBjYW4gYmUgcmVzdW1lZCBpZlxuLy8gYSB0YXNrIHRocm93cyBhbiBleGNlcHRpb24uXG52YXIgaW5kZXggPSAwO1xuLy8gSWYgYSB0YXNrIHNjaGVkdWxlcyBhZGRpdGlvbmFsIHRhc2tzIHJlY3Vyc2l2ZWx5LCB0aGUgdGFzayBxdWV1ZSBjYW4gZ3Jvd1xuLy8gdW5ib3VuZGVkLiBUbyBwcmV2ZW50IG1lbW9yeSBleGhhdXN0aW9uLCB0aGUgdGFzayBxdWV1ZSB3aWxsIHBlcmlvZGljYWxseVxuLy8gdHJ1bmNhdGUgYWxyZWFkeS1jb21wbGV0ZWQgdGFza3MuXG52YXIgY2FwYWNpdHkgPSAxMDI0O1xuXG4vLyBUaGUgZmx1c2ggZnVuY3Rpb24gcHJvY2Vzc2VzIGFsbCB0YXNrcyB0aGF0IGhhdmUgYmVlbiBzY2hlZHVsZWQgd2l0aFxuLy8gYHJhd0FzYXBgIHVubGVzcyBhbmQgdW50aWwgb25lIG9mIHRob3NlIHRhc2tzIHRocm93cyBhbiBleGNlcHRpb24uXG4vLyBJZiBhIHRhc2sgdGhyb3dzIGFuIGV4Y2VwdGlvbiwgYGZsdXNoYCBlbnN1cmVzIHRoYXQgaXRzIHN0YXRlIHdpbGwgcmVtYWluXG4vLyBjb25zaXN0ZW50IGFuZCB3aWxsIHJlc3VtZSB3aGVyZSBpdCBsZWZ0IG9mZiB3aGVuIGNhbGxlZCBhZ2Fpbi5cbi8vIEhvd2V2ZXIsIGBmbHVzaGAgZG9lcyBub3QgbWFrZSBhbnkgYXJyYW5nZW1lbnRzIHRvIGJlIGNhbGxlZCBhZ2FpbiBpZiBhblxuLy8gZXhjZXB0aW9uIGlzIHRocm93bi5cbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIHdoaWxlIChpbmRleCA8IHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICB2YXIgY3VycmVudEluZGV4ID0gaW5kZXg7XG4gICAgICAgIC8vIEFkdmFuY2UgdGhlIGluZGV4IGJlZm9yZSBjYWxsaW5nIHRoZSB0YXNrLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSB3aWxsXG4gICAgICAgIC8vIGJlZ2luIGZsdXNoaW5nIG9uIHRoZSBuZXh0IHRhc2sgdGhlIHRhc2sgdGhyb3dzIGFuIGVycm9yLlxuICAgICAgICBpbmRleCA9IGluZGV4ICsgMTtcbiAgICAgICAgcXVldWVbY3VycmVudEluZGV4XS5jYWxsKCk7XG4gICAgICAgIC8vIFByZXZlbnQgbGVha2luZyBtZW1vcnkgZm9yIGxvbmcgY2hhaW5zIG9mIHJlY3Vyc2l2ZSBjYWxscyB0byBgYXNhcGAuXG4gICAgICAgIC8vIElmIHdlIGNhbGwgYGFzYXBgIHdpdGhpbiB0YXNrcyBzY2hlZHVsZWQgYnkgYGFzYXBgLCB0aGUgcXVldWUgd2lsbFxuICAgICAgICAvLyBncm93LCBidXQgdG8gYXZvaWQgYW4gTyhuKSB3YWxrIGZvciBldmVyeSB0YXNrIHdlIGV4ZWN1dGUsIHdlIGRvbid0XG4gICAgICAgIC8vIHNoaWZ0IHRhc2tzIG9mZiB0aGUgcXVldWUgYWZ0ZXIgdGhleSBoYXZlIGJlZW4gZXhlY3V0ZWQuXG4gICAgICAgIC8vIEluc3RlYWQsIHdlIHBlcmlvZGljYWxseSBzaGlmdCAxMDI0IHRhc2tzIG9mZiB0aGUgcXVldWUuXG4gICAgICAgIGlmIChpbmRleCA+IGNhcGFjaXR5KSB7XG4gICAgICAgICAgICAvLyBNYW51YWxseSBzaGlmdCBhbGwgdmFsdWVzIHN0YXJ0aW5nIGF0IHRoZSBpbmRleCBiYWNrIHRvIHRoZVxuICAgICAgICAgICAgLy8gYmVnaW5uaW5nIG9mIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgIGZvciAodmFyIHNjYW4gPSAwLCBuZXdMZW5ndGggPSBxdWV1ZS5sZW5ndGggLSBpbmRleDsgc2NhbiA8IG5ld0xlbmd0aDsgc2NhbisrKSB7XG4gICAgICAgICAgICAgICAgcXVldWVbc2Nhbl0gPSBxdWV1ZVtzY2FuICsgaW5kZXhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcXVldWUubGVuZ3RoIC09IGluZGV4O1xuICAgICAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgaW5kZXggPSAwO1xuICAgIGZsdXNoaW5nID0gZmFsc2U7XG59XG5cbi8vIGByZXF1ZXN0Rmx1c2hgIGlzIGltcGxlbWVudGVkIHVzaW5nIGEgc3RyYXRlZ3kgYmFzZWQgb24gZGF0YSBjb2xsZWN0ZWQgZnJvbVxuLy8gZXZlcnkgYXZhaWxhYmxlIFNhdWNlTGFicyBTZWxlbml1bSB3ZWIgZHJpdmVyIHdvcmtlciBhdCB0aW1lIG9mIHdyaXRpbmcuXG4vLyBodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9zcHJlYWRzaGVldHMvZC8xbUctNVVZR3VwNXF4R2RFTVdraFA2QldDejA1M05VYjJFMVFvVVRVMTZ1QS9lZGl0I2dpZD03ODM3MjQ1OTNcblxuLy8gU2FmYXJpIDYgYW5kIDYuMSBmb3IgZGVza3RvcCwgaVBhZCwgYW5kIGlQaG9uZSBhcmUgdGhlIG9ubHkgYnJvd3NlcnMgdGhhdFxuLy8gaGF2ZSBXZWJLaXRNdXRhdGlvbk9ic2VydmVyIGJ1dCBub3QgdW4tcHJlZml4ZWQgTXV0YXRpb25PYnNlcnZlci5cbi8vIE11c3QgdXNlIGBnbG9iYWxgIGluc3RlYWQgb2YgYHdpbmRvd2AgdG8gd29yayBpbiBib3RoIGZyYW1lcyBhbmQgd2ViXG4vLyB3b3JrZXJzLiBgZ2xvYmFsYCBpcyBhIHByb3Zpc2lvbiBvZiBCcm93c2VyaWZ5LCBNciwgTXJzLCBvciBNb3AuXG52YXIgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPSBnbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBnbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcblxuLy8gTXV0YXRpb25PYnNlcnZlcnMgYXJlIGRlc2lyYWJsZSBiZWNhdXNlIHRoZXkgaGF2ZSBoaWdoIHByaW9yaXR5IGFuZCB3b3JrXG4vLyByZWxpYWJseSBldmVyeXdoZXJlIHRoZXkgYXJlIGltcGxlbWVudGVkLlxuLy8gVGhleSBhcmUgaW1wbGVtZW50ZWQgaW4gYWxsIG1vZGVybiBicm93c2Vycy5cbi8vXG4vLyAtIEFuZHJvaWQgNC00LjNcbi8vIC0gQ2hyb21lIDI2LTM0XG4vLyAtIEZpcmVmb3ggMTQtMjlcbi8vIC0gSW50ZXJuZXQgRXhwbG9yZXIgMTFcbi8vIC0gaVBhZCBTYWZhcmkgNi03LjFcbi8vIC0gaVBob25lIFNhZmFyaSA3LTcuMVxuLy8gLSBTYWZhcmkgNi03XG5pZiAodHlwZW9mIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICByZXF1ZXN0Rmx1c2ggPSBtYWtlUmVxdWVzdENhbGxGcm9tTXV0YXRpb25PYnNlcnZlcihmbHVzaCk7XG5cbi8vIE1lc3NhZ2VDaGFubmVscyBhcmUgZGVzaXJhYmxlIGJlY2F1c2UgdGhleSBnaXZlIGRpcmVjdCBhY2Nlc3MgdG8gdGhlIEhUTUxcbi8vIHRhc2sgcXVldWUsIGFyZSBpbXBsZW1lbnRlZCBpbiBJbnRlcm5ldCBFeHBsb3JlciAxMCwgU2FmYXJpIDUuMC0xLCBhbmQgT3BlcmFcbi8vIDExLTEyLCBhbmQgaW4gd2ViIHdvcmtlcnMgaW4gbWFueSBlbmdpbmVzLlxuLy8gQWx0aG91Z2ggbWVzc2FnZSBjaGFubmVscyB5aWVsZCB0byBhbnkgcXVldWVkIHJlbmRlcmluZyBhbmQgSU8gdGFza3MsIHRoZXlcbi8vIHdvdWxkIGJlIGJldHRlciB0aGFuIGltcG9zaW5nIHRoZSA0bXMgZGVsYXkgb2YgdGltZXJzLlxuLy8gSG93ZXZlciwgdGhleSBkbyBub3Qgd29yayByZWxpYWJseSBpbiBJbnRlcm5ldCBFeHBsb3JlciBvciBTYWZhcmkuXG5cbi8vIEludGVybmV0IEV4cGxvcmVyIDEwIGlzIHRoZSBvbmx5IGJyb3dzZXIgdGhhdCBoYXMgc2V0SW1tZWRpYXRlIGJ1dCBkb2VzXG4vLyBub3QgaGF2ZSBNdXRhdGlvbk9ic2VydmVycy5cbi8vIEFsdGhvdWdoIHNldEltbWVkaWF0ZSB5aWVsZHMgdG8gdGhlIGJyb3dzZXIncyByZW5kZXJlciwgaXQgd291bGQgYmVcbi8vIHByZWZlcnJhYmxlIHRvIGZhbGxpbmcgYmFjayB0byBzZXRUaW1lb3V0IHNpbmNlIGl0IGRvZXMgbm90IGhhdmVcbi8vIHRoZSBtaW5pbXVtIDRtcyBwZW5hbHR5LlxuLy8gVW5mb3J0dW5hdGVseSB0aGVyZSBhcHBlYXJzIHRvIGJlIGEgYnVnIGluIEludGVybmV0IEV4cGxvcmVyIDEwIE1vYmlsZSAoYW5kXG4vLyBEZXNrdG9wIHRvIGEgbGVzc2VyIGV4dGVudCkgdGhhdCByZW5kZXJzIGJvdGggc2V0SW1tZWRpYXRlIGFuZFxuLy8gTWVzc2FnZUNoYW5uZWwgdXNlbGVzcyBmb3IgdGhlIHB1cnBvc2VzIG9mIEFTQVAuXG4vLyBodHRwczovL2dpdGh1Yi5jb20va3Jpc2tvd2FsL3EvaXNzdWVzLzM5NlxuXG4vLyBUaW1lcnMgYXJlIGltcGxlbWVudGVkIHVuaXZlcnNhbGx5LlxuLy8gV2UgZmFsbCBiYWNrIHRvIHRpbWVycyBpbiB3b3JrZXJzIGluIG1vc3QgZW5naW5lcywgYW5kIGluIGZvcmVncm91bmRcbi8vIGNvbnRleHRzIGluIHRoZSBmb2xsb3dpbmcgYnJvd3NlcnMuXG4vLyBIb3dldmVyLCBub3RlIHRoYXQgZXZlbiB0aGlzIHNpbXBsZSBjYXNlIHJlcXVpcmVzIG51YW5jZXMgdG8gb3BlcmF0ZSBpbiBhXG4vLyBicm9hZCBzcGVjdHJ1bSBvZiBicm93c2Vycy5cbi8vXG4vLyAtIEZpcmVmb3ggMy0xM1xuLy8gLSBJbnRlcm5ldCBFeHBsb3JlciA2LTlcbi8vIC0gaVBhZCBTYWZhcmkgNC4zXG4vLyAtIEx5bnggMi44Ljdcbn0gZWxzZSB7XG4gICAgcmVxdWVzdEZsdXNoID0gbWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKGZsdXNoKTtcbn1cblxuLy8gYHJlcXVlc3RGbHVzaGAgcmVxdWVzdHMgdGhhdCB0aGUgaGlnaCBwcmlvcml0eSBldmVudCBxdWV1ZSBiZSBmbHVzaGVkIGFzXG4vLyBzb29uIGFzIHBvc3NpYmxlLlxuLy8gVGhpcyBpcyB1c2VmdWwgdG8gcHJldmVudCBhbiBlcnJvciB0aHJvd24gaW4gYSB0YXNrIGZyb20gc3RhbGxpbmcgdGhlIGV2ZW50XG4vLyBxdWV1ZSBpZiB0aGUgZXhjZXB0aW9uIGhhbmRsZWQgYnkgTm9kZS5qc+KAmXNcbi8vIGBwcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIilgIG9yIGJ5IGEgZG9tYWluLlxucmF3QXNhcC5yZXF1ZXN0Rmx1c2ggPSByZXF1ZXN0Rmx1c2g7XG5cbi8vIFRvIHJlcXVlc3QgYSBoaWdoIHByaW9yaXR5IGV2ZW50LCB3ZSBpbmR1Y2UgYSBtdXRhdGlvbiBvYnNlcnZlciBieSB0b2dnbGluZ1xuLy8gdGhlIHRleHQgb2YgYSB0ZXh0IG5vZGUgYmV0d2VlbiBcIjFcIiBhbmQgXCItMVwiLlxuZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbU11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spIHtcbiAgICB2YXIgdG9nZ2xlID0gMTtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spO1xuICAgIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7Y2hhcmFjdGVyRGF0YTogdHJ1ZX0pO1xuICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcbiAgICAgICAgdG9nZ2xlID0gLXRvZ2dsZTtcbiAgICAgICAgbm9kZS5kYXRhID0gdG9nZ2xlO1xuICAgIH07XG59XG5cbi8vIFRoZSBtZXNzYWdlIGNoYW5uZWwgdGVjaG5pcXVlIHdhcyBkaXNjb3ZlcmVkIGJ5IE1hbHRlIFVibCBhbmQgd2FzIHRoZVxuLy8gb3JpZ2luYWwgZm91bmRhdGlvbiBmb3IgdGhpcyBsaWJyYXJ5LlxuLy8gaHR0cDovL3d3dy5ub25ibG9ja2luZy5pby8yMDExLzA2L3dpbmRvd25leHR0aWNrLmh0bWxcblxuLy8gU2FmYXJpIDYuMC41IChhdCBsZWFzdCkgaW50ZXJtaXR0ZW50bHkgZmFpbHMgdG8gY3JlYXRlIG1lc3NhZ2UgcG9ydHMgb24gYVxuLy8gcGFnZSdzIGZpcnN0IGxvYWQuIFRoYW5rZnVsbHksIHRoaXMgdmVyc2lvbiBvZiBTYWZhcmkgc3VwcG9ydHNcbi8vIE11dGF0aW9uT2JzZXJ2ZXJzLCBzbyB3ZSBkb24ndCBuZWVkIHRvIGZhbGwgYmFjayBpbiB0aGF0IGNhc2UuXG5cbi8vIGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21NZXNzYWdlQ2hhbm5lbChjYWxsYmFjaykge1xuLy8gICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4vLyAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBjYWxsYmFjaztcbi8vICAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG4vLyAgICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4vLyAgICAgfTtcbi8vIH1cblxuLy8gRm9yIHJlYXNvbnMgZXhwbGFpbmVkIGFib3ZlLCB3ZSBhcmUgYWxzbyB1bmFibGUgdG8gdXNlIGBzZXRJbW1lZGlhdGVgXG4vLyB1bmRlciBhbnkgY2lyY3Vtc3RhbmNlcy5cbi8vIEV2ZW4gaWYgd2Ugd2VyZSwgdGhlcmUgaXMgYW5vdGhlciBidWcgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAuXG4vLyBJdCBpcyBub3Qgc3VmZmljaWVudCB0byBhc3NpZ24gYHNldEltbWVkaWF0ZWAgdG8gYHJlcXVlc3RGbHVzaGAgYmVjYXVzZVxuLy8gYHNldEltbWVkaWF0ZWAgbXVzdCBiZSBjYWxsZWQgKmJ5IG5hbWUqIGFuZCB0aGVyZWZvcmUgbXVzdCBiZSB3cmFwcGVkIGluIGFcbi8vIGNsb3N1cmUuXG4vLyBOZXZlciBmb3JnZXQuXG5cbi8vIGZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21TZXRJbW1lZGlhdGUoY2FsbGJhY2spIHtcbi8vICAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdENhbGwoKSB7XG4vLyAgICAgICAgIHNldEltbWVkaWF0ZShjYWxsYmFjayk7XG4vLyAgICAgfTtcbi8vIH1cblxuLy8gU2FmYXJpIDYuMCBoYXMgYSBwcm9ibGVtIHdoZXJlIHRpbWVycyB3aWxsIGdldCBsb3N0IHdoaWxlIHRoZSB1c2VyIGlzXG4vLyBzY3JvbGxpbmcuIFRoaXMgcHJvYmxlbSBkb2VzIG5vdCBpbXBhY3QgQVNBUCBiZWNhdXNlIFNhZmFyaSA2LjAgc3VwcG9ydHNcbi8vIG11dGF0aW9uIG9ic2VydmVycywgc28gdGhhdCBpbXBsZW1lbnRhdGlvbiBpcyB1c2VkIGluc3RlYWQuXG4vLyBIb3dldmVyLCBpZiB3ZSBldmVyIGVsZWN0IHRvIHVzZSB0aW1lcnMgaW4gU2FmYXJpLCB0aGUgcHJldmFsZW50IHdvcmstYXJvdW5kXG4vLyBpcyB0byBhZGQgYSBzY3JvbGwgZXZlbnQgbGlzdGVuZXIgdGhhdCBjYWxscyBmb3IgYSBmbHVzaC5cblxuLy8gYHNldFRpbWVvdXRgIGRvZXMgbm90IGNhbGwgdGhlIHBhc3NlZCBjYWxsYmFjayBpZiB0aGUgZGVsYXkgaXMgbGVzcyB0aGFuXG4vLyBhcHByb3hpbWF0ZWx5IDcgaW4gd2ViIHdvcmtlcnMgaW4gRmlyZWZveCA4IHRocm91Z2ggMTgsIGFuZCBzb21ldGltZXMgbm90XG4vLyBldmVuIHRoZW4uXG5cbmZ1bmN0aW9uIG1ha2VSZXF1ZXN0Q2FsbEZyb21UaW1lcihjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcbiAgICAgICAgLy8gV2UgZGlzcGF0Y2ggYSB0aW1lb3V0IHdpdGggYSBzcGVjaWZpZWQgZGVsYXkgb2YgMCBmb3IgZW5naW5lcyB0aGF0XG4gICAgICAgIC8vIGNhbiByZWxpYWJseSBhY2NvbW1vZGF0ZSB0aGF0IHJlcXVlc3QuIFRoaXMgd2lsbCB1c3VhbGx5IGJlIHNuYXBwZWRcbiAgICAgICAgLy8gdG8gYSA0IG1pbGlzZWNvbmQgZGVsYXksIGJ1dCBvbmNlIHdlJ3JlIGZsdXNoaW5nLCB0aGVyZSdzIG5vIGRlbGF5XG4gICAgICAgIC8vIGJldHdlZW4gZXZlbnRzLlxuICAgICAgICB2YXIgdGltZW91dEhhbmRsZSA9IHNldFRpbWVvdXQoaGFuZGxlVGltZXIsIDApO1xuICAgICAgICAvLyBIb3dldmVyLCBzaW5jZSB0aGlzIHRpbWVyIGdldHMgZnJlcXVlbnRseSBkcm9wcGVkIGluIEZpcmVmb3hcbiAgICAgICAgLy8gd29ya2Vycywgd2UgZW5saXN0IGFuIGludGVydmFsIGhhbmRsZSB0aGF0IHdpbGwgdHJ5IHRvIGZpcmVcbiAgICAgICAgLy8gYW4gZXZlbnQgMjAgdGltZXMgcGVyIHNlY29uZCB1bnRpbCBpdCBzdWNjZWVkcy5cbiAgICAgICAgdmFyIGludGVydmFsSGFuZGxlID0gc2V0SW50ZXJ2YWwoaGFuZGxlVGltZXIsIDUwKTtcblxuICAgICAgICBmdW5jdGlvbiBoYW5kbGVUaW1lcigpIHtcbiAgICAgICAgICAgIC8vIFdoaWNoZXZlciB0aW1lciBzdWNjZWVkcyB3aWxsIGNhbmNlbCBib3RoIHRpbWVycyBhbmRcbiAgICAgICAgICAgIC8vIGV4ZWN1dGUgdGhlIGNhbGxiYWNrLlxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRIYW5kbGUpO1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbEhhbmRsZSk7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuLy8gVGhpcyBpcyBmb3IgYGFzYXAuanNgIG9ubHkuXG4vLyBJdHMgbmFtZSB3aWxsIGJlIHBlcmlvZGljYWxseSByYW5kb21pemVkIHRvIGJyZWFrIGFueSBjb2RlIHRoYXQgZGVwZW5kcyBvblxuLy8gaXRzIGV4aXN0ZW5jZS5cbnJhd0FzYXAubWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyID0gbWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyO1xuXG4vLyBBU0FQIHdhcyBvcmlnaW5hbGx5IGEgbmV4dFRpY2sgc2hpbSBpbmNsdWRlZCBpbiBRLiBUaGlzIHdhcyBmYWN0b3JlZCBvdXRcbi8vIGludG8gdGhpcyBBU0FQIHBhY2thZ2UuIEl0IHdhcyBsYXRlciBhZGFwdGVkIHRvIFJTVlAgd2hpY2ggbWFkZSBmdXJ0aGVyXG4vLyBhbWVuZG1lbnRzLiBUaGVzZSBkZWNpc2lvbnMsIHBhcnRpY3VsYXJseSB0byBtYXJnaW5hbGl6ZSBNZXNzYWdlQ2hhbm5lbCBhbmRcbi8vIHRvIGNhcHR1cmUgdGhlIE11dGF0aW9uT2JzZXJ2ZXIgaW1wbGVtZW50YXRpb24gaW4gYSBjbG9zdXJlLCB3ZXJlIGludGVncmF0ZWRcbi8vIGJhY2sgaW50byBBU0FQIHByb3Blci5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS90aWxkZWlvL3JzdnAuanMvYmxvYi9jZGRmNzIzMjU0NmE5Y2Y4NTg1MjRiNzVjZGU2ZjllZGY3MjYyMGE3L2xpYi9yc3ZwL2FzYXAuanNcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgZG9tYWluOyAvLyBUaGUgZG9tYWluIG1vZHVsZSBpcyBleGVjdXRlZCBvbiBkZW1hbmRcbnZhciBoYXNTZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCI7XG5cbi8vIFVzZSB0aGUgZmFzdGVzdCBtZWFucyBwb3NzaWJsZSB0byBleGVjdXRlIGEgdGFzayBpbiBpdHMgb3duIHR1cm4sIHdpdGhcbi8vIHByaW9yaXR5IG92ZXIgb3RoZXIgZXZlbnRzIGluY2x1ZGluZyBuZXR3b3JrIElPIGV2ZW50cyBpbiBOb2RlLmpzLlxuLy9cbi8vIEFuIGV4Y2VwdGlvbiB0aHJvd24gYnkgYSB0YXNrIHdpbGwgcGVybWFuZW50bHkgaW50ZXJydXB0IHRoZSBwcm9jZXNzaW5nIG9mXG4vLyBzdWJzZXF1ZW50IHRhc2tzLiBUaGUgaGlnaGVyIGxldmVsIGBhc2FwYCBmdW5jdGlvbiBlbnN1cmVzIHRoYXQgaWYgYW5cbi8vIGV4Y2VwdGlvbiBpcyB0aHJvd24gYnkgYSB0YXNrLCB0aGF0IHRoZSB0YXNrIHF1ZXVlIHdpbGwgY29udGludWUgZmx1c2hpbmcgYXNcbi8vIHNvb24gYXMgcG9zc2libGUsIGJ1dCBpZiB5b3UgdXNlIGByYXdBc2FwYCBkaXJlY3RseSwgeW91IGFyZSByZXNwb25zaWJsZSB0b1xuLy8gZWl0aGVyIGVuc3VyZSB0aGF0IG5vIGV4Y2VwdGlvbnMgYXJlIHRocm93biBmcm9tIHlvdXIgdGFzaywgb3IgdG8gbWFudWFsbHlcbi8vIGNhbGwgYHJhd0FzYXAucmVxdWVzdEZsdXNoYCBpZiBhbiBleGNlcHRpb24gaXMgdGhyb3duLlxubW9kdWxlLmV4cG9ydHMgPSByYXdBc2FwO1xuZnVuY3Rpb24gcmF3QXNhcCh0YXNrKSB7XG4gICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcmVxdWVzdEZsdXNoKCk7XG4gICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICB9XG4gICAgLy8gQXZvaWRzIGEgZnVuY3Rpb24gY2FsbFxuICAgIHF1ZXVlW3F1ZXVlLmxlbmd0aF0gPSB0YXNrO1xufVxuXG52YXIgcXVldWUgPSBbXTtcbi8vIE9uY2UgYSBmbHVzaCBoYXMgYmVlbiByZXF1ZXN0ZWQsIG5vIGZ1cnRoZXIgY2FsbHMgdG8gYHJlcXVlc3RGbHVzaGAgYXJlXG4vLyBuZWNlc3NhcnkgdW50aWwgdGhlIG5leHQgYGZsdXNoYCBjb21wbGV0ZXMuXG52YXIgZmx1c2hpbmcgPSBmYWxzZTtcbi8vIFRoZSBwb3NpdGlvbiBvZiB0aGUgbmV4dCB0YXNrIHRvIGV4ZWN1dGUgaW4gdGhlIHRhc2sgcXVldWUuIFRoaXMgaXNcbi8vIHByZXNlcnZlZCBiZXR3ZWVuIGNhbGxzIHRvIGBmbHVzaGAgc28gdGhhdCBpdCBjYW4gYmUgcmVzdW1lZCBpZlxuLy8gYSB0YXNrIHRocm93cyBhbiBleGNlcHRpb24uXG52YXIgaW5kZXggPSAwO1xuLy8gSWYgYSB0YXNrIHNjaGVkdWxlcyBhZGRpdGlvbmFsIHRhc2tzIHJlY3Vyc2l2ZWx5LCB0aGUgdGFzayBxdWV1ZSBjYW4gZ3Jvd1xuLy8gdW5ib3VuZGVkLiBUbyBwcmV2ZW50IG1lbW9yeSBleGNhdXN0aW9uLCB0aGUgdGFzayBxdWV1ZSB3aWxsIHBlcmlvZGljYWxseVxuLy8gdHJ1bmNhdGUgYWxyZWFkeS1jb21wbGV0ZWQgdGFza3MuXG52YXIgY2FwYWNpdHkgPSAxMDI0O1xuXG4vLyBUaGUgZmx1c2ggZnVuY3Rpb24gcHJvY2Vzc2VzIGFsbCB0YXNrcyB0aGF0IGhhdmUgYmVlbiBzY2hlZHVsZWQgd2l0aFxuLy8gYHJhd0FzYXBgIHVubGVzcyBhbmQgdW50aWwgb25lIG9mIHRob3NlIHRhc2tzIHRocm93cyBhbiBleGNlcHRpb24uXG4vLyBJZiBhIHRhc2sgdGhyb3dzIGFuIGV4Y2VwdGlvbiwgYGZsdXNoYCBlbnN1cmVzIHRoYXQgaXRzIHN0YXRlIHdpbGwgcmVtYWluXG4vLyBjb25zaXN0ZW50IGFuZCB3aWxsIHJlc3VtZSB3aGVyZSBpdCBsZWZ0IG9mZiB3aGVuIGNhbGxlZCBhZ2Fpbi5cbi8vIEhvd2V2ZXIsIGBmbHVzaGAgZG9lcyBub3QgbWFrZSBhbnkgYXJyYW5nZW1lbnRzIHRvIGJlIGNhbGxlZCBhZ2FpbiBpZiBhblxuLy8gZXhjZXB0aW9uIGlzIHRocm93bi5cbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIHdoaWxlIChpbmRleCA8IHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICB2YXIgY3VycmVudEluZGV4ID0gaW5kZXg7XG4gICAgICAgIC8vIEFkdmFuY2UgdGhlIGluZGV4IGJlZm9yZSBjYWxsaW5nIHRoZSB0YXNrLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSB3aWxsXG4gICAgICAgIC8vIGJlZ2luIGZsdXNoaW5nIG9uIHRoZSBuZXh0IHRhc2sgdGhlIHRhc2sgdGhyb3dzIGFuIGVycm9yLlxuICAgICAgICBpbmRleCA9IGluZGV4ICsgMTtcbiAgICAgICAgcXVldWVbY3VycmVudEluZGV4XS5jYWxsKCk7XG4gICAgICAgIC8vIFByZXZlbnQgbGVha2luZyBtZW1vcnkgZm9yIGxvbmcgY2hhaW5zIG9mIHJlY3Vyc2l2ZSBjYWxscyB0byBgYXNhcGAuXG4gICAgICAgIC8vIElmIHdlIGNhbGwgYGFzYXBgIHdpdGhpbiB0YXNrcyBzY2hlZHVsZWQgYnkgYGFzYXBgLCB0aGUgcXVldWUgd2lsbFxuICAgICAgICAvLyBncm93LCBidXQgdG8gYXZvaWQgYW4gTyhuKSB3YWxrIGZvciBldmVyeSB0YXNrIHdlIGV4ZWN1dGUsIHdlIGRvbid0XG4gICAgICAgIC8vIHNoaWZ0IHRhc2tzIG9mZiB0aGUgcXVldWUgYWZ0ZXIgdGhleSBoYXZlIGJlZW4gZXhlY3V0ZWQuXG4gICAgICAgIC8vIEluc3RlYWQsIHdlIHBlcmlvZGljYWxseSBzaGlmdCAxMDI0IHRhc2tzIG9mZiB0aGUgcXVldWUuXG4gICAgICAgIGlmIChpbmRleCA+IGNhcGFjaXR5KSB7XG4gICAgICAgICAgICAvLyBNYW51YWxseSBzaGlmdCBhbGwgdmFsdWVzIHN0YXJ0aW5nIGF0IHRoZSBpbmRleCBiYWNrIHRvIHRoZVxuICAgICAgICAgICAgLy8gYmVnaW5uaW5nIG9mIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgIGZvciAodmFyIHNjYW4gPSAwLCBuZXdMZW5ndGggPSBxdWV1ZS5sZW5ndGggLSBpbmRleDsgc2NhbiA8IG5ld0xlbmd0aDsgc2NhbisrKSB7XG4gICAgICAgICAgICAgICAgcXVldWVbc2Nhbl0gPSBxdWV1ZVtzY2FuICsgaW5kZXhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcXVldWUubGVuZ3RoIC09IGluZGV4O1xuICAgICAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgaW5kZXggPSAwO1xuICAgIGZsdXNoaW5nID0gZmFsc2U7XG59XG5cbnJhd0FzYXAucmVxdWVzdEZsdXNoID0gcmVxdWVzdEZsdXNoO1xuZnVuY3Rpb24gcmVxdWVzdEZsdXNoKCkge1xuICAgIC8vIEVuc3VyZSBmbHVzaGluZyBpcyBub3QgYm91bmQgdG8gYW55IGRvbWFpbi5cbiAgICAvLyBJdCBpcyBub3Qgc3VmZmljaWVudCB0byBleGl0IHRoZSBkb21haW4sIGJlY2F1c2UgZG9tYWlucyBleGlzdCBvbiBhIHN0YWNrLlxuICAgIC8vIFRvIGV4ZWN1dGUgY29kZSBvdXRzaWRlIG9mIGFueSBkb21haW4sIHRoZSBmb2xsb3dpbmcgZGFuY2UgaXMgbmVjZXNzYXJ5LlxuICAgIHZhciBwYXJlbnREb21haW4gPSBwcm9jZXNzLmRvbWFpbjtcbiAgICBpZiAocGFyZW50RG9tYWluKSB7XG4gICAgICAgIGlmICghZG9tYWluKSB7XG4gICAgICAgICAgICAvLyBMYXp5IGV4ZWN1dGUgdGhlIGRvbWFpbiBtb2R1bGUuXG4gICAgICAgICAgICAvLyBPbmx5IGVtcGxveWVkIGlmIHRoZSB1c2VyIGVsZWN0cyB0byB1c2UgZG9tYWlucy5cbiAgICAgICAgICAgIGRvbWFpbiA9IHJlcXVpcmUoXCJkb21haW5cIik7XG4gICAgICAgIH1cbiAgICAgICAgZG9tYWluLmFjdGl2ZSA9IHByb2Nlc3MuZG9tYWluID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBgc2V0SW1tZWRpYXRlYCBpcyBzbG93ZXIgdGhhdCBgcHJvY2Vzcy5uZXh0VGlja2AsIGJ1dCBgcHJvY2Vzcy5uZXh0VGlja2BcbiAgICAvLyBjYW5ub3QgaGFuZGxlIHJlY3Vyc2lvbi5cbiAgICAvLyBgcmVxdWVzdEZsdXNoYCB3aWxsIG9ubHkgYmUgY2FsbGVkIHJlY3Vyc2l2ZWx5IGZyb20gYGFzYXAuanNgLCB0byByZXN1bWVcbiAgICAvLyBmbHVzaGluZyBhZnRlciBhbiBlcnJvciBpcyB0aHJvd24gaW50byBhIGRvbWFpbi5cbiAgICAvLyBDb252ZW5pZW50bHksIGBzZXRJbW1lZGlhdGVgIHdhcyBpbnRyb2R1Y2VkIGluIHRoZSBzYW1lIHZlcnNpb25cbiAgICAvLyBgcHJvY2Vzcy5uZXh0VGlja2Agc3RhcnRlZCB0aHJvd2luZyByZWN1cnNpb24gZXJyb3JzLlxuICAgIGlmIChmbHVzaGluZyAmJiBoYXNTZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgc2V0SW1tZWRpYXRlKGZsdXNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgICB9XG5cbiAgICBpZiAocGFyZW50RG9tYWluKSB7XG4gICAgICAgIGRvbWFpbi5hY3RpdmUgPSBwcm9jZXNzLmRvbWFpbiA9IHBhcmVudERvbWFpbjtcbiAgICB9XG59XG4iLCJkaXN0YW5jZSA9IHJlcXVpcmUgJy4vc3F1YXJlLWRpc3RhbmNlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGFwaSA9IHt9XG5cbiAgdG90YWxzID0gWzAsIDAsIDBdXG4gIHZlY3RvcnMgPSBbXVxuICBjZW50cm9pZCA9IG51bGxcbiAgbGFzdE51bVZlY3RvcnMgPSBudWxsXG5cbiAgYXBpLmFkZCA9ICh2ZWN0b3IpIC0+XG4gICAgdG90YWxzW2ldICs9IHZhbCBmb3IgdmFsLCBpIGluIHZlY3RvclxuICAgIHZlY3RvcnMucHVzaCB2ZWN0b3JcblxuICBhcGkuY291bnQgPSAtPlxuICAgIHZlY3RvcnMubGVuZ3RoXG5cbiAgYXBpLmNlbnRyb2lkID0gLT5cbiAgICByZXR1cm4gY2VudHJvaWQgaWYgY2VudHJvaWQ/IGFuZCBsYXN0TnVtVmVjdG9ycyA9PSB2ZWN0b3JzLmxlbmd0aFxuICAgIG1lYW4gPSBhcGkubWVhbigpXG5cbiAgICByZXR1cm4gdW5sZXNzIG1lYW5cbiAgICBjZW50cm9pZCA9IHZlY3RvcnNbMF1cbiAgICBsYXN0TnVtVmVjdG9ycyA9IHZlY3RvcnMubGVuZ3RoXG4gICAgc21hbGxlc3REaXN0ID0gZGlzdGFuY2UobWVhbiwgY2VudHJvaWQpXG5cbiAgICBmb3IgdmVjdG9yIGluIHZlY3RvcnNbMS4uXVxuICAgICAgY29udGludWUgdW5sZXNzIChkaXN0ID0gZGlzdGFuY2UobWVhbiwgdmVjdG9yKSkgPCBzbWFsbGVzdERpc3RcbiAgICAgIGNlbnRyb2lkID0gdmVjdG9yXG4gICAgICBzbWFsbGVzdERpc3QgPSBkaXN0XG5cbiAgICBjZW50cm9pZFxuXG4gIGFwaS5tZWFuID0gLT5cbiAgICByZXR1cm4gaWYgKGNvdW50ID0gdmVjdG9ycy5sZW5ndGgpID09IDBcbiAgICAoTWF0aC5yb3VuZCh0b3RhbC9jb3VudCkgZm9yIHRvdGFsIGluIHRvdGFscylcblxuICBhcGkuY2xlYXIgPSAtPlxuICAgIHRvdGFscyA9IG51bGxcbiAgICB2ZWN0b3JzLmxlbmd0aCA9IDBcbiAgICBjZW50cm9pZCA9IG51bGxcbiAgICBsYXN0TnVtVmVjdG9ycyA9IG51bGxcblxuICBhcGlcbiIsIkNsdXN0ZXIgID0gcmVxdWlyZSAnLi9jbHVzdGVyJ1xuZGlzdGFuY2UgPSByZXF1aXJlICcuL3NxdWFyZS1kaXN0YW5jZSdcblxuIyBGaW5kcyBudW1DbHVzdGVycyBjbHVzdGVycyBpbiB2ZWN0b3JzIChiYXNlZCBvbiBnZW9tZXRyaWMgZGlzdGFuY2UpXG4jIFNvbWV3aGF0IGstbWVhbnMgbGlrZSwgSSBndWVzc1xubW9kdWxlLmV4cG9ydHMgPSAodmVjdG9ycywgbnVtQ2x1c3RlcnMsIG1heFRyaWVzKSAtPlxuICBudW1DbHVzdGVycyA9IE1hdGgubWluIHZlY3RvcnMubGVuZ3RoLCBudW1DbHVzdGVyc1xuICByZXR1cm4gYmFpbCh2ZWN0b3JzLCBudW1DbHVzdGVycykgaWYgdmVjdG9ycy5sZW5ndGggPT0gbnVtQ2x1c3RlcnNcblxuICBudW1UcmllcyAgPSAwXG4gIGNlbnRyb2lkcyA9IHBpY2tFdmVubHkobnVtQ2x1c3RlcnMsIDMsIDI1NSlcbiAgcHJldkNsdXN0ZXJzID0gbnVsbFxuXG4gIHdoaWxlIG51bVRyaWVzIDwgbWF4VHJpZXMgYW5kICFjZW50cm9pZHNFcXVhbChjZW50cm9pZHMsIHByZXZDbHVzdGVycylcbiAgICBwcmV2Q2x1c3RlcnMgPSBjbHVzdGVyc1xuICAgIGNsdXN0ZXJzICA9IChDbHVzdGVyKCkgZm9yIGkgaW4gWzAuLi5udW1DbHVzdGVyc10pXG4gICAgY2VudHJvaWRzID0gc3RlcCh2ZWN0b3JzLCBjZW50cm9pZHMsIGNsdXN0ZXJzKVxuICAgIG51bVRyaWVzKytcblxuICBjbHVzdGVyc1xuXG5zdGVwID0gKHZlY3RvcnMsIGNlbnRyb2lkcywgY2x1c3RlcnMpIC0+XG4gIGZvciB2ZWN0b3IgaW4gdmVjdG9yc1xuICAgIGNsdXN0ZXIgPSBjbHVzdGVyc1tjbG9zZXN0Q2x1c3RlcklkeChjZW50cm9pZHMsIHZlY3RvcildXG4gICAgY2x1c3Rlci5hZGQgdmVjdG9yXG5cbiAgKGNsdXN0ZXIubWVhbigpIGZvciBjbHVzdGVyLCBpIGluIGNsdXN0ZXJzIHdoZW4gY2x1c3Rlci5jb3VudCgpID4gMClcblxuY2xvc2VzdENsdXN0ZXJJZHggPSAoY2VudHJvaWRzLCB2ZWN0b3IpIC0+XG4gIGNsb3Nlc3QgPSAwXG4gIHNtYWxsZXN0RGlzdCA9IDE5NTA3NiAjIGxhcmdlc3QgcG9zc2libGUgc3F1YXJlIGRpc3RhbmNlIGlzIDE5NTA3NSAoMjU1XjIgKiAzKVxuXG4gIGZvciBjLCBpZHggaW4gY2VudHJvaWRzXG4gICAgZGlzdCA9IGRpc3RhbmNlKGMsIHZlY3RvcilcbiAgICBpZiBkaXN0IDwgc21hbGxlc3REaXN0XG4gICAgICBjbG9zZXN0ID0gaWR4XG4gICAgICBzbWFsbGVzdERpc3QgPSBkaXN0XG5cbiAgY2xvc2VzdFxuXG5waWNrUmFuZG9tID0gKG4sIHNhbXBsZXMpIC0+XG4gIHBpY2tzID0gW11cbiAgc2FtcGxlcyA9ICh2IGZvciB2IGluIHNhbXBsZXMpXG5cbiAgZm9yIF8gaW4gWzAuLi5uXVxuICAgIGlkeCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNhbXBsZXMubGVuZ3RoKVxuICAgIHBpY2tzLnB1c2goc2FtcGxlc1tpZHhdKVxuICAgIHNhbXBsZXMuc3BsaWNlKGlkeCwgMSlcbiAgcGlja3NcblxucGlja0V2ZW5seSA9IChuLCBkaW1lbnNpb25zLCByYW5nZSkgLT5cbiAgY2h1bmsgPSByYW5nZSAvIG5cbiAgdmVjdG9ycyA9IFtdXG5cbiAgZm9yIGkgaW4gWzAuLi5uXVxuICAgIHMgPSBNYXRoLnJvdW5kIGNodW5rICogaSArIGNodW5rLzJcbiAgICB2ZWN0b3JzLnB1c2ggKHMgZm9yIGRpbSBpbiBbMC4uLmRpbWVuc2lvbnNdKVxuXG4gIHZlY3RvcnNcblxuY2VudHJvaWRzRXF1YWwgPSAob2xkLCBjbHVzdGVycykgLT5cbiAgcmV0dXJuIGZhbHNlIHVubGVzcyBjbHVzdGVyc1xuICBmb3IgY2VudHJvaWQsIGkgaW4gb2xkXG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyB2ZWN0b3JzRXF1YWwoY2VudHJvaWQsIGNsdXN0ZXJzW2ldLmNlbnRyb2lkKCkpXG5cbiAgdHJ1ZVxuXG52ZWN0b3JzRXF1YWwgPSAoYSwgYikgLT5cbiAgcmV0dXJuIGZhbHNlIGlmIChhIGFuZCAhYikgb3IgKGIgYW5kICFhKSBvciAoIWEgYW5kICFiKVxuICBmb3IgdmFsLCBpIGluIGFcbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHZhbCA9PSBiW2ldXG5cbiAgdHJ1ZVxuXG5iYWlsID0gKHZlY3RvcnMsIG51bUNsdXN0ZXJzKSAtPlxuICBjbHVzdGVycyA9IChDbHVzdGVyKCkgZm9yIGkgaW4gWzAuLi5udW1DbHVzdGVyc10pXG4gIGNsdXN0ZXIuYWRkKHZlY3RvcnMuYXQoaSkpIGZvciBjbHVzdGVyLCBpIGluIGNsdXN0ZXJzXG4gIGNsdXN0ZXJzXG4iLCJ2YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ3Byb21pc2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbWFnZURhdGEoc3JjT3JJbWcsIG1heFBpeGVscykge1xuICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihhY2NlcHQsIHJlamVjdCkge1xuICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyBhY2NlcHQodG9EYXRhKGltYWdlLCBtYXhQaXhlbHMpKTsgfTtcbiAgfSk7XG5cbiAgaW1hZ2Uuc3JjID0gc3JjT3JJbWcuc3JjID8gc3JjT3JJbWcuc3JjIDogKHNyY09ySW1nIHx8ICcnKTtcblxuICByZXR1cm4gcHJvbWlzZTtcbn07XG5cbmZ1bmN0aW9uIHRvRGF0YShpbWFnZSwgbWF4UGl4ZWxzKSB7XG4gIHZhciBzaXplID0gY2xhbXBJbWFnZVNpemUoaW1hZ2UsIG1heFBpeGVscyk7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gIGNhbnZhcy53aWR0aCA9IHNpemUud2lkdGg7XG4gIGNhbnZhcy5oZWlnaHQgPSBzaXplLmhlaWdodDtcbiAgY3R4LmRyYXdJbWFnZShpbWFnZSwgMCwgMCwgc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQpO1xuXG4gIHJldHVybiBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIHNpemUud2lkdGgsIHNpemUuaGVpZ2h0KVxuICAgIC5kYXRhO1xufVxuXG5mdW5jdGlvbiBjbGFtcEltYWdlU2l6ZShpbWFnZSwgbWF4UGl4ZWxzKSB7XG4gIHZhciBhc3BlY3QgPSBpbWFnZS53aWR0aCAvIGltYWdlLmhlaWdodDtcbiAgdmFyIGhlaWdodCA9IE1hdGguc3FydChtYXhQaXhlbHMgLyBhc3BlY3QpO1xuICB2YXIgd2lkdGggPSBoZWlnaHQgKiBhc3BlY3Q7XG5cbiAgcmV0dXJuIHtcbiAgICB3aWR0aDogTWF0aC5yb3VuZCh3aWR0aCksXG4gICAgaGVpZ2h0OiBNYXRoLnJvdW5kKGhlaWdodClcbiAgfTtcbn1cbiIsIi8vIENhbGN1bGF0ZXMgdGhlIHNxdWFyZSBkaXN0YW5jZSBvZiB0d28gdmVjdG9ycyAocHJlc2VudGVkIGFzIGFycmF5cykuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNxdWFyZURpc3RhbmNlKGEsIGIpIHtcbiAgdmFyIGRlbHRhU3VtID0gMDtcbiAgdmFyIGRpbSA9IGEubGVuZ3RoO1xuXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBkaW07IGkrKylcbiAgICBkZWx0YVN1bSA9IGRlbHRhU3VtICsgTWF0aC5wb3coKGJbaV0gLSBhW2ldKSwgMik7XG5cbiAgcmV0dXJuIGRlbHRhU3VtO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9SZ2JBcnJheShpbWFnZURhdGEpIHtcbiAgdmFyIHJnYlZlY3RvcnMgPSBbXTtcbiAgdmFyIG51bVBpeGVscyA9IGltYWdlRGF0YS5sZW5ndGggLyA0O1xuICB2YXIgb2Zmc2V0O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUGl4ZWxzOyBpKyspIHtcbiAgICBvZmZzZXQgPSBpICogNDtcbiAgICByZ2JWZWN0b3JzLnB1c2goXG4gICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoaW1hZ2VEYXRhLCBbb2Zmc2V0LCBvZmZzZXQrM10pXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiByZ2JWZWN0b3JzO1xufTtcbiIsIkltYWdlRGF0YSA9IHJlcXVpcmUgXCIuLi9zcmMvaW1hZ2UtZGF0YVwiXG5QYWxldHRlID0gcmVxdWlyZSBcIi4uL1wiXG5cbm1ha2VQYWxldHRlRWwgPSAoaW1hZ2UsIHBhbGV0dGUpIC0+XG4gIGltYWdlLnN0eWxlLmJvcmRlciA9ICcxcHggc29saWQgI2NjYydcbiAgaW1hZ2Uuc3R5bGUubWF4V2lkdGggPSAnMjgwcHgnXG5cbiAgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snXG4gIGNvbnRhaW5lci5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJ1xuICBjb250YWluZXIuc3R5bGUucGFkZGluZyA9ICcwIDE2cHgnXG5cbiAgY29sb3JDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG4gIGNvbG9yQ29udGFpbmVyLnN0eWxlLnRleHRBbGlnbiA9ICdsZWZ0J1xuICBjb2xvckNvbnRhaW5lci5zdHlsZS5ib3JkZXIgPSAnMXB4IHNvbGlkICNkZGQnXG4gIGNvbG9yQ29udGFpbmVyLnN0eWxlLmZvbnRTaXplID0gJzAnXG5cbiAgY291bnRDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG4gIGNvdW50Q29udGFpbmVyLnN0eWxlLnRleHRBbGlnbiA9ICdsZWZ0J1xuICBmb3IgYywgaSBpbiBwYWxldHRlLmNvbG9yc1xuICAgIGMgPz0gW11cbiAgICBjb2xvckVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuICAgIGNvbG9yRWwuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snXG4gICAgY29sb3JFbC5zdHlsZS53aWR0aCAgID0gNDAgKydweCdcbiAgICBjb2xvckVsLnN0eWxlLmhlaWdodCAgPSAyMCArJ3B4J1xuICAgIGNvbG9yRWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2IoI3tjLmpvaW4oJywnKX0pXCJcblxuICAgIGNvdW50RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG4gICAgY291bnRFbC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1ibG9jaydcblxuICAgIGNvdW50RWwuc3R5bGUud2lkdGggICA9IDQwICsncHgnXG4gICAgY291bnRFbC5zdHlsZS5oZWlnaHQgID0gMjAgKydweCdcbiAgICBjb3VudEVsLnN0eWxlLmZvbnRTaXplID0gMTErJ3B4J1xuICAgIGNvdW50RWwuc3R5bGUudGV4dEFsaWduID0gJ2NlbnRlcidcbiAgICBjb3VudEVsLmlubmVySFRNTCA9IHBhbGV0dGUuY291bnRzW2ldXG5cbiAgICBjb2xvckNvbnRhaW5lci5hcHBlbmRDaGlsZChjb2xvckVsKVxuICAgIGNvdW50Q29udGFpbmVyLmFwcGVuZENoaWxkKGNvdW50RWwpXG5cbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGltYWdlKVxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY29sb3JDb250YWluZXIpXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjb3VudENvbnRhaW5lcilcbiAgY29udGFpbmVyXG5cbnNob3dUZXN0SW1hZ2UgPSAoaSkgLT5cbiAgUGFsZXR0ZSBcIiN7aX0uanBnXCIsIDcsIChwYWxldHRlKSAtPlxuICAgIGltZyA9IG5ldyBJbWFnZSgpXG4gICAgaW1nLnNyYyA9IFwiI3tpfS5qcGdcIlxuICAgIGltZy5zdHlsZS5tYXJnaW5Ub3AgPSAyMCsncHgnXG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIG1ha2VQYWxldHRlRWwoaW1nLCBwYWxldHRlKVxuXG5zaG93VGVzdEltYWdlKGkpIGZvciBpIGluIFsxLi42XVxuXG4iLCIvKmdsb2JhbCBkZWZpbmU6ZmFsc2UgcmVxdWlyZTpmYWxzZSAqL1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKXtcblx0Ly8gSW1wb3J0IEV2ZW50c1xuXHR2YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5cblx0Ly8gRXhwb3J0IERvbWFpblxuXHR2YXIgZG9tYWluID0ge307XG5cdGRvbWFpbi5jcmVhdGVEb21haW4gPSBkb21haW4uY3JlYXRlID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgZCA9IG5ldyBldmVudHMuRXZlbnRFbWl0dGVyKCk7XG5cblx0XHRmdW5jdGlvbiBlbWl0RXJyb3IoZSkge1xuXHRcdFx0ZC5lbWl0KCdlcnJvcicsIGUpXG5cdFx0fVxuXG5cdFx0ZC5hZGQgPSBmdW5jdGlvbihlbWl0dGVyKXtcblx0XHRcdGVtaXR0ZXIub24oJ2Vycm9yJywgZW1pdEVycm9yKTtcblx0XHR9XG5cdFx0ZC5yZW1vdmUgPSBmdW5jdGlvbihlbWl0dGVyKXtcblx0XHRcdGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgZW1pdEVycm9yKTtcblx0XHR9XG5cdFx0ZC5ydW4gPSBmdW5jdGlvbihmbil7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRmbigpO1xuXHRcdFx0fVxuXHRcdFx0Y2F0Y2ggKGVycikge1xuXHRcdFx0XHR0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH07XG5cdFx0ZC5kaXNwb3NlID0gZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9O1xuXHRcdHJldHVybiBkO1xuXHR9O1xuXHRyZXR1cm4gZG9tYWluO1xufSkuY2FsbCh0aGlzKTsiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5NdXRhdGlvbk9ic2VydmVyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuTXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICB2YXIgcXVldWUgPSBbXTtcblxuICAgIGlmIChjYW5NdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICAgIHZhciBoaWRkZW5EaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcXVldWVMaXN0ID0gcXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBxdWV1ZUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoaGlkZGVuRGl2LCB7IGF0dHJpYnV0ZXM6IHRydWUgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGhpZGRlbkRpdi5zZXRBdHRyaWJ1dGUoJ3llcycsICdubycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIl19
