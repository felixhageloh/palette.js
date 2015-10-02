(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/felix/Workspace/palette.js/index.coffee":[function(require,module,exports){
var ImageData, MAX_PIXELS, MAX_TRIES, findClusters, toRgbVectors;

MAX_TRIES = 100;

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



},{"./src/find-clusters":"/Users/felix/Workspace/palette.js/src/find-clusters.coffee","./src/image-data":"/Users/felix/Workspace/palette.js/src/image-data.js","./src/to-rgb-vectors":"/Users/felix/Workspace/palette.js/src/to-rgb-vectors.js"}],"/Users/felix/Workspace/palette.js/src/cluster.coffee":[function(require,module,exports){
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



},{"./cluster":"/Users/felix/Workspace/palette.js/src/cluster.coffee","./square-distance":"/Users/felix/Workspace/palette.js/src/square-distance.js"}],"/Users/felix/Workspace/palette.js/src/image-data.js":[function(require,module,exports){
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
  ctx.drawImage(image, 0, 0);

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

},{}],"/Users/felix/Workspace/palette.js/src/square-distance.js":[function(require,module,exports){
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
var ImageData, Palette, makePaletteEl, showTestImage;

ImageData = require("../src/image-data");

Palette = require("../");

makePaletteEl = function(palette) {
  var c, colorContainer, colorEl, container, countContainer, countEl, i, _i, _len, _ref;
  container = document.createElement('div');
  colorContainer = document.createElement('div');
  countContainer = document.createElement('div');
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
  container.appendChild(colorContainer);
  container.appendChild(countContainer);
  return container;
};

showTestImage = function(i) {
  return Palette("" + i + ".jpg", 5, function(palette) {
    var img;
    img = new Image();
    img.src = "" + i + ".jpg";
    img.style.marginTop = 20 + 'px';
    document.body.appendChild(img);
    return document.body.appendChild(makePaletteEl(palette));
  });
};

showTestImage(1);



},{"../":"/Users/felix/Workspace/palette.js/index.coffee","../src/image-data":"/Users/felix/Workspace/palette.js/src/image-data.js"}]},{},["/Users/felix/Workspace/palette.js/test/test.coffee"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZmVsaXgvV29ya3NwYWNlL3BhbGV0dGUuanMvaW5kZXguY29mZmVlIiwiL1VzZXJzL2ZlbGl4L1dvcmtzcGFjZS9wYWxldHRlLmpzL3NyYy9jbHVzdGVyLmNvZmZlZSIsIi9Vc2Vycy9mZWxpeC9Xb3Jrc3BhY2UvcGFsZXR0ZS5qcy9zcmMvZmluZC1jbHVzdGVycy5jb2ZmZWUiLCJzcmMvaW1hZ2UtZGF0YS5qcyIsInNyYy9zcXVhcmUtZGlzdGFuY2UuanMiLCJzcmMvdG8tcmdiLXZlY3RvcnMuanMiLCIvVXNlcnMvZmVsaXgvV29ya3NwYWNlL3BhbGV0dGUuanMvdGVzdC90ZXN0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUEsNERBQUE7O0FBQUEsU0FBQSxHQUFZLEdBQVosQ0FBQTs7QUFBQSxVQUNBLEdBQWEsS0FEYixDQUFBOztBQUFBLFNBR0EsR0FBWSxPQUFBLENBQVEsa0JBQVIsQ0FIWixDQUFBOztBQUFBLFlBSUEsR0FBZSxPQUFBLENBQVEsc0JBQVIsQ0FKZixDQUFBOztBQUFBLFlBS0EsR0FBZSxPQUFBLENBQVEscUJBQVIsQ0FMZixDQUFBOztBQUFBLE1BT00sQ0FBQyxPQUFQLEdBQWlCLFNBQUMsVUFBRCxFQUFhLFNBQWIsRUFBd0IsUUFBeEIsR0FBQTtTQUNmLFNBQUEsQ0FBVSxVQUFWLEVBQXNCLFVBQXRCLENBQ0UsQ0FBQyxJQURILENBQ1EsU0FBQyxJQUFELEdBQUE7QUFDSixRQUFBLDBCQUFBO0FBQUEsSUFBQSxPQUFBLEdBQVUsWUFBQSxDQUFhLElBQWIsQ0FBVixDQUFBO0FBQUEsSUFDQSxRQUFBLEdBQVcsWUFBQSxDQUFhLE9BQWIsRUFBc0IsU0FBdEIsRUFBaUMsU0FBakMsQ0FE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QWQsQ0F4Q0EsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJNQVhfVFJJRVMgPSAxMDBcbk1BWF9QSVhFTFMgPSAxMDAwMFxuXG5JbWFnZURhdGEgPSByZXF1aXJlICcuL3NyYy9pbWFnZS1kYXRhJ1xudG9SZ2JWZWN0b3JzID0gcmVxdWlyZSAnLi9zcmMvdG8tcmdiLXZlY3RvcnMnXG5maW5kQ2x1c3RlcnMgPSByZXF1aXJlICcuL3NyYy9maW5kLWNsdXN0ZXJzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IChzcmNPckltYWdlLCBudW1Db2xvcnMsIGNhbGxiYWNrKSAtPlxuICBJbWFnZURhdGEoc3JjT3JJbWFnZSwgTUFYX1BJWEVMUylcbiAgICAudGhlbiAoZGF0YSkgLT5cbiAgICAgIHZlY3RvcnMgPSB0b1JnYlZlY3RvcnMoZGF0YSlcbiAgICAgIGNsdXN0ZXJzID0gZmluZENsdXN0ZXJzKHZlY3RvcnMsIG51bUNvbG9ycywgTUFYX1RSSUVTKVxuICAgICAgY2x1c3RlcnMgPSBjbHVzdGVycy5zb3J0IChhLGIpIC0+IGIuY291bnQoKSAtIGEuY291bnQoKVxuXG4gICAgICBjYWxsYmFjayB7XG4gICAgICAgIG51bVNhbXBsZXM6IHZlY3RvcnMubGVuZ3RoXG4gICAgICAgIGNvbG9yczogKGNsdXN0ZXIuY2VudHJvaWQoKSBmb3IgY2x1c3RlciBpbiBjbHVzdGVycylcbiAgICAgICAgY291bnRzOiAoY2x1c3Rlci5jb3VudCgpIGZvciBjbHVzdGVyIGluIGNsdXN0ZXJzKVxuICAgICAgfVxuXG5cbiIsImRpc3RhbmNlID0gcmVxdWlyZSAnLi9zcXVhcmUtZGlzdGFuY2UnXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgYXBpID0ge31cblxuICB0b3RhbHMgPSBbMCwgMCwgMF1cbiAgdmVjdG9ycyA9IFtdXG4gIGNlbnRyb2lkID0gbnVsbFxuICBsYXN0TnVtVmVjdG9ycyA9IG51bGxcblxuICBhcGkuYWRkID0gKHZlY3RvcikgLT5cbiAgICB0b3RhbHNbaV0gKz0gdmFsIGZvciB2YWwsIGkgaW4gdmVjdG9yXG4gICAgdmVjdG9ycy5wdXNoIHZlY3RvclxuXG4gIGFwaS5jb3VudCA9IC0+XG4gICAgdmVjdG9ycy5sZW5ndGhcblxuICBhcGkuY2VudHJvaWQgPSAtPlxuICAgIHJldHVybiBjZW50cm9pZCBpZiBjZW50cm9pZD8gYW5kIGxhc3ROdW1WZWN0b3JzID09IHZlY3RvcnMubGVuZ3RoXG4gICAgcmV0dXJuIGlmIChjb3VudCA9IHZlY3RvcnMubGVuZ3RoKSA9PSAwXG4gICAgbWVhbiA9IChNYXRoLnJvdW5kKHRvdGFsL2NvdW50KSBmb3IgdG90YWwgaW4gdG90YWxzKVxuXG4gICAgY2VudHJvaWQgPSB2ZWN0b3JzWzBdXG4gICAgbGFzdE51bVZlY3RvcnMgPSB2ZWN0b3JzLmxlbmd0aFxuICAgIHNtYWxsZXN0RGlzdCA9IGRpc3RhbmNlKG1lYW4sIGNlbnRyb2lkKVxuXG4gICAgZm9yIHZlY3RvciBpbiB2ZWN0b3JzWzEuLl1cbiAgICAgIGNvbnRpbnVlIHVubGVzcyAoZGlzdCA9IGRpc3RhbmNlKG1lYW4sIHZlY3RvcikpIDwgc21hbGxlc3REaXN0XG4gICAgICBjZW50cm9pZCA9IHZlY3RvclxuICAgICAgc21hbGxlc3REaXN0ID0gZGlzdFxuXG4gICAgY2VudHJvaWRcblxuICBhcGkuY2xlYXIgPSAtPlxuICAgIHRvdGFscyA9IG51bGxcbiAgICB2ZWN0b3JzLmxlbmd0aCA9IDBcbiAgICBjZW50cm9pZCA9IG51bGxcbiAgICBsYXN0TnVtVmVjdG9ycyA9IG51bGxcblxuICBhcGlcbiIsIkNsdXN0ZXIgID0gcmVxdWlyZSAnLi9jbHVzdGVyJ1xuZGlzdGFuY2UgPSByZXF1aXJlICcuL3NxdWFyZS1kaXN0YW5jZSdcblxuIyBGaW5kcyBudW1DbHVzdGVycyBjbHVzdGVycyBpbiB2ZWN0b3JzIChiYXNlZCBvbiBnZW9tZXRyaWMgZGlzdGFuY2UpXG4jIFNvbWV3aGF0IGstbWVhbnMgbGlrZSwgSSBndWVzc1xubW9kdWxlLmV4cG9ydHMgPSAodmVjdG9ycywgbnVtQ2x1c3RlcnMsIG1heFRyaWVzKSAtPlxuICBudW1DbHVzdGVycyA9IE1hdGgubWluIHZlY3RvcnMubGVuZ3RoLCBudW1DbHVzdGVyc1xuICByZXR1cm4gYmFpbCh2ZWN0b3JzLCBudW1DbHVzdGVycykgaWYgdmVjdG9ycy5sZW5ndGggPT0gbnVtQ2x1c3RlcnNcblxuICBudW1UcmllcyAgPSAwXG4gIGNlbnRyb2lkcyA9IHBpY2tFdmVubHkobnVtQ2x1c3RlcnMsIDMsIDI1NSlcbiAgcHJldkNsdXN0ZXJzID0gbnVsbFxuXG4gIHdoaWxlIG51bVRyaWVzIDwgbWF4VHJpZXMgYW5kICFjZW50cm9pZHNFcXVhbChjZW50cm9pZHMsIHByZXZDbHVzdGVycylcbiAgICBwcmV2Q2x1c3RlcnMgPSBjbHVzdGVyc1xuICAgIGNsdXN0ZXJzICA9IChDbHVzdGVyKCkgZm9yIGkgaW4gWzAuLi5udW1DbHVzdGVyc10pXG4gICAgY2VudHJvaWRzID0gc3RlcCh2ZWN0b3JzLCBjZW50cm9pZHMsIGNsdXN0ZXJzKVxuICAgIG51bVRyaWVzKytcblxuICBjbHVzdGVyc1xuXG5zdGVwID0gKHZlY3RvcnMsIGNlbnRyb2lkcywgY2x1c3RlcnMpIC0+XG4gIGZvciB2ZWN0b3IgaW4gdmVjdG9yc1xuICAgIGNsdXN0ZXIgPSBjbHVzdGVyc1tjbG9zZXN0Q2x1c3RlcklkeChjZW50cm9pZHMsIHZlY3RvcildXG4gICAgY2x1c3Rlci5hZGQgdmVjdG9yXG5cbiAgKGNsdXN0ZXIuY2VudHJvaWQoKSBmb3IgY2x1c3RlciwgaSBpbiBjbHVzdGVycyB3aGVuIGNsdXN0ZXIuY291bnQoKSA+IDApXG5cbmNsb3Nlc3RDbHVzdGVySWR4ID0gKGNlbnRyb2lkcywgdmVjdG9yKSAtPlxuICBjbG9zZXN0ID0gMFxuICBzbWFsbGVzdERpc3QgPSAxOTUwNzYgIyBsYXJnZXN0IHBvc3NpYmxlIHNxdWFyZSBkaXN0YW5jZSBpcyAxOTUwNzUgKDI1NV4yICogMylcblxuICBmb3IgYywgaWR4IGluIGNlbnRyb2lkc1xuICAgIGRpc3QgPSBkaXN0YW5jZShjLCB2ZWN0b3IpXG4gICAgaWYgZGlzdCA8IHNtYWxsZXN0RGlzdFxuICAgICAgY2xvc2VzdCA9IGlkeFxuICAgICAgc21hbGxlc3REaXN0ID0gZGlzdFxuXG4gIGNsb3Nlc3RcblxucGlja1JhbmRvbSA9IChuLCBzYW1wbGVzKSAtPlxuICBwaWNrcyA9IFtdXG4gIHNhbXBsZXMgPSAodiBmb3IgdiBpbiBzYW1wbGVzKVxuXG4gIGZvciBfIGluIFswLi4ubl1cbiAgICBpZHggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzYW1wbGVzLmxlbmd0aClcbiAgICBwaWNrcy5wdXNoKHNhbXBsZXNbaWR4XSlcbiAgICBzYW1wbGVzLnNwbGljZShpZHgsIDEpXG4gIHBpY2tzXG5cbnBpY2tFdmVubHkgPSAobiwgZGltZW5zaW9ucywgcmFuZ2UpIC0+XG4gIGNodW5rID0gcmFuZ2UgLyBuXG4gIHZlY3RvcnMgPSBbXVxuXG4gIGZvciBpIGluIFswLi4ubl1cbiAgICBzID0gTWF0aC5yb3VuZCBjaHVuayAqIGkgKyBjaHVuay8yXG4gICAgdmVjdG9ycy5wdXNoIChzIGZvciBkaW0gaW4gWzAuLi5kaW1lbnNpb25zXSlcblxuICB2ZWN0b3JzXG5cbmNlbnRyb2lkc0VxdWFsID0gKG9sZCwgY2x1c3RlcnMpIC0+XG4gIHJldHVybiBmYWxzZSB1bmxlc3MgY2x1c3RlcnNcbiAgZm9yIGNlbnRyb2lkLCBpIGluIG9sZFxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgdmVjdG9yc0VxdWFsKGNlbnRyb2lkLCBjbHVzdGVyc1tpXS5jZW50cm9pZCgpKVxuXG4gIHRydWVcblxudmVjdG9yc0VxdWFsID0gKGEsIGIpIC0+XG4gIHJldHVybiBmYWxzZSBpZiAoYSBhbmQgIWIpIG9yIChiIGFuZCAhYSkgb3IgKCFhIGFuZCAhYilcbiAgZm9yIHZhbCwgaSBpbiBhXG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyB2YWwgPT0gYltpXVxuXG4gIHRydWVcblxuYmFpbCA9ICh2ZWN0b3JzLCBudW1DbHVzdGVycykgLT5cbiAgY2x1c3RlcnMgPSAoQ2x1c3RlcigpIGZvciBpIGluIFswLi4ubnVtQ2x1c3RlcnNdKVxuICBjbHVzdGVyLmFkZCh2ZWN0b3JzLmF0KGkpKSBmb3IgY2x1c3RlciwgaSBpbiBjbHVzdGVyc1xuICBjbHVzdGVyc1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbWFnZURhdGEoc3JjT3JJbWcsIG1heFBpeGVscykge1xuICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihhY2NlcHQsIHJlamVjdCkge1xuICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyBhY2NlcHQodG9EYXRhKGltYWdlLCBtYXhQaXhlbHMpKTsgfTtcbiAgfSk7XG5cbiAgaW1hZ2Uuc3JjID0gc3JjT3JJbWcuc3JjID8gc3JjT3JJbWcuc3JjIDogKHNyY09ySW1nIHx8ICcnKTtcblxuICByZXR1cm4gcHJvbWlzZTtcbn07XG5cbmZ1bmN0aW9uIHRvRGF0YShpbWFnZSwgbWF4UGl4ZWxzKSB7XG4gIHZhciBzaXplID0gY2xhbXBJbWFnZVNpemUoaW1hZ2UsIG1heFBpeGVscyk7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gIGNhbnZhcy53aWR0aCA9IHNpemUud2lkdGg7XG4gIGNhbnZhcy5oZWlnaHQgPSBzaXplLmhlaWdodDtcbiAgY3R4LmRyYXdJbWFnZShpbWFnZSwgMCwgMCk7XG5cbiAgcmV0dXJuIGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQpXG4gICAgLmRhdGE7XG59XG5cbmZ1bmN0aW9uIGNsYW1wSW1hZ2VTaXplKGltYWdlLCBtYXhQaXhlbHMpIHtcbiAgdmFyIGFzcGVjdCA9IGltYWdlLndpZHRoIC8gaW1hZ2UuaGVpZ2h0O1xuICB2YXIgaGVpZ2h0ID0gTWF0aC5zcXJ0KG1heFBpeGVscyAvIGFzcGVjdCk7XG4gIHZhciB3aWR0aCA9IGhlaWdodCAqIGFzcGVjdDtcblxuICByZXR1cm4ge1xuICAgIHdpZHRoOiBNYXRoLnJvdW5kKHdpZHRoKSxcbiAgICBoZWlnaHQ6IE1hdGgucm91bmQoaGVpZ2h0KVxuICB9O1xufVxuIiwiLy8gQ2FsY3VsYXRlcyB0aGUgc3F1YXJlIGRpc3RhbmNlIG9mIHR3byB2ZWN0b3JzIChwcmVzZW50ZWQgYXMgYXJyYXlzKS5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3F1YXJlRGlzdGFuY2UoYSwgYikge1xuICB2YXIgZGVsdGFTdW0gPSAwO1xuICB2YXIgZGltID0gYS5sZW5ndGg7XG5cbiAgZm9yKHZhciBpID0gMDsgaSA8IGRpbTsgaSsrKVxuICAgIGRlbHRhU3VtID0gZGVsdGFTdW0gKyBNYXRoLnBvdygoYltpXSAtIGFbaV0pLCAyKTtcblxuICByZXR1cm4gZGVsdGFTdW07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b1JnYkFycmF5KGltYWdlRGF0YSkge1xuICB2YXIgcmdiVmVjdG9ycyA9IFtdO1xuICB2YXIgbnVtUGl4ZWxzID0gaW1hZ2VEYXRhLmxlbmd0aCAvIDQ7XG4gIHZhciBvZmZzZXQ7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1QaXhlbHM7IGkrKykge1xuICAgIG9mZnNldCA9IGkgKiA0O1xuICAgIHJnYlZlY3RvcnMucHVzaChcbiAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShpbWFnZURhdGEsIFtvZmZzZXQsIG9mZnNldCszXSlcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIHJnYlZlY3RvcnM7XG59O1xuIiwiSW1hZ2VEYXRhID0gcmVxdWlyZSBcIi4uL3NyYy9pbWFnZS1kYXRhXCJcblBhbGV0dGUgPSByZXF1aXJlIFwiLi4vXCJcblxubWFrZVBhbGV0dGVFbCA9IChwYWxldHRlKSAtPlxuICBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5cbiAgY29sb3JDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG4gIGNvdW50Q29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuICBmb3IgYywgaSBpbiBwYWxldHRlLmNvbG9yc1xuICAgIGMgPz0gW11cbiAgICBjb2xvckVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuICAgIGNvbG9yRWwuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snXG4gICAgY29sb3JFbC5zdHlsZS53aWR0aCAgID0gNDAgKydweCdcbiAgICBjb2xvckVsLnN0eWxlLmhlaWdodCAgPSAyMCArJ3B4J1xuICAgIGNvbG9yRWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2IoI3tjLmpvaW4oJywnKX0pXCJcblxuICAgIGNvdW50RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG4gICAgY291bnRFbC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1ibG9jaydcbiAgICBjb3VudEVsLnN0eWxlLndpZHRoICAgPSA0MCArJ3B4J1xuICAgIGNvdW50RWwuc3R5bGUuaGVpZ2h0ICA9IDIwICsncHgnXG4gICAgY291bnRFbC5zdHlsZS5mb250U2l6ZSA9IDExKydweCdcbiAgICBjb3VudEVsLnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInXG4gICAgY291bnRFbC5pbm5lckhUTUwgPSBwYWxldHRlLmNvdW50c1tpXVxuXG4gICAgY29sb3JDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sb3JFbClcbiAgICBjb3VudENvbnRhaW5lci5hcHBlbmRDaGlsZChjb3VudEVsKVxuXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjb2xvckNvbnRhaW5lcilcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNvdW50Q29udGFpbmVyKVxuICBjb250YWluZXJcblxuc2hvd1Rlc3RJbWFnZSA9IChpKSAtPlxuICBQYWxldHRlIFwiI3tpfS5qcGdcIiwgNSwgKHBhbGV0dGUpIC0+XG4gICAgaW1nID0gbmV3IEltYWdlKClcbiAgICBpbWcuc3JjID0gXCIje2l9LmpwZ1wiXG4gICAgaW1nLnN0eWxlLm1hcmdpblRvcCA9IDIwKydweCdcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGltZylcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIG1ha2VQYWxldHRlRWwocGFsZXR0ZSlcblxuI3Nob3dUZXN0SW1hZ2UoaSkgZm9yIGkgaW4gWzEuLjNdXG5zaG93VGVzdEltYWdlKDEpXG5cbiJdfQ==
