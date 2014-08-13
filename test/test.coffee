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


makePaletteEl = (palette) ->
  container = document.createElement 'div'

  colorContainer = document.createElement 'div'
  countContainer = document.createElement 'div'
  for c, i in palette.colors
    c ?= []
    colorEl = document.createElement 'div'
    colorEl.style.display = 'inline-block'
    colorEl.style.width   = 40 +'px'
    colorEl.style.height  = 20 +'px'
    colorEl.style.backgroundColor = "rgb(#{c.join(',')})"

    countEl = document.createElement 'div'
    countEl.style.display = 'inline-block'
    countEl.style.width   = 40 +'px'
    countEl.style.height  = 20 +'px'
    countEl.style.fontSize = 11+'px'
    countEl.style.textAlign = 'center'
    countEl.innerHTML = palette.counts[i]

    colorContainer.appendChild(colorEl)
    countContainer.appendChild(countEl)

  container.appendChild(colorContainer)
  container.appendChild(countContainer)
  container


showTestImage = (i) ->
  Palette "#{i}.jpg", 5, (palette) ->
    img = new Image()
    img.src = "#{i}.jpg"
    img.style.marginTop = 20+'px'
    document.body.appendChild(img)
    document.body.appendChild makePaletteEl(palette)

showTestImage(i) for i in [1..3]


