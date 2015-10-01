var fs = require('fs');
var test = require('tape');
var toRgbVectors = require('../src/to-rgb-vectors');
var testBitmap = fs.readFileSync(__dirname + '/files/test.png');

test('rgb-iterator', function(t) {
  var image = new Image();
  image.src = 'data:image/png;base64,' + testBitmap.toString('base64');

  image.onload = function() {
    var vectors = toRgbVectors(getPixles(image));

    console.log(vectors)

    t.equal(vectors.length, 4, 'there are 4 pixels');
    t.looseEqual(vectors[0], [255, 0 , 0], 'pixel 1 is red');
    t.looseEqual(vectors[1], [0, 255 , 0], 'pixel 2 is green');
    t.looseEqual(vectors[2], [0, 0, 255], 'pixel 3 is blue');
    t.looseEqual(vectors[3], [255, 255 , 255], 'pixel 4 is white');

    t.end();
  };
});

function getPixles(img) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  return ctx.getImageData(0, 0, img.width, img.height).data;
}
