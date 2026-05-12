const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const localModulePath = path.resolve(projectRoot, '../expo-screen-time');

const config = getDefaultConfig(projectRoot);

// Watch the local expo-screen-time package directory.
// Required because file: dependencies point outside the project root,
// and Metro won't follow junctions to directories outside its boundary.
config.watchFolders = [localModulePath];

// Force Metro to resolve all packages from the app's node_modules first.
// Without this, files inside expo-screen-time/build/ would resolve 'expo'
// to expo-screen-time/node_modules/expo (v55) instead of the app's (v54).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Custom resolver for the local expo-screen-time package
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-screen-time') {
    const indexPath = path.join(localModulePath, 'build', 'index.js');

    if (require('fs').existsSync(indexPath)) {
      return {
        filePath: indexPath,
        type: 'sourceFile',
      };
    }
  }

  // Fall back to default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
