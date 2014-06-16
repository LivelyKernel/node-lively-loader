var path = require('path');

function initGlobals(options) {
    // 1) establish required objects

    Global = this;
    global.UserAgent = {};
    global.window = global;

    Global.lively = Global.lively || {};

    Global.lively.whenLoaded = function(callback) {
        // currently ignored in worker
        Global.Config.finishLoadingCallbacks.push(callback);
    };

    Global.lively.Config = Global.lively.Config || {};
    Global.lively.Config.codeBase = options.codeBase;
    Global.lively.Config.rootPath = options.rootPath;
    Global.lively.Config.nodeJSURL = options.nodeJSURL;
    Global.lively.Config.location = options.location;
    Global.lively.Config.finishLoadingCallbacks = [];
    Global.lively.Config.modulePaths = [];

    Global.Config = lively.Config;

    lively.Config.location.toString = function() { return this.href; }
    Global.document = {
        location: lively.Config.location,
        URL: lively.Config.location.toString()
    }
    lively.Config.get = function(name, ignoreIfUndefinedOption) {
        var spec = this[name]; // mr-2014-06-16: Originally references ._options[name]
        if (!ignoreIfUndefinedOption && spec == null) throw new Error('Trying to get unknown option lively.Config.' + name);
        return spec && spec.get ?
            spec.get.call() : (typeof this[name] === "function" ? this[name].call() : this[name]);
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
    };

    Global.LivelyMigrationSupport = {
        fixModuleName: function(n) { return n; },
        addModuleRename: function(modName) {}
    };

    Global.LivelyLoader = {
        bootstrapFiles: options.bootstrapFiles,
        libsFiles: [] // FIXME
    };

    // 2) Load bootstrap files
    // importScripts.apply(this, options.bootstrapFiles || []);
    Global.LivelyLoader.bootstrapFiles.forEach(function(ea) {
        console.log('Loading lively bootstrap file %s', ea);
        require(path.join(lively.Config.rootPath.replace(/^file:\/\//, ''), ea)); });

}

module.exports = initGlobals;
