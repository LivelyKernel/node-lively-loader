var util = require("util");
var path = require("path");
var fs = require("fs");
var async = require("async");

function log(/*args*/) {
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
    return loadState[url] || (loadState[url] = {isLoading: false, isLoaded: false, callbacks: []});
}

function isLoading(url) {
    var st = ensureLoadState(url);
    return st ? !!st.isLoading : false;
}

function isLoaded(url) {
    var st = ensureLoadState(url);
    return st ? !!st.isLoaded : false;
}

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

function addCallback(url, callback) {
    callback && ensureLoadState(url).callbacks.push(callback);
}

var loader = {

    loadJs: function (url, onLoadCb, loadSync, okToUseCache, cacheQuery) {
        if (isLoaded(url)) { onLoadCb && onLoadCb.call(global); return; }
        addCallback(url, onLoadCb);
        if (isLoading(url)) return;
        async.waterfall([
            resolve(url),
            readFromDisk,
            wrapCode,
            runCode
        ], function(err) {
            if (err) { console.error("failed loading %s:\n", url, err); return; }
            log('loaded %s%s', url);
            signalIsLoaded(url);
        });
    }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var started = false;
function start(options, thenDo) {
    if (started) { thenDo && thenDo(null); return; }
    var options = options ? util._extend(defaultOptions, options) : defaultOptions;
    require('./lib/bootstrap')(defaultOptions);
    started = true;
    console.log('started...');
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
        'core/lively/lang/Object.js',
        'core/lively/lang/Function.js',
        'core/lively/lang/String.js',
        'core/lively/lang/Array.js',
        'core/lively/lang/Number.js',
        'core/lively/lang/Date.js',
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
