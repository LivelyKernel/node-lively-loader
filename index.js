var vm = require("vm");
var util = require("util");
var path = require("path");
var fs = require("fs");
var async = require("async");

var root = '';


function resolve(moduleName) {
  console.log("resolve");
  var ext = '.js';
  return function(next) {
    next(null, path.join(root, moduleName + ext), moduleName);
  }
}

function readFromDisk(fn, moduleName, next) {
  console.log("readFromDisk");
  fs.readFile(fn, function(err, content) {
    next(err, content, fn, moduleName)
  });
}

function wrapModule(moduleContent, fileName, moduleName, next) {
  console.log("wrapModule");
  var header = 'var require = function() { return {toRun: function(cb) { cb(); }}; };\n'
             + 'var module = function(mName) { return {requires: require} };\n';
  next(null, header + moduleContent, fileName, moduleName);
}

function runModule(code, fileName, moduleName, next) {
  console.log("runModule");
  var err;
  try {
    vm.runInThisContext(code);
  } catch (e) { err = e; }
  next(err);
}

module.exports = {

  setRoot: function(dir) { root = dir; },

  load: function(moduleName, thenDo) {
    async.waterfall([
      resolve(moduleName),
      readFromDisk,
      wrapModule,
      runModule
    ], thenDo);
  }
}