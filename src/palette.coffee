Img    = require './image'
findClusters = require './find-clusters'

module.exports = (srcOrImage, numColors, callback) ->

  run = (image) ->
    pixels = []
    image.eachPixel (p) -> pixels.push(p) if p

    clusters = findClusters pixels, numColors
    clusters = clusters.sort (a,b) -> b.count() - a.count()

    callback {
      numSamples: pixels.length
      colors    : (cluster.centroid() for cluster, i in clusters)
      counts    : (cluster.count()    for cluster, i in clusters)
    }

  Img srcOrImage, run


