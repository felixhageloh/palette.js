ImageData = require "../src/image-data"
Palette = require "../index.coffee"

makePaletteEl = (image, palette) ->
  image.style.border = '1px solid #ccc'
  image.style.maxWidth = '280px'

  container = document.createElement 'div'
  container.style.display = 'inline-block'
  container.style.textAlign = 'center'
  container.style.padding = '0 16px'

  colorContainer = document.createElement 'div'
  colorContainer.style.textAlign = 'left'
  colorContainer.style.border = '1px solid #ddd'
  colorContainer.style.fontSize = '0'

  countContainer = document.createElement 'div'
  countContainer.style.textAlign = 'left'
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

  container.appendChild(image)
  container.appendChild(colorContainer)
  container.appendChild(countContainer)
  container

showTestImage = (i) ->
  Palette "#{i}.jpg", 7, (palette) ->
    img = new Image()
    img.src = "#{i}.jpg"
    img.style.marginTop = 20+'px'

    document.body.appendChild makePaletteEl(img, palette)

showTestImage(i) for i in [1..6]

