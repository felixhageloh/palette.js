Bucket = require 'src/bucket'
Img    = require 'src/image'

NUM_BUCKETS = 27 # must be a power of 3 or it will be converted to the closest power of 3

module.exports = (srcOrImage, numColors, callback) ->
  buckets            = []
  chunksPerDimension = 0
  chunkSize          = 1

  run = (image) ->
    # split a 3d space into numBuckets even sized cubes
    chunksPerDimension = Math.round Math.pow(NUM_BUCKETS, 1/3)
    numBuckets  = Math.pow chunksPerDimension, 3
    chunkSize   = 255 / chunksPerDimension

    buckets    = (Bucket() for _ in [0..numBuckets])
    numSamples = fillBuckets(image)

    buckets = (b for b in buckets when b.count() > 0)
    buckets = buckets.sort (a,b) -> b.count() - a.count()

    callback {
      numSamples: numSamples
      colors    : (bucket.meanRgb() for bucket, i in buckets when i < numColors)
      counts    : (bucket.count()   for bucket, i in buckets when i < numColors)
    }

  fillBuckets = (image) ->
    count = 0
    image.eachPixel (rgb) ->
      return unless (bucket = chooseBucket(rgb))
      bucket.add(rgb)
      count++
    count

  # get the bucket index of a bgr color array. Essentially we devide
  # the color space into n equal sized qubes, where n is the number of
  # buckets. Buckets are labled 0 to n where 0 is at x=y=z=0 and
  # n is at x=y=z=sqrt(n,3)
  chooseBucket = (rgb) ->
    bucketIdx = 0

    for colorValue, dim in rgb
      k = Math.pow(chunksPerDimension, dim)
      bucketIdx = bucketIdx + k * colorComponentChunk(colorValue)

    buckets[bucketIdx]

  # get the chunk index for a single dimension (zero based).
  # If numBuckets is 8, then the number of chunks per dimension
  # is 2, so the possible return values are 0 to 1.
  colorComponentChunk = (colorValue) ->
    idx = Math.floor colorValue / chunkSize

    # ranges are endpoint exclusive, so if colorValue == 2*chunkSize
    # the corresponding coordinate is still 1
    idx-- if idx != 0 and colorValue % chunkSize == 0
    idx

  Img 'test.png', run


