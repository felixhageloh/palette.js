MAX_PIXELS = 10000

module.exports = (srcOrImg) -> new Promise (accept, reject) ->
  image = new Image()
  image.onload = -> accept(pixelData(image))
  image.src = if srcOrImg.src then srcOrImg.src else (srcOrImg or '')


pixelData = (image) ->
  aspect = image.width / image.height

  height = Math.sqrt MAX_PIXELS/aspect
  width  = height * aspect

  [width, height] = [Math.round(width), Math.round(height)]
  #[width, height] = [image.width, image.height]

  canvas = document.createElement("canvas")
  canvas.width  = width
  canvas.height = height

  ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0)
  ctx.getImageData(0, 0, width, height).data
