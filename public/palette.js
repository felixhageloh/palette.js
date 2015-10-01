!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.palette=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/felix/Workspace/palette.js/index.coffee":[function(require,module,exports){
var ImageData, findClusters, toRgb;

ImageData = require('./src/image-data');

toRgb = require('./src/to-rgb');

findClusters = require('./src/find-clusters');

module.exports = function(srcOrImage, numColors, callback) {
  return ImageData(srcOrImage).then(function(data) {
    var cluster, clusters;
    clusters = findClusters(toRgb(data), numColors);
    clusters = clusters.sort(function(a, b) {
      return b.count() - a.count();
    });
    return callback({
      numSamples: pixels.length,
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



},{"./src/find-clusters":"/Users/felix/Workspace/palette.js/src/find-clusters.coffee","./src/image-data":"/Users/felix/Workspace/palette.js/src/image-data.coffee","./src/to-rgb":"/Users/felix/Workspace/palette.js/src/to-rgb.coffee"}],"/Users/felix/Workspace/palette.js/src/cluster.coffee":[function(require,module,exports){
var distance;

distance = require('./distance');

module.exports = function(centroid) {
  var api, totals, vectors;
  api = {};
  totals = null;
  vectors = [];
  api.add = function(vector) {
    var i, val, _, _i, _len, _ref;
    if (totals == null) {
      totals = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = vector.length; _i < _len; _i++) {
          _ = vector[_i];
          _results.push(0);
        }
        return _results;
      })();
    }
    if (vector.length !== totals.length) {
      throw new Error("dimensions don't match");
    }
    for (i = _i = 0, _len = vector.length; _i < _len; i = ++_i) {
      val = vector[i];
      totals[i] += val * ((_ref = vector.weight) != null ? _ref : 1);
    }
    centroid = null;
    return vectors.push(vector);
  };
  api.count = function() {
    return vectors.length;
  };
  api.centroid = function() {
    var count, dist, mean, smallestDist, total, vector, _i, _len, _ref;
    if (centroid != null) {
      return centroid;
    }
    if ((count = vectors.length) === 0) {
      return;
    }
    mean = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = totals.length; _i < _len; _i++) {
        total = totals[_i];
        _results.push(Math.round(total / count));
      }
      return _results;
    })();
    centroid = vectors[0];
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
  api.clear = function() {
    totals = null;
    vectors.length = 0;
    return centroid = null;
  };
  return api;
};



},{"./distance":"/Users/felix/Workspace/palette.js/src/distance.coffee"}],"/Users/felix/Workspace/palette.js/src/distance.coffee":[function(require,module,exports){
module.exports = function(a, b) {
  var deltaSum, dim, i, _i;
  if ((dim = a.length) !== b.length) {
    return;
  }
  deltaSum = 0;
  for (i = _i = 0; 0 <= dim ? _i < dim : _i > dim; i = 0 <= dim ? ++_i : --_i) {
    deltaSum += Math.pow(b[i] - a[i], 2);
  }
  return deltaSum;
};



},{}],"/Users/felix/Workspace/palette.js/src/find-clusters.coffee":[function(require,module,exports){
var Cluster, MAX_TRIES, bail, centroidsEqual, closestIdx, distance, pickEvenly, pickRandom, step, vectorsEqual;

Cluster = require('./cluster');

distance = require('./distance');

MAX_TRIES = 100;

module.exports = function(vectors, numClusters) {
  var centroids, clusters, i, numTries, prevClusters;
  numClusters = Math.min(vectors.length, numClusters);
  if (vectors.length === numClusters) {
    return bail(vectors, numClusters);
  }
  numTries = 0;
  centroids = pickEvenly(numClusters, 3, 255);
  prevClusters = null;
  while (numTries < MAX_TRIES && !centroidsEqual(centroids, prevClusters)) {
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
    cluster = clusters[closestIdx(centroids, vector)];
    cluster.add(vector);
  }
  _results = [];
  for (i = _j = 0, _len1 = clusters.length; _j < _len1; i = ++_j) {
    cluster = clusters[i];
    if (cluster.count() > 0) {
      _results.push(cluster.centroid());
    }
  }
  return _results;
};

closestIdx = function(centroids, vector) {
  var c, closest, dist, idx, smallestDist, _i, _len;
  closest = 0;
  smallestDist = null;
  for (idx = _i = 0, _len = centroids.length; _i < _len; idx = ++_i) {
    c = centroids[idx];
    dist = distance(c, vector);
    if (smallestDist == null) {
      smallestDist = dist;
    }
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
    cluster.add(vectors[i]);
  }
  return clusters;
};



},{"./cluster":"/Users/felix/Workspace/palette.js/src/cluster.coffee","./distance":"/Users/felix/Workspace/palette.js/src/distance.coffee"}],"/Users/felix/Workspace/palette.js/src/image-data.coffee":[function(require,module,exports){
var MAX_PIXELS, pixelData;

MAX_PIXELS = 10000;

module.exports = function(srcOrImg) {
  return new Promise(function(accept, reject) {
    var image;
    image = new Image();
    image.onload = function() {
      return accept(pixelData(image));
    };
    return image.src = srcOrImg.src ? srcOrImg.src : srcOrImg || '';
  });
};

pixelData = function(image) {
  var aspect, canvas, ctx, height, width, _ref;
  aspect = image.width / image.height;
  height = Math.sqrt(MAX_PIXELS / aspect);
  width = height * aspect;
  _ref = [Math.round(width), Math.round(height)], width = _ref[0], height = _ref[1];
  canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, width, height).data;
};



},{}],"/Users/felix/Workspace/palette.js/src/to-rgb.coffee":[function(require,module,exports){
module.exports = function(imageData) {
  var api, getRgb, i, length;
  api = {};
  length = imageData.length || image.width * image.height;
  getRgb = function(pixelIdx) {
    return Array.prototype.slice.apply(imageData, [pixelIdx, pixelIdx + 3]);
  };
  return (function() {
    var _i, _results;
    _results = [];
    for (i = _i = 0; _i < length; i = _i += 4) {
      _results.push(cb(getRgb(i)));
    }
    return _results;
  })();
};



},{}]},{},["/Users/felix/Workspace/palette.js/index.coffee"])("/Users/felix/Workspace/palette.js/index.coffee")
});