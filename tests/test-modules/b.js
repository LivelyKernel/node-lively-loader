module('b').requires('dir1.c').toRun(function() {
  console.log('module b executing');
  livelyLoaderTests.loadedModules.push('b');
});