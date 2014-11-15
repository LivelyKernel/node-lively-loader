var path = require('path');

function initGlobals(options, thenDo) {
    // 1) establish required objects

    global.Global = global;
    global.window = global;
    global.UserAgent = {};

    var lively = Global.lively = Global.lively || {};

    lively.whenLoaded = function(callback) {
        lively.Config.finishLoadingCallbacks.push(callback);
    };

    var rootPath = options.rootPath;
    var loadedURLs = [];
    var JSLoader = Global.JSLoader = {
        loadedURLs: loadedURLs,

        loadJs: function(url, callback) { options.loader.loadJs(url, callback); },

        loadJSON: function(url, callback) { options.loader.loadJSON(url, callback); },

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
    };

    Global.LivelyMigrationSupport = {
        fixModuleName: function(n) { return n; },
        addModuleRename: function(modName) {}
    };

    Global.LivelyLoader = {
        location: options.location,
        bootstrapFiles: null,
        libsFiles: [] // FIXME
    };

    var Config = require((options.rootPath + "/core/lively/defaultconfig.js").replace(/^file:\/\//, ""));
    Config.bootstrap(
        Global.LivelyLoader, Global.JSLoader, options,
        function(err) {
            Global.LivelyLoader.bootstrapFiles = Config.get("bootstrapFiles");

            // 2) Load bootstrap files
            Global.LivelyLoader.bootstrapFiles.forEach(function(ea) {
                require(path.join(rootPath.replace(/^file:\/\//, ''), ea)); });
            thenDo(err, Global.lively);
        });
}

module.exports = initGlobals;
