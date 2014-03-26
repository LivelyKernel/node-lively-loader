module('d').requires('dir1.moduleWithError').toRun(function() {
  console.log('module d executing');
  livelyLoaderTests.loadedModules.push('d');
});