# This is NOT how you write tests kids, so don't try this at home
Img = require "src/image"
Palette = require "src/palette"

Img 'test.png', (image) ->
  console.log 'image loaded'

  numPixels = 0
  image.eachPixel (rgb) -> numPixels++
  console.log "it has", numPixels, "pixels\n"


Palette 'test.png', 3, (palette) ->
  console.log "got palette: ", palette.colors
  console.log "sampled", palette.numSamples, "pixels"
  console.log "counts for each color", palette.counts

