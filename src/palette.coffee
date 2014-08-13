Bucket = require 'src/bucket'
Img    = require 'src/image'
findClusters = require 'src/find-clusters'

module.exports = (srcOrImage, numColors, callback) ->

  run = (image) ->
    pixels = []
    image.eachPixel (p) -> pixels.push(p) if p

    buckets = findClusters pixels, numColors
    buckets = buckets.sort (a,b) -> b.count() - a.count()

    callback {
      numSamples: pixels.length
      colors    : (bucket.centroid() for bucket, i in buckets)
      counts    : (bucket.count()    for bucket, i in buckets)
    }

  Img srcOrImage, run


