module.exports = (srcOrImg, callback) ->
  api = {}

  image = null

  init = ->
    image = new Image()
    image.onload = -> callback(api)
    image.src = if srcOrImg.src then srcOrImg.src else (srcOrImg or '')
    return

  api.eachPixel = (callback) ->
    data   = getImageData(image)
    length = data.length or image.width * image.height

    getRgb = (pixelIdx)  ->
      Array::slice.apply(data, [pixelIdx, pixelIdx+3])

    callback getRgb(i) for i in [0...length] by 4

  init()

MAX_PIXELS = 10000

getImageData = (image) ->
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
