var ImageData = require("../src/image-data");
var Palette = require("../index");

function makePaletteEl(image, palette) {
  image.style.border = '1px solid #ccc'
  image.style.maxWidth = '280px'

  var container = document.createElement('div')
  container.style.display = 'inline-block'
  container.style.textAlign = 'center'
  container.style.padding = '0 16px'

  var colorContainer = document.createElement('div')
  colorContainer.style.textAlign = 'left'
  colorContainer.style.border = '1px solid #ddd'
  colorContainer.style.fontSize = '0'

  var countContainer = document.createElement('div')
  countContainer.style.textAlign = 'left'
  for (var i = 0; i < palette.colors.length; i++) {
    var c = palette.colors[i] || [];
    var colorEl = document.createElement('div')
    colorEl.style.display = 'inline-block'
    colorEl.style.width   = 40 +'px'
    colorEl.style.height  = 20 +'px'
    colorEl.style.backgroundColor = "rgb(" + c.join(',') + ")"

    var countEl = document.createElement('div')
    countEl.style.display = 'inline-block'

    countEl.style.width   = 40 +'px'
    countEl.style.height  = 20 +'px'
    countEl.style.fontSize = 11+'px'
    countEl.style.textAlign = 'center'
    countEl.innerHTML = palette.counts[i]

    colorContainer.appendChild(colorEl)
    countContainer.appendChild(countEl)
  }

  container.appendChild(image)
  container.appendChild(colorContainer)
  container.appendChild(countContainer)

  return container
}

function showTestImage(i) {
  Palette(i + ".jpg", 7, function(palette) {
    var img = new Image()
    img.src = i + ".jpg"
    img.style.marginTop = 20+'px'

    document.body.appendChild(makePaletteEl(img, palette));
  });
}

for (var i = 1; i < 7; i++) showTestImage(i);

