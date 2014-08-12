(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
(function() {
  var WebSocket = window.WebSocket || window.MozWebSocket;
  var br = window.brunch = (window.brunch || {});
  var ar = br['auto-reload'] = (br['auto-reload'] || {});
  if (!WebSocket || ar.disabled) return;

  var cacheBuster = function(url){
    var date = Math.round(Date.now() / 1000).toString();
    url = url.replace(/(\&|\\?)cacheBuster=\d*/, '');
    return url + (url.indexOf('?') >= 0 ? '&' : '?') +'cacheBuster=' + date;
  };

  var reloaders = {
    page: function(){
      window.location.reload(true);
    },

    stylesheet: function(){
      [].slice
        .call(document.querySelectorAll('link[rel="stylesheet"]'))
        .filter(function(link){
          return (link != null && link.href != null);
        })
        .forEach(function(link) {
          link.href = cacheBuster(link.href);
        });
    }
  };
  var port = ar.port || 9485;
  var host = br.server || window.location.hostname;

  var connect = function(){
    var connection = new WebSocket('ws://' + host + ':' + port);
    connection.onmessage = function(event){
      if (ar.disabled) return;
      var message = event.data;
      var reloader = reloaders[message] || reloaders.page;
      reloader();
    };
    connection.onerror = function(){
      if (connection.readyState) connection.close();
    };
    connection.onclose = function(){
      window.setTimeout(connect, 1000);
    };
  };
  connect();
})();

require.register("src/bucket", function(exports, require, module) {
module.exports = function() {
  var api, b, g, r, total;
  api = {};
  r = g = b = total = 0;
  api.add = function(rgb) {
    r += rgb[0];
    b += rgb[1];
    g += rgb[2];
    return total++;
  };
  api.count = function() {
    return total;
  };
  api.meanRgb = function() {
    return [Math.round(r / total), Math.round(g / total), Math.round(b / total)];
  };
  return api;
};
});

;require.register("src/image", function(exports, require, module) {
var getImageData;

getImageData = function(image) {
  var ctx;
  ctx = document.createElement("canvas").getContext('2d');
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, image.width, image.height).data;
};

module.exports = function(srcOrImg, callback) {
  var api, image, init;
  api = {};
  image = null;
  init = function() {
    image = new Image();
    image.onload = function() {
      return callback(api);
    };
    image.src = srcOrImg.src ? srcOrImg.src : srcOrImg || '';
  };
  api.eachPixel = function(callback) {
    var data, getRgb, i, length, _i, _ref, _results;
    data = getImageData(image);
    length = data.length || image.width * image.height;
    getRgb = function(pixelIdx) {
      return Array.prototype.slice.apply(data, [pixelIdx, pixelIdx + 3]);
    };
    _results = [];
    for (i = _i = 0, _ref = length - 1; _i <= _ref; i = _i += 4) {
      _results.push(callback(getRgb(i)));
    }
    return _results;
  };
  return init();
};
});

;require.register("src/palette", function(exports, require, module) {
var Bucket, Img, NUM_BUCKETS;

Bucket = require('src/bucket');

Img = require('src/image');

NUM_BUCKETS = 27;

module.exports = function(srcOrImage, numColors, callback) {
  var buckets, chooseBucket, chunkSize, chunksPerDimension, colorComponentChunk, fillBuckets, run;
  buckets = [];
  chunksPerDimension = 0;
  chunkSize = 1;
  run = function(image) {
    var b, bucket, i, numBuckets, numSamples, _;
    chunksPerDimension = Math.round(Math.pow(NUM_BUCKETS, 1 / 3));
    numBuckets = Math.pow(chunksPerDimension, 3);
    chunkSize = 255 / chunksPerDimension;
    buckets = (function() {
      var _i, _results;
      _results = [];
      for (_ = _i = 0; 0 <= numBuckets ? _i <= numBuckets : _i >= numBuckets; _ = 0 <= numBuckets ? ++_i : --_i) {
        _results.push(Bucket());
      }
      return _results;
    })();
    numSamples = fillBuckets(image);
    buckets = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = buckets.length; _i < _len; _i++) {
        b = buckets[_i];
        if (b.count() > 0) {
          _results.push(b);
        }
      }
      return _results;
    })();
    buckets = buckets.sort(function(a, b) {
      return b.count() - a.count();
    });
    return callback({
      numSamples: numSamples,
      colors: (function() {
        var _i, _len, _results;
        _results = [];
        for (i = _i = 0, _len = buckets.length; _i < _len; i = ++_i) {
          bucket = buckets[i];
          if (i < numColors) {
            _results.push(bucket.meanRgb());
          }
        }
        return _results;
      })(),
      counts: (function() {
        var _i, _len, _results;
        _results = [];
        for (i = _i = 0, _len = buckets.length; _i < _len; i = ++_i) {
          bucket = buckets[i];
          if (i < numColors) {
            _results.push(bucket.count());
          }
        }
        return _results;
      })()
    });
  };
  fillBuckets = function(image) {
    var count;
    count = 0;
    image.eachPixel(function(rgb) {
      var bucket;
      if (!(bucket = chooseBucket(rgb))) {
        return;
      }
      bucket.add(rgb);
      return count++;
    });
    return count;
  };
  chooseBucket = function(rgb) {
    var bucketIdx, colorValue, dim, k, _i, _len;
    bucketIdx = 0;
    for (dim = _i = 0, _len = rgb.length; _i < _len; dim = ++_i) {
      colorValue = rgb[dim];
      k = Math.pow(chunksPerDimension, dim);
      bucketIdx = bucketIdx + k * colorComponentChunk(colorValue);
    }
    return buckets[bucketIdx];
  };
  colorComponentChunk = function(colorValue) {
    var idx;
    idx = Math.floor(colorValue / chunkSize);
    if (idx !== 0 && colorValue % chunkSize === 0) {
      idx--;
    }
    return idx;
  };
  return Img('test.png', run);
};
});

;
//# sourceMappingURL=palette.js.map
