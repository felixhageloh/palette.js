var MAX_TRIES = 20;
var MAX_PIXELS = 10000;

var ImageData = require("./src/image-data");
var toRgbaVectors = require("./src/toRgbaVectors");
var findClusters = require("./src/find-clusters");

module.exports = function Palette(srcOrImage, numColors, callback) {
  return ImageData(srcOrImage, MAX_PIXELS)
    .then(function (data) {
      var vectors = toRgbaVectors(data);
      var clusters = findClusters(vectors, numColors, MAX_TRIES);
      clusters = clusters.sort(function (a, b) {
        return b.count() - a.count();
      });
      callback({
        numSamples: vectors.length,
        colors: clusters.map(function (cluster) {
          const color = cluster.centroid();
          return color ? color.slice(0, 3).concat(color[3] / 255) : undefined;
        }),
        counts: clusters.map(function (cluster) {
          return cluster.count();
        }),
      });
    })
    .catch(function (err) {
      console.error(err);
    });
};
