/*global require,console,global,module,process*/

var util       = require("util");
var path       = require("path");
var fs         = require("fs");
var async      = require("async");
var livelyLang = require("lively.lang");
var debug      = true;

function log(/*args*/) {
    if (!debug) return;
    var args = Array.prototype.slice.call(arguments);
    args[0] = '[lv-module-loader] ' + args[0];
    console.log.apply(console, args);
}

function resolve(url) {
    return function(next) { next(null, url.replace(/^file:\/\//, '')); }
}

function readFromDisk(fn, next) {
    log("readFromDisk %s", fn);
    fs.readFile(fn, function(err, content) { next(err, fn, content); });
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

function parseJSON(fn, json, next) {
    var jso;
    try {
        jso = JSON.parse(json);
    } catch (e) { next(e, fn, null); return; }
    next(null, fn, jso);
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

function signalIsLoaded(url, optContent) {
    var st = ensureLoadState(url);
    if (typeof optContent !== "undefined") st.result = optContent;
    st.isLoading = false;
    st.isLoaded = true;
    while (st.callbacks[0]) st.callbacks.shift().call(global, null, optContent);
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

function load(url, onLoadCb, contentProcessor) {
    if (hasError(url)) {
        console.warn("trying to load %s but previous load attempt threw error!");
        return;
    }
    if (isLoaded(url)) { onLoadCb && onLoadCb.call(global, ensureLoadState(url).result); return; }
    addCallback(url, onLoadCb);
    if (isLoading(url)) return;
    signalIsLoading(url);
    async.waterfall([
        resolve(url),
        readFromDisk,
        contentProcessor
    ], function(err, fn, result) {
        log('loaded %s', url);
        if (err) {
            console.error("failed loading %s:\n", url, err);
            signalError(url, err);
        } else signalIsLoaded(url, result);
    });

}

function addCallback(url, callback) {
    callback && ensureLoadState(url).callbacks.push(callback);
}

var loader = {

    loadJs: function (url, onLoadCb, loadSync, okToUseCache, cacheQuery) {
        load(url, onLoadCb, function(fileName, content, next) {
            async.waterfall([
                wrapCode.bind(null, fileName, content),
                runCode
            ], next);
        });
    },

    loadJSON: function (url, onLoadCb, beSync) {
        load(url, onLoadCb, function(fileName, content, next) {
            parseJSON(fileName, content, next);
        });
    }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var lvDir = process.env.WORKSPACE_LK || process.env.LIVELY;
if (!lvDir.match(/\/$/)) lvDir += "/";

var started = false;
function start(options, thenDo) {
    if (!lvDir) throw new Error("LIVELY environment variable is undefined. It should point to the lively base directory");

    if (started) { thenDo && thenDo(null); return; }

    livelyLang.deprecatedLivelyPatches();

    options = options ? util._extend(defaultOptions, options) : defaultOptions;
    require('./lib/bootstrap')(defaultOptions, function(err) {
        if (err) console.error("Error in lively-loader: ", err);
        started = true;
        thenDo && thenDo(err);
    });
}

var baseURL = 'file://' + lvDir;

var defaultOptions = {
    loader: loader,
    rootPath: baseURL,
    location: {isNodejs: true, toString: function() { return baseURL; }},
    locationDirectory: baseURL,
    get codeBase() { return path.join(defaultOptions.rootPath, 'core/'); },
    nodeJSURL: 'http://localhost:9001',
    bootstrapFiles: [
        'core/lively/Migration.js',
        'core/lively/lang/Object.js',
        'core/lively/lang/Function.js',
        'core/lively/lang/String.js',
        'core/lively/lang/Array.js',
        'core/lively/lang/Number.js',
        'core/lively/lang/Date.js',
        'core/lively/lang/Worker.js',
        'core/lively/lang/LocalStorage.js',
        'core/lively/defaultconfig.js',
        'core/lively/Base.js',
        'core/lively/ModuleSystem.js']
}

module.exports = {
    defaultOptions: defaultOptions,
    start: start
}
