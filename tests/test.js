/*global describe, it,afterEach, beforeEach,require,console,__dirname,global,process,setTimeout*/

var path = require("path");
var assert = require("assert")
var livelyLoader;
var debug = false;

function log(/*args*/) {
  if (debug) console.log.apply(console, arguments);
}

describe('lively loader', function() {

  beforeEach(function(callback) {
    delete require.cache[require.resolve('../index.js')];
    livelyLoader = require('../index.js');

    log("setup");
    global.livelyLoaderTests = { loadedModules: [] }
    livelyLoader.start({
      rootPath: process.env.LIVELY
    }, function() {
      lively.Config.codeBase = 'file://' + path.join(__dirname, 'test-modules') + '/';
      log("setup done");
      callback();
    });
  });

  afterEach(function(callback) {
    try {
      Global.subNamespaces(true).forEach(function(ea) {
        if (ea !== lively) ea.remove();
      })
    } catch (e) { console.error(String(e)); }
    delete global.livelyLoaderTests;
    log("tearDown");
    callback();
  });

  it("testIfItWorksAtAll", function(done) {
    log("testIfItWorksAtAll");
    assert.ok(!!Object.extend, 'lively extensions not loaded?');
    assert.ok(!!lively.Config, 'lively objects not loaded?');
    assert.ok(!!lively.Module, 'lively objects not loaded 2?');

    var m = lively.module('foo.bar');
    assert.equal(m.uri(), lively.Config.codeBase + 'foo/bar.js');
    log("... testIfItWorksAtAll done");
    done();
  });

  it("testSimpleModuleLoad", function(done) {
    log("testSimpleModuleLoad");
    lively.require('a').toRun(function() {
      assert.deepEqual(livelyLoaderTests.loadedModules, ['a']);
      log("... testSimpleModuleLoad done");
      done();
    });
  });

  it("testLoadModuleWithDependency", function(done) {
    log("testLoadModuleWithDependency")
    lively.require('b').toRun(function() {
      assert.deepEqual(livelyLoaderTests.loadedModules, ['dir1.c', 'b']);
      log("... testLoadModuleWithDependency done");
      done();
    });
  });

  it("testLoadModuleWithDoubleDependency", function(done)  {
    log("testLoadModuleWithDoubleDependency");
    lively.require('c').toRun(function() {
      // assert.deepEqual(livelyLoaderTests.loadedModules, ['dir1.c', 'dir1.d', 'c']);
      log("... testLoadModuleWithDoubleDependency done");
      done();
    });
  });

  it("testConcurrentRequires", function(done) {
    log("testConcurrentRequires");
    var test1 = false, test2 = false;
    lively.require('c').toRun(function() {
      assert.deepEqual(livelyLoaderTests.loadedModules, ['dir1.c', 'dir1.d', 'c'], '1');
      test1 = true;
    });
    lively.require('c').toRun(function() {
      assert.deepEqual(livelyLoaderTests.loadedModules, ['dir1.c', 'dir1.d', 'c'], '2');
      test2 = true;
    });
    (function finish() {
      if (!test1 || !test2) setTimeout(finish, 20);
      else {
        done();
        log("... testConcurrentRequires done");
      }
    })();
  });

  it("testLoadModuleWithError", function(done) {
    log("testLoadModuleWithError")
    lively.require('d').toRun(function() {
      assert.ok(false, 'require body executed although dependencies couldn\'t be loaded?!');
    });
    setTimeout(function() {
      assert.deepEqual(livelyLoaderTests.loadedModules, ['dir1.c', 'dir1.moduleWithError']);
      done();
    }, 200);
  });

    // testLoadNonExistingModule: function(test) {
    //     lively.require('nonExisiting').toRun(function() {
    //     	test.deepEqual(livelyLoaderTests.loadedModules, []);
    //         test.done();
    //     });
    // }

});
