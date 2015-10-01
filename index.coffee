ImageData = require './src/image-data'
toRgbVectors = require './src/to-rgb-vectors'
findClusters = require './src/find-clusters'

module.exports = (srcOrImage, numColors, callback) ->
  ImageData(srcOrImage)
    .then (data) ->
      vectors = toRgbVectors(data)
      clusters = findClusters(vectors, numColors)
      clusters = clusters.sort (a,b) -> b.count() - a.count()

      callback {
        numSamples: vectors.length
        colors: (cluster.centroid() for cluster in clusters)
        counts: (cluster.count() for cluster in clusters)
      }


