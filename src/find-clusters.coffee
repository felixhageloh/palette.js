Cluster  = require './cluster'
distance = require './distance'

# Finds numClusters clusters in vectors (based on geometric distance)
# Somewhat k-means like, I guess
module.exports = (vectors, numClusters) ->
  numClusters = Math.min vectors.length, numClusters

  return bail(vectors, numClusters) if vectors.length == numClusters

  numTries  = 0
  centroids = pickEvenly(numClusters, 3, 255)     #pickRandom(numClusters, vectors)
  prevClusters = null

  while numTries < 1000 and !centroidsEqual(centroids, prevClusters)
    prevClusters = clusters
    clusters  = (Cluster() for i in [0...numClusters])
    centroids = step(vectors, centroids, clusters)
    numTries++

  clusters

step = (vectors, centroids, clusters) ->
  for vector in vectors
    cluster = clusters[closestIdx(centroids, vector)]
    cluster.add vector

  (cluster.centroid() for cluster, i in clusters when cluster.count() > 0)

closestIdx = (centroids, vector) ->
  closest   = 0
  smallestDist = null

  for c, idx in centroids
    dist = distance(c, vector)
    smallestDist ?= dist
    if dist < smallestDist
      closest = idx
      smallestDist = dist

  closest

pickRandom = (n, samples) ->
  picks = []
  samples = (v for v in samples)

  for _ in [0...n]
    idx = Math.floor(Math.random() * samples.length)
    picks.push(samples[idx])
    samples.splice(idx, 1)
  picks

pickEvenly = (n, dimensions, range) ->
  chunk = range / n
  vectors = []

  for i in [0...n]
    s = Math.round chunk * i + chunk/2
    vectors.push (s for dim in [0...dimensions])

  vectors


centroidsEqual = (old, clusters) ->
  return false unless clusters
  for centroid, i in old
    return false unless vectorsEqual(centroid, clusters[i].centroid())

  true

vectorsEqual = (a, b) ->
  return false if (a and !b) or (b and !a) or (!a and !b)
  for val, i in a
    return false unless val == b[i]

  true

bail = (vectors, numClusters) ->
  clusters = (Cluster() for i in [0...numClusters])
  cluster.add(vectors[i]) for cluster, i in clusters
  clusters
