var util = require("util");
var path = require("path");
var fs = require("fs");
var async = require("async");
var livelyLang = require("lively.lang");
var debug = false;

function log(/*args*/) {
    if (!debug) return;
    var args = Array.prototype.slice.call(arguments);
    args[0] = '[lv-module-loader] ' + args[0];
    console.log.apply(console, args);
}

function resolve(url) {
    return function(next) {
        next(null, url.replace(/^file:\/\//, ''));
    }
}

function readFromDisk(fn, next) {
    log("readFromDisk %s", fn);
    fs.readFile(fn, function(err, content) {
        next(err, fn, content);
    });
}

function wrapCode(fn, content, next) {
    log("wrapCode %s", fn);
    var header = 'var require = lively.require;\n'
               + 'var module = lively.module;\n';
    next(null, fn, header + content);
}

function runCode(fn, source, next) {
    log("runCode %s", fn);
    var err;
    try {
        source += '\n//@ sourceURL=' + fn + '\n';
        eval(source);
    } catch (e) {
        console.error("Error when loading %s: ", fn, e.stack || e);
        err = e;
    }
    next(err, fn);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var loadState = {};

function ensureLoadState(url) {
    return loadState[url] || (loadState[url] = {
        isLoading: false,
        isLoaded: false,
        error: null,
        callbacks: []
    });
}

function isLoading(url) { return !!ensureLoadState(url).isLoading; }

function isLoaded(url) { return !!ensureLoadState(url).isLoaded; }

function hasError(url) { return !!ensureLoadState(url).error; }

function signalIsLoaded(url) {
    var st = ensureLoadState(url);
    st.isLoading = false;
    st.isLoaded = true;
    while (st.callbacks[0]) st.callbacks.shift().call(global);
}

function signalIsLoading(url) {
    var st = ensureLoadState(url);
    st.isLoading = true;
    st.isLoaded = false;
}

function signalError(url, err) {
    var st = ensureLoadState(url);
    st.isLoading = false;
    st.isLoaded = false;
    st.error = err;
}

function addCallback(url, callback) {
    callback && ensureLoadState(url).callbacks.push(callback);
}

var loader = {

    loadJs: function (url, onLoadCb, loadSync, okToUseCache, cacheQuery) {
        if (hasError(url)) {
            console.warn("trying to load %s but previous load attempt threw error!");
            return;
        }
        if (isLoaded(url)) { onLoadCb && onLoadCb.call(global); return; }
        addCallback(url, onLoadCb);
        if (isLoading(url)) return;
        signalIsLoading(url);
        async.waterfall([
            resolve(url),
            readFromDisk,
            wrapCode,
            runCode
        ], function(err) {
            log('loaded %s', url);
            if (err) {
                console.error("failed loading %s:\n", url, err);
                signalError(url, err);
            } else signalIsLoaded(url);
        });
    }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var started = false;
function start(options, thenDo) {
    if (!process.env.LIVELY) throw new Error("LIVELY environment variable is undefined. It should point to the lively base directory");

    if (started) { thenDo && thenDo(null); return; }

    livelyLang.deprecatedLivelyPatches();

    options = options ? util._extend(defaultOptions, options) : defaultOptions;
    require('./lib/bootstrap')(defaultOptions);
    started = true;
    thenDo && thenDo(null);
}

var baseURL = 'file://' + process.env.LIVELY;


var defaultOptions = {
    loader: loader,
    rootPath: baseURL,
    location: baseURL,
    locationDirectory: baseURL,
    get codeBase() { return defaultOptions.rootPath + 'core/'; },
    nodeJSURL: 'http://localhost:9001',
    bootstrapFiles: [
        'core/lively/Migration.js',
        // 'core/lively/JSON.js',
        // 'core/lively/lang/Worker.js',
        // 'core/lively/lang/LocalStorage.js',
        // 'core/lively/defaultconfig.js',
        'core/lively/Base.js',
        'core/lively/ModuleSystem.js']
}

module.exports = {
    defaultOptions: defaultOptions,
    start: start
}
