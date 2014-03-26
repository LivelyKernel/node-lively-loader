var path = require("path"),
    livelyLoader = require('../index.js');

var tests = {

    setUp: function (callback) {
        global.livelyLoaderTests = { loadedModules: [] }
        livelyLoader.start({
            rootPath: process.env.LIVELY
        }, function() {
            lively.Config.codeBase = 'file://' + path.join(__dirname, 'test-modules') + '/';
            callback();
        });
    },

    tearDown: function (callback) {
        try {
            livelyLoaderTests.loadedModules.forEach(function(ea) {
                lively.module(ea).remove();
            });
        } catch (e) { console.error(String(e)); }
        delete global.livelyLoaderTests;
        callback();
    },

    testIfItWorksAtAll: function(test) {
        test.ok(!!Object.extend, 'lively extensions not loaded?');
        test.ok(!!lively.Config, 'lively objects not loaded?');
        test.ok(!!lively.Module, 'lively objects not loaded 2?');

        var m = lively.module('foo.bar');
        test.equals(m.uri(), lively.Config.codeBase + 'foo/bar.js');
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
    },

    testLoadModuleWithDoubleDependency: function(test) {
        lively.require('c').toRun(function() {
        	test.deepEqual(livelyLoaderTests.loadedModules, ['dir1.c', 'dir1.d', 'c']);
        	test.done();
        });
    },

    testConcurrentRequires: function(test) {
        var test1 = false, test2 = false;
        lively.require('c').toRun(function() {
        	test.deepEqual(livelyLoaderTests.loadedModules, ['dir1.c', 'dir1.d', 'c'], '1');
        	test1 = true;
        });
        lively.require('c').toRun(function() {
        	test.deepEqual(livelyLoaderTests.loadedModules, ['dir1.c', 'dir1.d', 'c'], '2');
        	test2 = true;
        });
        (function finish() {
            if (!test1 || !test2) setTimeout(finish, 20);
            else test.done();
        })();
    }

};

module.exports = tests;
