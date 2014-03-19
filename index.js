var vm = require("vm");
var util = require("util");
var path = require("path");
var fs = require("fs");
var async = require("async");

var root = '';

function log(/*args*/) {
  var args = Array.prototype.slice.call(arguments);
  args[0] = '[lv-module-loader] ' + args[0];
  console.log.apply(console, args);
}

function resolve(moduleOrName) {
  var name, module
  if (typeof moduleOrName === 'string') {
    name = moduleOrName; module = lvModule(name);
  } else {
    name = moduleOrName.namespaceIdentifier; module = moduleOrName;
  }

  var ext = '.js';
  var fileName = name.replace(/\./g, path.sep) + ext;
  var fullPath = path.join(root, fileName)

  module.__cachedUri = fullPath;

  return function(next) { next(null, module); }
}

function readFromDisk(module, next) {
  log("readFromDisk %s", module.uri());
  fs.readFile(module.uri(), function(err, content) {
    module.__source = content;
    next(err, module);
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var moduleRegistry = {};

function lvModule(mName) {
  if (moduleRegistry[mName]) return moduleRegistry[mName];

  var newModule = {

    callbacks: [],
    namespaceIdentifier: mName,
    pendingRequirements: [],
    dependendModules: [],
    requires: null,
    wasDefined: false,

    uri: function() {
      return this.__cachedUri;
    },

    addRequiredModule: function (requiredModule) {
        if (requiredModule.isLoaded()) return;
        this.pendingRequirements.push(requiredModule);
        requiredModule.addDependendModule(this);
    },

    removeRequiredModule: function (requiredModule) {
      log("%s was loaded", requiredModule);
      if (this.pendingRequirements && !this.pendingRequirements.include(requiredModule)) {
        console.error('requiredModule not there');
      }
      this.pendingRequirements = this.pendingRequirements.filter(function(req) {
        return req !== requiredModule; });
      if (!this.hasPendingRequirements()) { this.load(); }
    },

    hasPendingRequirements: function () {
      if (this.pendingRequirements && this.pendingRequirements.length > 0) return true;
      // if (this.requiredLibs && this.requiredLibs.any(function(libSpec) { return !libSpec.loadTest(); })) return true;
      return false;
    },

    loadRequirementsFirst: function () {
      this.pendingRequirements && this.pendingRequirements.forEach(function(ea) { ea.load(); });
      // this.requiredLibs && this.requiredLibs.invoke('load');
    },

    addDependendModule: function (depModule) {
      this.dependendModules.push(depModule);
    },

    informDependendModules: function () {
      var deps = this.dependendModules;
      this.dependendModules = [];
      deps.forEach(function(ea) { ea.removeRequiredModule(this) }, this);
    },

    addOnloadCallback: function (cb, idx) {
      if (typeof idx === 'number') this.callbacks.splice(idx,0,cb);
      else this.callbacks.push(cb);
    },

    runOnloadCallbacks: function () {
        var cb, id = this.namespaceIdentifier;
        while ((cb = this.callbacks.shift())) {
          try { cb(); } catch(e) {
            console.error('%s runOnloadCallbacks: %s: %s', cb.name, e);
            throw e;
          }
        };
    },

    load: function(loadSync) {
      if (loadSync) throw new Error('sync loading not yet supported');
      if (this.isLoaded()) {
          this.runOnloadCallbacks();
          return;
      }

      if (this.wasDefined && !this.hasPendingRequirements()) {
          this.runOnloadCallbacks();
          this.informDependendModules();
          return;
      }

      if (this.isLoading() || this.wasDefined) {
          this.loadRequirementsFirst();
          return;
      }

      load(this.namespaceIdentifier);

    },

    isLoaded: function() {
      return this.wasDefined && this.pendingRequirements.length === 0;
    },

    isLoading: function () {
      if (this.isLoaded()) return false;
      // if (this.uri().include('anonymous')) return true;
      return !!this.wasDefined;
    },

    toString: function() {
      return util.format("lvModule(%s)", this.namespaceIdentifier);
    }

  };

  newModule.requires = lvRequire.bind(newModule);

  return moduleRegistry[mName] = newModule;
}

function lvRequire(/*deps*/) {
  var args = Array.prototype.slice.call(arguments);
  var thisModule = this;
  var dependencyNames = args.length === 1 && Array.isArray(args[0]) ?
    args[0] : args;

  var deps = dependencyNames.map(lvModule);

  deps.forEach(thisModule.addRequiredModule.bind(thisModule));

  return {
    toRun: function(cb) {
      thisModule.addOnloadCallback(cb, 0/*add as first callback*/);

      thisModule.wasDefined = true;
      thisModule.load();
    }
  }; 

}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function wrapModule(module, next) {
  log("wrapModule %s", module);
  var header = 'var require = lvRequire;\n'
             + 'var module = lvModule;\n';
  module.__wrappedSource = header + module.__source;
  next(null, module);
}

function runModule(m, next) {
  log("runModule %s", m);
  var err;
  try {
    eval(m.__wrappedSource);
  } catch (e) { err = e; }
  next(err, m);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function setRoot(dir) { root = dir; }

function load(moduleName, thenDo) {
  log('about to intialize loading %s', moduleName);
  async.waterfall([
    resolve(moduleName),
    readFromDisk,
    wrapModule,
    runModule
  ], function(err, m) {
    log('initialized loading %s', m);
    if (!thenDo) return;
    if (m.isLoaded()) thenDo(null);
    else m.addOnloadCallback(thenDo.bind(null,null/*err*/));
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

module.exports = {
  setRoot: setRoot,
  load: load,
  modules: moduleRegistry,
  module: lvModule
}
