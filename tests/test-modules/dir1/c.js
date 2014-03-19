module('dir1.c').requires().toRun(function() {
  console.log('module dir1.c executing');
  livelyLoaderTests.loadedModules.push('dir1.c');
});