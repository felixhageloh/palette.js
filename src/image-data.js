module.exports = function imageData(srcOrImg, maxPixels) {
  var image = new Image();
  var promise = new Promise(function(accept, reject) {
    image.onload = function() { accept(toData(image, maxPixels)); };
  });

  image.src = srcOrImg.src ? srcOrImg.src : (srcOrImg || '');

  return promise;
};

function toData(image, maxPixels) {
  var size = clampImageSize(image, maxPixels);
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');

  canvas.width = size.width;
  canvas.height = size.height;
  ctx.drawImage(image, 0, 0);

  return ctx.getImageData(0, 0, size.width, size.height)
    .data;
}

function clampImageSize(image, maxPixels) {
  var aspect = image.width / image.height;
  var height = Math.sqrt(maxPixels / aspect);
  var width = height * aspect;

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}
