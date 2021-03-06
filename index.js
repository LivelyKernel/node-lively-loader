/*global require,console,global,module,process*/

var util       = require("util");
var path       = require("path");
var fs         = require("fs");
var livelyLang = require("lively.lang");
var debug      = false;

function log(/*args*/) {
  if (!debug) return;
  var args = Array.prototype.slice.call(arguments);
  args[0] = '[lv-module-loader] ' + args[0];
  console.log.apply(console, args);
}

function resolve(url) { return url.replace(/^file:\/\//, ''); }

function readFromDisk(fn) {
  log("readFromDisk %s", fn);
  return fs.readFileSync(fn);
}

function wrapCode(fn, content, next) {
    log("wrapCode %s", fn);
    return ";(function livelyCodeInNodejs(require, module, nodejs) {\n"
         + content
         + "\n})(lively.require, lively.module, {require: require, module: module});";
}

function runCode(fn, source, next) {
    log("runCode %s", fn);
    try {
      source += '\n//# sourceURL=' + fn + '\n';
      eval(source);
    } catch (err) {
      console.error("Error when loading %s: ", fn, err.stack || err);
      throw err;
    }
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
    while (st.callbacks[0]) st.callbacks.shift().call(global, err);
}

function load(url, onLoadCb, contentProcessor) {
  if (hasError(url)) {
    log("trying to load %s but previous load attempt threw error!");
    return;
  }
  if (isLoaded(url)) { onLoadCb && onLoadCb.call(global, ensureLoadState(url).result); return; }
  addCallback(url, onLoadCb);
  if (isLoading(url)) return;
  signalIsLoading(url);
  try {
    var fn = resolve(url),
        content = readFromDisk(fn),
        result = contentProcessor(fn, content);
  } catch (err) {
    log("failed loading %s:\n", url, err);
    signalError(url, err);
    return;
  }
  log('loaded %s', url);
  signalIsLoaded(url, result);
}

function addCallback(url, callback) {
  callback && ensureLoadState(url).callbacks.push(callback);
}

var loader = {
  loadJs: function (url, onLoadCb, loadSync, okToUseCache, cacheQuery) {
    load(url, onLoadCb, function(fileName, content) { return runCode(fileName, wrapCode(fileName, content)); });
  },
  loadJSON: function (url, onLoadCb, beSync) {
    load(url, onLoadCb, function(fileName, content) { return JSON.parse(content); });
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var started = false;
function start(options, thenDo) {
  if (started) { thenDo && thenDo(null); return; }

  var lvDir = options.livelyDirectory || process.env.WORKSPACE_LK || process.env.LIVELY;
  if (!lvDir) throw new Error("Cannot find the Lively base direcrory. Use the option livelyDirectory or the environment variable LIVELY to set it.");
  if (!lvDir.match(/\/$/)) lvDir += "/";
  options.livelyDirectory = lvDir;

  var server, addr;
  if (options && options.lifeStar) {
    server = options.lifeStar.getServer();
    addr = server.address();
  }

  var baseURL = 'file://' + lvDir,
    defaultOptions = {
      loader: loader,
      rootPath: baseURL,
      location: {
        isNodejs: true,
        // href: "...",
        host: addr ? addr.address + ":" + addr.port : null,
        hostname: addr ? addr.address : null,
        href: null,
        origin: null,
        pathname: null,
        port: addr ? addr.port : addr,
        protocol: server ? (server.config.enableSSL ? "https:" : "http:") : null,
        toString: function() { return baseURL; }
      },
      locationDirectory: baseURL,
      get codeBase() { return defaultOptions.rootPath.replace(/\/?$/, '/') + 'core/'; },
      nodeJSURL: 'http://localhost:9001'
    }

  livelyLang.deprecatedLivelyPatches();

  options = options ? util._extend(defaultOptions, options) : defaultOptions;
  require('./lib/bootstrap')(defaultOptions, function(err, lively) {
    if (err) console.error("Error in lively-loader: ", err);
    started = true;
    thenDo && thenDo(err, lively);
  });
}

module.exports = {
    start: start,
    withLivelyNamespaceDo: function(startOptions, doFunc) {
        if (typeof startOptions === 'function') {
            doFunc = startOptions; startOptions = {};}
        if (started) doFunc(null, Global.lively);
        else start(startOptions, doFunc);
    }
}
