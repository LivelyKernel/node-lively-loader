var path = require('path');

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
    }

    var loadedURLs = [];
    Global.JSLoader = {
        loadedURLs: loadedURLs,

        loadJs: function(url, callback) { options.loader.loadJs(url, callback); },

        currentDir: function () { return options.locationDirectory; },

        isLoading: function(url) { return loadedURLs.indexOf(url) !== -1; },

        scriptInDOM: function(url) { return JSLoader.isLoading(url); },

        removeQueries: function(urlString) {
            var url = require('url').parse(urlString);
            url.query = '';
            url.search = '';
            return url.format();
        },

        removeAllScriptsThatLinkTo: function(url) {
            var idx;
            while ((idx = loadedURLs.indexOf(url)) > -1)
                loadedURLs.splice(idx, 1);
        },

        getOption: function() { console.warn('getOption not yet implemented'); return null; },

        resolveURLString: function(urlString) { console.warn('resolveURLString not yet implemented'); }
    }

    Global.LivelyMigrationSupport = {
        fixModuleName: function(n) { return n; },
        addModuleRename: function(modName) {}
    }

    // 2) Load bootstrap files
    // importScripts.apply(this, options.bootstrapFiles || []);
    options.bootstrapFiles.forEach(function(ea) {
        console.log('Loading lively bootstrap file %s', ea);
        require(path.join(lively.Config.rootPath.replace(/^file:\/\//, ''), ea)); });

}

module.exports = initGlobals;
