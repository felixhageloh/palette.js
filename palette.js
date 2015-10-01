(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.palette = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ImageData, findClusters, toRgbVectors;

ImageData = require('./src/image-data');

toRgbVectors = require('./src/to-rgb-vectors');

findClusters = require('./src/find-clusters');

module.exports = function(srcOrImage, numColors, callback) {
  return ImageData(srcOrImage).then(function(data) {
    var cluster, clusters, vectors;
    vectors = toRgbVectors(data);
    clusters = findClusters(vectors, numColors);
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


},{"./src/find-clusters":3,"./src/image-data":4,"./src/to-rgb-vectors":6}],2:[function(require,module,exports){
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
    var count, dist, mean, smallestDist, total, vector, _i, _len, _ref;
    if ((centroid != null) && lastNumVectors === vectors.length) {
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
  api.clear = function() {
    totals = null;
    vectors.length = 0;
    centroid = null;
    return lastNumVectors = null;
  };
  return api;
};


},{"./square-distance":5}],3:[function(require,module,exports){
var Cluster, MAX_TRIES, bail, centroidsEqual, closestClusterIdx, distance, pickEvenly, pickRandom, step, vectorsEqual;

Cluster = require('./cluster');

distance = require('./square-distance');

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
    cluster = clusters[closestClusterIdx(centroids, vector)];
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


},{"./cluster":2,"./square-distance":5}],4:[function(require,module,exports){
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


},{}],5:[function(require,module,exports){
// Calculates the square distance of two vectors (presented as arrays).
module.exports = function squareDistance(a, b) {
  var deltaSum = 0;
  var dim = a.length;

  for(var i = 0; i < dim; i++)
    deltaSum = deltaSum + Math.pow((b[i] - a[i]), 2);

  return deltaSum;
};

},{}],6:[function(require,module,exports){
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

},{}]},{},[1])(1)
});