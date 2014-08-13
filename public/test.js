(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
require.register("test/test", function(exports, require, module) {
var Img, Palette, i, makePaletteEl, showTestImage, _i;

Img = require("src/image");

Palette = require("src/palette");

Img('test.png', function(image) {
  var numPixels;
  console.log('image loaded');
  numPixels = 0;
  image.eachPixel(function(rgb) {
    return numPixels++;
  });
  return console.log("it has", numPixels, "pixels\n");
});

Palette('test.png', 3, function(palette) {
  console.log("got palette: ", palette.colors);
  console.log("sampled", palette.numSamples, "pixels");
  return console.log("counts for each color", palette.counts);
});

makePaletteEl = function(palette) {
  var c, colorContainer, colorEl, container, countContainer, countEl, i, _i, _len, _ref;
  container = document.createElement('div');
  colorContainer = document.createElement('div');
  countContainer = document.createElement('div');
  _ref = palette.colors;
  for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
    c = _ref[i];
    if (c == null) {
      c = [];
    }
    colorEl = document.createElement('div');
    colorEl.style.display = 'inline-block';
    colorEl.style.width = 40 + 'px';
    colorEl.style.height = 20 + 'px';
    colorEl.style.backgroundColor = "rgb(" + (c.join(',')) + ")";
    countEl = document.createElement('div');
    countEl.style.display = 'inline-block';
    countEl.style.width = 40 + 'px';
    countEl.style.height = 20 + 'px';
    countEl.style.fontSize = 11 + 'px';
    countEl.style.textAlign = 'center';
    countEl.innerHTML = palette.counts[i];
    colorContainer.appendChild(colorEl);
    countContainer.appendChild(countEl);
  }
  container.appendChild(colorContainer);
  container.appendChild(countContainer);
  return container;
};

showTestImage = function(i) {
  return Palette("" + i + ".jpg", 8, function(palette) {
    var img;
    img = new Image();
    img.src = "" + i + ".jpg";
    img.style.marginTop = 20 + 'px';
    document.body.appendChild(img);
    return document.body.appendChild(makePaletteEl(palette));
  });
};

for (i = _i = 1; _i <= 3; i = ++_i) {
  showTestImage(i);
}
});

;
//# sourceMappingURL=test.js.map