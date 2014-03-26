module('dir1.d').requires('dir1.c').toRun(function() {
  console.log('module dir1.d executing');
  livelyLoaderTests.loadedModules.push('dir1.d');
});