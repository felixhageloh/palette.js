(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/felix/Workspace/palette.js/index.coffee":[function(require,module,exports){
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



},{"./src/find-clusters":"/Users/felix/Workspace/palette.js/src/find-clusters.coffee","./src/image-data":"/Users/felix/Workspace/palette.js/src/image-data.coffee","./src/to-rgb-vectors":"/Users/felix/Workspace/palette.js/src/to-rgb-vectors.js"}],"/Users/felix/Workspace/palette.js/src/cluster.coffee":[function(require,module,exports){
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



},{"./cluster":"/Users/felix/Workspace/palette.js/src/cluster.coffee","./square-distance":"/Users/felix/Workspace/palette.js/src/square-distance.js"}],"/Users/felix/Workspace/palette.js/src/image-data.coffee":[function(require,module,exports){
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
var ImageData, Palette, i, makePaletteEl, showTestImage, _i;

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

for (i = _i = 1; _i <= 3; i = ++_i) {
  showTestImage(i);
}



},{"../":"/Users/felix/Workspace/palette.js/index.coffee","../src/image-data":"/Users/felix/Workspace/palette.js/src/image-data.coffee"}]},{},["/Users/felix/Workspace/palette.js/test/test.coffee"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZmVsaXgvV29ya3NwYWNlL3BhbGV0dGUuanMvaW5kZXguY29mZmVlIiwiL1VzZXJzL2ZlbGl4L1dvcmtzcGFjZS9wYWxldHRlLmpzL3NyYy9jbHVzdGVyLmNvZmZlZSIsIi9Vc2Vycy9mZWxpeC9Xb3Jrc3BhY2UvcGFsZXR0ZS5qcy9zcmMvZmluZC1jbHVzdGVycy5jb2ZmZWUiLCIvVXNlcnMvZmVsaXgvV29ya3NwYWNlL3BhbGV0dGUuanMvc3JjL2ltYWdlLWRhdGEuY29mZmVlIiwic3JjL3NxdWFyZS1kaXN0YW5jZS5qcyIsInNyYy90by1yZ2ItdmVjdG9ycy5qcyIsIi9Vc2Vycy9mZWxpeC9Xb3Jrc3BhY2UvcGFsZXR0ZS5qcy90ZXN0L3Rlc3QuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxxQ0FBQTs7QUFBQSxTQUFBLEdBQVksT0FBQSxDQUFRLGtCQUFSLENBQVosQ0FBQTs7QUFBQSxZQUNBLEdBQWUsT0FBQSxDQUFRLHNCQUFSLENBRGYsQ0FBQTs7QUFBQSxZQUVBLEdBQWUsT0FBQSxDQUFRLHFCQUFSLENBRmYsQ0FBQTs7QUFBQSxNQUlNLENBQUMsT0FBUCxHQUFpQixTQUFDLFVBQUQsRUFBYSxTQUFiLEVBQXdCLFFBQXhCLEdBQUE7U0FDZixTQUFBLENBQVUsVUFBVixDQUNFLENBQUMsSUFESCxDQUNRLFNBQUMsSUFBRCxHQUFBO0FBQ0osUUFBQSwwQkFBQTtBQUFBLElBQUEsT0FBQSxHQUFVLFlBQUEsQ0FBYSxJQUFiLENBQVYsQ0FBQTtBQUFBLElBQ0EsUUFBQSxHQUFXLFlBQUEsQ0FBYSxPQUFiLEVBQXNCLFNBQXRCLENBRFgsQ0FBQTtBQUFBLElBRUEsUUFBQSxHQUFXLFFBQVEsQ0FBQyxJ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LDZCQUExQixHQUFBO0FBQUEsRUFBQSxhQUFBLENBQWMsQ0FBZCxDQUFBLENBQUE7QUFBQSxDQXZDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJJbWFnZURhdGEgPSByZXF1aXJlICcuL3NyYy9pbWFnZS1kYXRhJ1xudG9SZ2JWZWN0b3JzID0gcmVxdWlyZSAnLi9zcmMvdG8tcmdiLXZlY3RvcnMnXG5maW5kQ2x1c3RlcnMgPSByZXF1aXJlICcuL3NyYy9maW5kLWNsdXN0ZXJzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IChzcmNPckltYWdlLCBudW1Db2xvcnMsIGNhbGxiYWNrKSAtPlxuICBJbWFnZURhdGEoc3JjT3JJbWFnZSlcbiAgICAudGhlbiAoZGF0YSkgLT5cbiAgICAgIHZlY3RvcnMgPSB0b1JnYlZlY3RvcnMoZGF0YSlcbiAgICAgIGNsdXN0ZXJzID0gZmluZENsdXN0ZXJzKHZlY3RvcnMsIG51bUNvbG9ycylcbiAgICAgIGNsdXN0ZXJzID0gY2x1c3RlcnMuc29ydCAoYSxiKSAtPiBiLmNvdW50KCkgLSBhLmNvdW50KClcblxuICAgICAgY2FsbGJhY2sge1xuICAgICAgICBudW1TYW1wbGVzOiB2ZWN0b3JzLmxlbmd0aFxuICAgICAgICBjb2xvcnM6IChjbHVzdGVyLmNlbnRyb2lkKCkgZm9yIGNsdXN0ZXIgaW4gY2x1c3RlcnMpXG4gICAgICAgIGNvdW50czogKGNsdXN0ZXIuY291bnQoKSBmb3IgY2x1c3RlciBpbiBjbHVzdGVycylcbiAgICAgIH1cblxuXG4iLCJkaXN0YW5jZSA9IHJlcXVpcmUgJy4vc3F1YXJlLWRpc3RhbmNlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGFwaSA9IHt9XG5cbiAgdG90YWxzID0gWzAsIDAsIDBdXG4gIHZlY3RvcnMgPSBbXVxuICBjZW50cm9pZCA9IG51bGxcbiAgbGFzdE51bVZlY3RvcnMgPSBudWxsXG5cbiAgYXBpLmFkZCA9ICh2ZWN0b3IpIC0+XG4gICAgdG90YWxzW2ldICs9IHZhbCBmb3IgdmFsLCBpIGluIHZlY3RvclxuICAgIHZlY3RvcnMucHVzaCB2ZWN0b3JcblxuICBhcGkuY291bnQgPSAtPlxuICAgIHZlY3RvcnMubGVuZ3RoXG5cbiAgYXBpLmNlbnRyb2lkID0gLT5cbiAgICByZXR1cm4gY2VudHJvaWQgaWYgY2VudHJvaWQ/IGFuZCBsYXN0TnVtVmVjdG9ycyA9PSB2ZWN0b3JzLmxlbmd0aFxuICAgIHJldHVybiBpZiAoY291bnQgPSB2ZWN0b3JzLmxlbmd0aCkgPT0gMFxuICAgIG1lYW4gPSAoTWF0aC5yb3VuZCh0b3RhbC9jb3VudCkgZm9yIHRvdGFsIGluIHRvdGFscylcblxuICAgIGNlbnRyb2lkID0gdmVjdG9yc1swXVxuICAgIGxhc3ROdW1WZWN0b3JzID0gdmVjdG9ycy5sZW5ndGhcbiAgICBzbWFsbGVzdERpc3QgPSBkaXN0YW5jZShtZWFuLCBjZW50cm9pZClcblxuICAgIGZvciB2ZWN0b3IgaW4gdmVjdG9yc1sxLi5dXG4gICAgICBjb250aW51ZSB1bmxlc3MgKGRpc3QgPSBkaXN0YW5jZShtZWFuLCB2ZWN0b3IpKSA8IHNtYWxsZXN0RGlzdFxuICAgICAgY2VudHJvaWQgPSB2ZWN0b3JcbiAgICAgIHNtYWxsZXN0RGlzdCA9IGRpc3RcblxuICAgIGNlbnRyb2lkXG5cbiAgYXBpLmNsZWFyID0gLT5cbiAgICB0b3RhbHMgPSBudWxsXG4gICAgdmVjdG9ycy5sZW5ndGggPSAwXG4gICAgY2VudHJvaWQgPSBudWxsXG4gICAgbGFzdE51bVZlY3RvcnMgPSBudWxsXG5cbiAgYXBpXG4iLCJDbHVzdGVyICA9IHJlcXVpcmUgJy4vY2x1c3RlcidcbmRpc3RhbmNlID0gcmVxdWlyZSAnLi9zcXVhcmUtZGlzdGFuY2UnXG5cbk1BWF9UUklFUyA9IDEwMFxuXG4jIEZpbmRzIG51bUNsdXN0ZXJzIGNsdXN0ZXJzIGluIHZlY3RvcnMgKGJhc2VkIG9uIGdlb21ldHJpYyBkaXN0YW5jZSlcbiMgU29tZXdoYXQgay1tZWFucyBsaWtlLCBJIGd1ZXNzXG5tb2R1bGUuZXhwb3J0cyA9ICh2ZWN0b3JzLCBudW1DbHVzdGVycykgLT5cbiAgbnVtQ2x1c3RlcnMgPSBNYXRoLm1pbiB2ZWN0b3JzLmxlbmd0aCwgbnVtQ2x1c3RlcnNcbiAgcmV0dXJuIGJhaWwodmVjdG9ycywgbnVtQ2x1c3RlcnMpIGlmIHZlY3RvcnMubGVuZ3RoID09IG51bUNsdXN0ZXJzXG5cbiAgbnVtVHJpZXMgID0gMFxuICBjZW50cm9pZHMgPSBwaWNrRXZlbmx5KG51bUNsdXN0ZXJzLCAzLCAyNTUpXG4gIHByZXZDbHVzdGVycyA9IG51bGxcblxuICB3aGlsZSBudW1UcmllcyA8IE1BWF9UUklFUyBhbmQgIWNlbnRyb2lkc0VxdWFsKGNlbnRyb2lkcywgcHJldkNsdXN0ZXJzKVxuICAgIHByZXZDbHVzdGVycyA9IGNsdXN0ZXJzXG4gICAgY2x1c3RlcnMgID0gKENsdXN0ZXIoKSBmb3IgaSBpbiBbMC4uLm51bUNsdXN0ZXJzXSlcbiAgICBjZW50cm9pZHMgPSBzdGVwKHZlY3RvcnMsIGNlbnRyb2lkcywgY2x1c3RlcnMpXG4gICAgbnVtVHJpZXMrK1xuXG4gIGNsdXN0ZXJzXG5cbnN0ZXAgPSAodmVjdG9ycywgY2VudHJvaWRzLCBjbHVzdGVycykgLT5cbiAgZm9yIHZlY3RvciBpbiB2ZWN0b3JzXG4gICAgY2x1c3RlciA9IGNsdXN0ZXJzW2Nsb3Nlc3RDbHVzdGVySWR4KGNlbnRyb2lkcywgdmVjdG9yKV1cbiAgICBjbHVzdGVyLmFkZCB2ZWN0b3JcblxuICAoY2x1c3Rlci5jZW50cm9pZCgpIGZvciBjbHVzdGVyLCBpIGluIGNsdXN0ZXJzIHdoZW4gY2x1c3Rlci5jb3VudCgpID4gMClcblxuY2xvc2VzdENsdXN0ZXJJZHggPSAoY2VudHJvaWRzLCB2ZWN0b3IpIC0+XG4gIGNsb3Nlc3QgPSAwXG4gIHNtYWxsZXN0RGlzdCA9IDE5NTA3NiAjIGxhcmdlc3QgcG9zc2libGUgc3F1YXJlIGRpc3RhbmNlIGlzIDE5NTA3NSAoMjU1XjIgKiAzKVxuXG4gIGZvciBjLCBpZHggaW4gY2VudHJvaWRzXG4gICAgZGlzdCA9IGRpc3RhbmNlKGMsIHZlY3RvcilcbiAgICBpZiBkaXN0IDwgc21hbGxlc3REaXN0XG4gICAgICBjbG9zZXN0ID0gaWR4XG4gICAgICBzbWFsbGVzdERpc3QgPSBkaXN0XG5cbiAgY2xvc2VzdFxuXG5waWNrUmFuZG9tID0gKG4sIHNhbXBsZXMpIC0+XG4gIHBpY2tzID0gW11cbiAgc2FtcGxlcyA9ICh2IGZvciB2IGluIHNhbXBsZXMpXG5cbiAgZm9yIF8gaW4gWzAuLi5uXVxuICAgIGlkeCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNhbXBsZXMubGVuZ3RoKVxuICAgIHBpY2tzLnB1c2goc2FtcGxlc1tpZHhdKVxuICAgIHNhbXBsZXMuc3BsaWNlKGlkeCwgMSlcbiAgcGlja3NcblxucGlja0V2ZW5seSA9IChuLCBkaW1lbnNpb25zLCByYW5nZSkgLT5cbiAgY2h1bmsgPSByYW5nZSAvIG5cbiAgdmVjdG9ycyA9IFtdXG5cbiAgZm9yIGkgaW4gWzAuLi5uXVxuICAgIHMgPSBNYXRoLnJvdW5kIGNodW5rICogaSArIGNodW5rLzJcbiAgICB2ZWN0b3JzLnB1c2ggKHMgZm9yIGRpbSBpbiBbMC4uLmRpbWVuc2lvbnNdKVxuXG4gIHZlY3RvcnNcblxuY2VudHJvaWRzRXF1YWwgPSAob2xkLCBjbHVzdGVycykgLT5cbiAgcmV0dXJuIGZhbHNlIHVubGVzcyBjbHVzdGVyc1xuICBmb3IgY2VudHJvaWQsIGkgaW4gb2xkXG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyB2ZWN0b3JzRXF1YWwoY2VudHJvaWQsIGNsdXN0ZXJzW2ldLmNlbnRyb2lkKCkpXG5cbiAgdHJ1ZVxuXG52ZWN0b3JzRXF1YWwgPSAoYSwgYikgLT5cbiAgcmV0dXJuIGZhbHNlIGlmIChhIGFuZCAhYikgb3IgKGIgYW5kICFhKSBvciAoIWEgYW5kICFiKVxuICBmb3IgdmFsLCBpIGluIGFcbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHZhbCA9PSBiW2ldXG5cbiAgdHJ1ZVxuXG5iYWlsID0gKHZlY3RvcnMsIG51bUNsdXN0ZXJzKSAtPlxuICBjbHVzdGVycyA9IChDbHVzdGVyKCkgZm9yIGkgaW4gWzAuLi5udW1DbHVzdGVyc10pXG4gIGNsdXN0ZXIuYWRkKHZlY3RvcnMuYXQoaSkpIGZvciBjbHVzdGVyLCBpIGluIGNsdXN0ZXJzXG4gIGNsdXN0ZXJzXG4iLCJNQVhfUElYRUxTID0gMTAwMDBcblxubW9kdWxlLmV4cG9ydHMgPSAoc3JjT3JJbWcpIC0+IG5ldyBQcm9taXNlIChhY2NlcHQsIHJlamVjdCkgLT5cbiAgaW1hZ2UgPSBuZXcgSW1hZ2UoKVxuICBpbWFnZS5vbmxvYWQgPSAtPiBhY2NlcHQocGl4ZWxEYXRhKGltYWdlKSlcbiAgaW1hZ2Uuc3JjID0gaWYgc3JjT3JJbWcuc3JjIHRoZW4gc3JjT3JJbWcuc3JjIGVsc2UgKHNyY09ySW1nIG9yICcnKVxuXG5cbnBpeGVsRGF0YSA9IChpbWFnZSkgLT5cbiAgYXNwZWN0ID0gaW1hZ2Uud2lkdGggLyBpbWFnZS5oZWlnaHRcblxuICBoZWlnaHQgPSBNYXRoLnNxcnQgTUFYX1BJWEVMUy9hc3BlY3RcbiAgd2lkdGggID0gaGVpZ2h0ICogYXNwZWN0XG5cbiAgW3dpZHRoLCBoZWlnaHRdID0gW01hdGgucm91bmQod2lkdGgpLCBNYXRoLnJvdW5kKGhlaWdodCldXG4gICNbd2lkdGgsIGhlaWdodF0gPSBbaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodF1cblxuICBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpXG4gIGNhbnZhcy53aWR0aCAgPSB3aWR0aFxuICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0XG5cbiAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJylcbiAgY3R4LmRyYXdJbWFnZShpbWFnZSwgMCwgMClcbiAgY3R4LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KS5kYXRhXG4iLCIvLyBDYWxjdWxhdGVzIHRoZSBzcXVhcmUgZGlzdGFuY2Ugb2YgdHdvIHZlY3RvcnMgKHByZXNlbnRlZCBhcyBhcnJheXMpLlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzcXVhcmVEaXN0YW5jZShhLCBiKSB7XG4gIHZhciBkZWx0YVN1bSA9IDA7XG4gIHZhciBkaW0gPSBhLmxlbmd0aDtcblxuICBmb3IodmFyIGkgPSAwOyBpIDwgZGltOyBpKyspXG4gICAgZGVsdGFTdW0gPSBkZWx0YVN1bSArIE1hdGgucG93KChiW2ldIC0gYVtpXSksIDIpO1xuXG4gIHJldHVybiBkZWx0YVN1bTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRvUmdiQXJyYXkoaW1hZ2VEYXRhKSB7XG4gIHZhciByZ2JWZWN0b3JzID0gW107XG4gIHZhciBudW1QaXhlbHMgPSBpbWFnZURhdGEubGVuZ3RoIC8gNDtcbiAgdmFyIG9mZnNldDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVBpeGVsczsgaSsrKSB7XG4gICAgb2Zmc2V0ID0gaSAqIDQ7XG4gICAgcmdiVmVjdG9ycy5wdXNoKFxuICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGltYWdlRGF0YSwgW29mZnNldCwgb2Zmc2V0KzNdKVxuICAgICk7XG4gIH1cblxuICByZXR1cm4gcmdiVmVjdG9ycztcbn07XG4iLCJJbWFnZURhdGEgPSByZXF1aXJlIFwiLi4vc3JjL2ltYWdlLWRhdGFcIlxuUGFsZXR0ZSA9IHJlcXVpcmUgXCIuLi9cIlxuXG5tYWtlUGFsZXR0ZUVsID0gKHBhbGV0dGUpIC0+XG4gIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcblxuICBjb2xvckNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcbiAgY291bnRDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG4gIGZvciBjLCBpIGluIHBhbGV0dGUuY29sb3JzXG4gICAgYyA/PSBbXVxuICAgIGNvbG9yRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG4gICAgY29sb3JFbC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1ibG9jaydcbiAgICBjb2xvckVsLnN0eWxlLndpZHRoICAgPSA0MCArJ3B4J1xuICAgIGNvbG9yRWwuc3R5bGUuaGVpZ2h0ICA9IDIwICsncHgnXG4gICAgY29sb3JFbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJnYigje2Muam9pbignLCcpfSlcIlxuXG4gICAgY291bnRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcbiAgICBjb3VudEVsLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJ1xuICAgIGNvdW50RWwuc3R5bGUud2lkdGggICA9IDQwICsncHgnXG4gICAgY291bnRFbC5zdHlsZS5oZWlnaHQgID0gMjAgKydweCdcbiAgICBjb3VudEVsLnN0eWxlLmZvbnRTaXplID0gMTErJ3B4J1xuICAgIGNvdW50RWwuc3R5bGUudGV4dEFsaWduID0gJ2NlbnRlcidcbiAgICBjb3VudEVsLmlubmVySFRNTCA9IHBhbGV0dGUuY291bnRzW2ldXG5cbiAgICBjb2xvckNvbnRhaW5lci5hcHBlbmRDaGlsZChjb2xvckVsKVxuICAgIGNvdW50Q29udGFpbmVyLmFwcGVuZENoaWxkKGNvdW50RWwpXG5cbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNvbG9yQ29udGFpbmVyKVxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY291bnRDb250YWluZXIpXG4gIGNvbnRhaW5lclxuXG5zaG93VGVzdEltYWdlID0gKGkpIC0+XG4gIFBhbGV0dGUgXCIje2l9LmpwZ1wiLCA1LCAocGFsZXR0ZSkgLT5cbiAgICBpbWcgPSBuZXcgSW1hZ2UoKVxuICAgIGltZy5zcmMgPSBcIiN7aX0uanBnXCJcbiAgICBpbWcuc3R5bGUubWFyZ2luVG9wID0gMjArJ3B4J1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaW1nKVxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgbWFrZVBhbGV0dGVFbChwYWxldHRlKVxuXG5zaG93VGVzdEltYWdlKGkpIGZvciBpIGluIFsxLi4zXVxuXG5cbiJdfQ==
