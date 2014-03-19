var path = require("path"),
    livelyLoader = require('../index.js');

var tests = {

  setUp: function (callback) {
    global.livelyLoaderTests = { loadedModules: [] }
    callback();
  },

  tearDown: function (callback) {
    delete global.livelyLoaderTests;
    callback();
  },

  testSimpleModuleLoad: function(test) {
    livelyLoader.setRoot(path.join(__dirname, 'test-modules'));
    livelyLoader.load('a', function(err) {
      test.ok(!err, String(err));
    	test.deepEqual(livelyLoaderTests.loadedModules, ['a']);
    	test.done();
    });
  },

  testLoadModuleWithDependency: function(test) {
    livelyLoader.setRoot(path.join(__dirname, 'test-modules'));
    livelyLoader.load('b', function(err) {
      test.ok(!err, String(err));
    	test.deepEqual(livelyLoaderTests.loadedModules, ['dir1.c', 'b']);
    	test.done();
    });
  }

};

module.exports = tests;
