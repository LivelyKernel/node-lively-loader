module('dir1.moduleWithError').requires('dir1.c').toRun(function() {
  console.log('module dir1.moduleWithError executing');
  livelyLoaderTests.loadedModules.push('dir1.moduleWithError');
  throw new Error('from dir1.moduleWithError');
});