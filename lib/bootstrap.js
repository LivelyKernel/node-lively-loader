var vm = require('vm');
var path = require('path');
var fs = require("fs");

function initGlobals(options) {
    // 1) establish required objects

    Global = this;
    // Global.window = Global;

    Global.lively = {

        whenLoaded: function(callback) {
            // currently ignored in worker
            Global.Config.finishLoadingCallbacks.push(callback);
        },

        Config: {
            codeBase: options.codeBase,
            rootPath: options.rootPath,
            nodeJSURL: options.nodeJSURL,
            location: options.location,
            finishLoadingCallbacks: [],
            modulePaths: []
        }
    };

    Global.Config = lively.Config;

    lively.Config.location.toString = function() { return this.href; }
    Global.document = {
        location: lively.Config.location,
        URL: lively.Config.location.toString()
    };

    var loadedURLs = [];
    Global.JSLoader = {
        loadedURLs: loadedURLs,

        loadJs: function(url, callback) {
            options.loader.loadJs(url, callback);
        },

        currentDir: function () { return options.locationDirectory; },

        isLoading: function(url) { return loadedURLs.indexOf(url) !== -1; },

        scriptInDOM: function(url) { return Global.JSLoader.isLoading(url); },

        removeQueries: function(urlString) {
            var url = require('url').parse(urlString);
            url.query = '';
            url.search = '';
            return url.format();
        },

        getOption: function() { console.warn('getOption not yet implemented'); return null; },

        resolveURLString: function(urlString) { console.warn('resolveURLString not yet implemented'); }
    }

    Global.LivelyMigrationSupport = {
        fixModuleName: function(n) { return n; },
        addModuleRename: function(modName) {}
    }

    // 2) Load bootstrap files
    options.bootstrapFiles.forEach(function(ea) {
        console.log('Loading lively bootstrap file %s', ea);
        var fn = path.join(lively.Config.rootPath.replace(/^file:\/\//, ''), ea);

        var content = fs.readFileSync(fn);
        vm.runInThisContext(content.toString(), fn)
        // require(fn);
    });

}

module.exports = initGlobals;
