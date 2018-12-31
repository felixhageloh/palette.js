var distance = require('./square-distance');

module.exports = function Cluster() {
  var api = {};

  var totals = [0, 0, 0];
  var vectors = [];
  var centroid;
  var lastNumVectors;

  api.add = function add(vector) {
    for (var i = 0; i < vector.length; i++) {
      totals[i] = totals[i] + vector[i];
    }
    vectors.push(vector);
  }

  api.count = function count() {
    return vectors.length;
  }

  api.centroid = function calcCentroid() {
    if (!!centroid && lastNumVectors === vectors.length) return centroid;
    var mean = api.mean();

    if (!mean) return centroid;
    centroid = vectors[0];
    lastNumVectors = vectors.length;
    smallestDist = distance(mean, centroid);

    for (var i = 1; i < vectors.length; i++) {
      var dist = distance(mean, vectors[i]);
      if (dist < smallestDist) {
        centroid = vectors[i];
        smallestDist = dist;
      }
    }

    return centroid;
  }

  api.mean = function calcMean() {
    var count = api.count();
    if (count == 0) return;
    return totals.map(function(total) { return Math.round(total/count); });
  }

  api.clear = function clear() {
    totals = null
    vectors.length = 0
    centroid = null
    lastNumVectors = null
  }

  return api;
}
