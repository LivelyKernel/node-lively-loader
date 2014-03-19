// process.env.l2lTrackerId = "tracker-4FA7D70E-98B7-47D5-BC0E-C805318C186B";
// var l2l = require("../node-2-lively/examples/nodejs2lively.example.js");

var path = require("path");
global.lvLoader = require('./index.js');

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if (!process.env.LIVELY) {
    throw new Error('ENV variable LIVELY needs to be set to the Lively base directory!');
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 1. init
global.livelyCoreDir = path.join(process.env.LIVELY, "core");
lvLoader.setRoot(livelyCoreDir);

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 2. add expected objects/interfaces
global.Global = global
Global.window = window = Global;
// Global.document = document = doc;
Global.console = console;
// Global.Event = {};
// Global.getSelection = function() {};
Global.UserAgent = {isNodeJS: true};
// Global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
// Global._require = module.require.bind(module); // native NodeJS require
// Global.__dirname = require('path').dirname(module.filename);
// module.exports = Global;

Global.LivelyMigrationSupport = {
    // increase this value by hand if you make a change that effects
    // object layout LivelyMigrationSupport.migrationLevel
    migrationLevel: 8,
    documentMigrationLevel: 0,
    migrationLevelNodeId: 'LivelyMigrationLevel',
    moduleRenameDict: {},
    worldJsoTransforms: [],

    extractMigrationLevel: function(doc) {
        // LivelyMigrationSupport.extractMigrationLevel(document);
        var node = doc.getElementById(this.migrationLevelNodeId);
        return node ? Number(node.textContent) : 0;
    },

    setDocumentMigrationLevel: function(doc) {
        this.documentMigrationLevel = this.extractMigrationLevel(doc);
    },

    // module renaming
    fixModuleName: function(name) {
        if (/^Global\./.test(name)) name = name.substring(7/*Global.*/);
        if (/^\.\.\//.test(name)) name = name.substring(3/*../*/);
        for (var oldName in this.moduleRenameDict) {
            if (oldName === name) return this.moduleRenameDict[oldName];
        }
        return name;
    },

    addModuleRename: function(oldName, newName, migrationLevel) {
        this.moduleRenameDict[oldName] = newName;
    },

    addWorldJsoTransform: function(func) {},

    applyWorldJsoTransforms: function(jso) {},

    fixCSS: function(doc) {}
};

Global.JSLoader = {
  currentDir: function() { return ''; }
}

Global.lively = lvLoader.module("lively");

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 3. load non-modules
require(path.join(livelyCoreDir, 'lively/Migration.js'));
require(path.join(livelyCoreDir, 'lively/JSON.js'));
require(path.join(livelyCoreDir, 'lively/lang/Object.js'));
require(path.join(livelyCoreDir, 'lively/lang/Function.js'));
require(path.join(livelyCoreDir, 'lively/lang/String.js'));
require(path.join(livelyCoreDir, 'lively/lang/Array.js'));
require(path.join(livelyCoreDir, 'lively/lang/Number.js'));
require(path.join(livelyCoreDir, 'lively/lang/Date.js'));
require(path.join(livelyCoreDir, 'lively/lang/Worker.js'));
require(path.join(livelyCoreDir, 'lively/lang/LocalStorage.js'));
require(path.join(livelyCoreDir, 'lively/defaultconfig.js'));
require(path.join(livelyCoreDir, 'lively/Base.js'));
// require(path.join('core/lively/ModuleSystem.js))

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// 4. load core modules
// lvLoader.load('lively.Helper')
