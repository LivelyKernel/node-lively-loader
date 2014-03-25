var path = require("path"),
    livelyLoader = require('../index.js');

var tests = {

  setUp: function (callback) {
    global.livelyLoaderTests = { loadedModules: [] }
    livelyLoader.start({}, function() {
        lively.Config.codeBase = 'file://' + path.join(__dirname, 'test-modules') + '/';
        callback();
    });
  },

  tearDown: function (callback) {
    delete global.livelyLoaderTests;
    callback();
  },

  testIfItWorksAtAll: function(test) {
    test.ok(!!Object.extend, 'lively extensions not loaded?');
    test.ok(!!lively.Config, 'lively objects not loaded?');
    test.ok(!!lively.Module, 'lively objects not loaded 2?');

    var m = lively.module('foo.bar');
    // var m = new lively.Module(Global, 'foo.bar');
    test.equals(m.uri(), livelyLoader.defaultOptions.codeBase + 'foo/bar.js');
    test.done();
  },

  testSimpleModuleLoad: function(test) {
    lively.require('a').toRun(function() {
    	test.deepEqual(livelyLoaderTests.loadedModules, ['a']);
    	test.done();
    })
  },

  testLoadModuleWithDependency: function(test) {
    lively.require('b').toRun(function() {
    	test.deepEqual(livelyLoaderTests.loadedModules, ['dir1.c', 'b']);
    	test.done();
    });
  }

};

module.exports = tests;
