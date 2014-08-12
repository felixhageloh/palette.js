module.exports = ->
  api = {}

  r = g = b = total = 0

  api.add = (rgb) ->
    r += rgb[0]
    b += rgb[1]
    g += rgb[2]

    total++

  api.count = ->
    total

  api.meanRgb = ->
    [Math.round(r/total), Math.round(g/total), Math.round(b/total)]

  api
