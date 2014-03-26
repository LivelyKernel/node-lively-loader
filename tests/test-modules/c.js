module('c').requires('dir1.d').toRun(function() {
  console.log('module c executing');
  livelyLoaderTests.loadedModules.push('c');
});