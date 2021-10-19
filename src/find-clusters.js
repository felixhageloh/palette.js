var Cluster = require("./cluster");
var distance = require("./square-distance");

// Finds numClusters clusters in vectors (based on geometric distance)
// Somewhat k-means like, I guess
module.exports = function findCluster(vectors, numClusters, maxTries) {
  var numClusters = Math.min(vectors.length, numClusters);
  if (vectors.length === numClusters) return bail(vectors, numClusters);

  var numTries = 0;
  var centroids = pickEvenly(numClusters, 3, 255);
  var prevClusters = null;

  while (numTries < maxTries && !centroidsEqual(centroids, prevClusters)) {
    prevClusters = clusters;
    var clusters = [];
    for (var i = 0; i < numClusters; i++) clusters.push(Cluster());
    centroids = step(vectors, centroids, clusters);
    numTries++;
  }
  return clusters;
};

function step(vectors, centroids, clusters) {
  var numVectors = vectors.length;
  for (var i = 0; i < numVectors; i++) {
    cluster = clusters[closestClusterIdx(centroids, vectors[i])];
    cluster.add(vectors[i]);
  }
  var numClusters = clusters.length;
  for (var j = 0; j < numClusters; j++) {
    var cluster = clusters[j];
    if (cluster.count() > 0) cluster.mean();
  }

  return clusters.reduce(function (newCentroids, cluster) {
    if (cluster.count() > 0) newCentroids.push(cluster.mean());
    return newCentroids;
  }, []);
}

function closestClusterIdx(centroids, vector) {
  var closest = 0;
  // largest possible square distance is 195075 (255^2 * 4)
  var smallestDist = 260101;

  var numCentroids = centroids.length;
  for (var i = 0; i < numCentroids; i++) {
    var dist = distance(centroids[i], vector);
    if (dist < smallestDist) {
      closest = i;
      smallestDist = dist;
    }
  }

  return closest;
}

function pickRandom(n, samples) {
  var picks = [];
  var remainingSamples = samples.slice();

  for (var i = 0; i < n; i++) {
    var idx = Math.floor(Math.random() * remainingSamples.length);
    picks.push(remainingSamples[idx]);
    remainingSamples.splice(idx, 1);
  }

  return picks;
}

function pickEvenly(n, dimensions, range) {
  var chunk = range / n;
  var vectors = [];

  for (var i = 0; i < n; i++) {
    var s = Math.round(chunk * i + chunk / 2);
    vectors.push(Array(dimensions).fill(s));
  }

  return vectors;
}

function centroidsEqual(old, clusters) {
  if (!clusters) return false;
  for (var i = 0; i < old.length; i++) {
    if (!vectorsEqual(old[i], clusters[i].centroid())) return false;
  }
  return true;
}

function vectorsEqual(a, b) {
  if ((a && !b) || (b && !a) || (!a && !b)) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function bail(vectors, numClusters) {
  var clusters = [];
  for (var i = 0; i < numClusters; i++) {
    var cluster = Cluster();
    cluster.add(vectors.at(i));
    clusters.push(cluster);
  }
  return clusters;
}
