getImageData = (image) ->
  ctx = document.createElement("canvas").getContext('2d')
  ctx.drawImage(image, 0, 0)
  ctx.getImageData(0, 0, image.width, image.height).data


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

    callback getRgb(i) for i in [0..length-1] by 4

  init()
