var MAX_TRIES = 20;
var MAX_PIXELS = 10000;

var ImageData = require('./src/image-data');
var toRgbVectors = require('./src/to-rgb-vectors');
var findClusters = require('./src/find-clusters');

module.exports = function Palette(srcOrImage, numColors, callback) {
  return ImageData(srcOrImage, MAX_PIXELS)
    .then(function(data) {
      var vectors = toRgbVectors(data)
      var clusters = findClusters(vectors, numColors, MAX_TRIES);
      clusters = clusters.sort(function(a,b) {
        return b.count() - a.count();
      });
      callback({
        numSamples: vectors.length,
        colors: clusters.map(function(cluster) { return cluster.centroid(); }),
        counts: clusters.map(function(cluster) { return cluster.count(); }),
      });
    })
    .catch(function (err) { console.error(err) })
}

