MAX_TRIES = 100
MAX_PIXELS = 10000

ImageData = require './src/image-data'
toRgbVectors = require './src/to-rgb-vectors'
findClusters = require './src/find-clusters'

module.exports = (srcOrImage, numColors, callback) ->
  ImageData(srcOrImage, MAX_PIXELS)
    .then (data) ->
      vectors = toRgbVectors(data)
      clusters = findClusters(vectors, numColors, MAX_TRIES)
      clusters = clusters.sort (a,b) -> b.count() - a.count()

      callback {
        numSamples: vectors.length
        colors: (cluster.centroid() for cluster in clusters)
        counts: (cluster.count() for cluster in clusters)
      }


