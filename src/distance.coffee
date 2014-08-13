  # Calculates the square distance of two vectors (presented as arrays).
  # Undefined if vector dimensions don't match
  module.exports = (a, b) ->
    return if (dim = a.length) != b.length
    deltaSum  = 0
    deltaSum += Math.pow((b[i] - a[i]), 2) for i in [0...dim]

    deltaSum
