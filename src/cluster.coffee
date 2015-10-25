distance = require './square-distance'

module.exports = ->
  api = {}

  totals = [0, 0, 0]
  vectors = []
  centroid = null
  lastNumVectors = null

  api.add = (vector) ->
    totals[i] += val for val, i in vector
    vectors.push vector

  api.count = ->
    vectors.length

  api.centroid = ->
    return centroid if centroid? and lastNumVectors == vectors.length
    mean = api.mean()

    return unless mean
    centroid = vectors[0]
    lastNumVectors = vectors.length
    smallestDist = distance(mean, centroid)

    for vector in vectors[1..]
      continue unless (dist = distance(mean, vector)) < smallestDist
      centroid = vector
      smallestDist = dist

    centroid

  api.mean = ->
    return if (count = vectors.length) == 0
    (Math.round(total/count) for total in totals)

  api.clear = ->
    totals = null
    vectors.length = 0
    centroid = null
    lastNumVectors = null

  api
