distance = require 'src/distance'

module.exports = (centroid) ->
  api = {}

  totals   = null # keep a running total
  vectors  = []

  api.add = (vector) ->
    totals ?= (0 for _ in vector)
    throw new Error("dimensions don't match") unless vector.length == totals.length

    for val, i in vector
      totals[i] += val * (vector.weight ? 1)

    centroid = null
    vectors.push vector

  api.count = ->
    vectors.length

  api.centroid = ->
    return centroid if centroid?
    return if (count = vectors.length) == 0
    mean = (Math.round(total/count) for total in totals)

    centroid     = vectors[0]
    smallestDist = distance(mean, centroid)

    for vector in vectors[1..]
      continue unless (dist = distance(mean, vector)) < smallestDist
      centroid     = vector
      smallestDist = dist

    centroid

  api.clear = ->
    totals = null
    vectors.length = 0
    centroid = null

  api
