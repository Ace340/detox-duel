const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Use absolute paths to avoid any CWD-relative resolution issues
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const localModulePath = path.resolve(projectRoot, './expo-screen-time');

const config = getDefaultConfig(projectRoot);

// Only watch the local expo-screen-time module.
// Do NOT include workspaceRoot or workspace node_modules here —
// that causes Metro to resolve the entry file from the workspace root
// instead of the project root, breaking the Gradle JS bundle step.
config.watchFolders = [
  localModulePath,
  path.resolve(projectRoot, 'modules', 'expo-app-blocker'),
];

// Remove any auto-added workspace-level watch folders (e.g. hoisted node_modules)
config.watchFolders = config.watchFolders.filter(
  (folder) => !folder.startsWith(workspaceRoot + path.sep) || folder === localModulePath || folder === path.resolve(projectRoot, 'modules', 'expo-app-blocker')
);

// Force Metro to resolve all packages from the app's node_modules first,
// then fall back to the workspace root's node_modules for hoisted deps.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure the project root is set explicitly as absolute path
config.projectRoot = projectRoot;

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
