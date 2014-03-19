module('a').requires().toRun(function() {
  console.log('module a executing');
  livelyLoaderTests.loadedModules.push('a');
});