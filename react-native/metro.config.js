const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');
const { FileStore } = require('metro-cache');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

// Start with Sentry's Expo config
const config = getSentryExpoConfig(projectRoot);

// 1. Set up Metro to understand the monorepo structure
config.watchFolders = [monorepoRoot];

// 2. Configure node module resolution
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Use a custom cache directory to avoid conflicts
config.cacheStores = [
  new FileStore({
    root: path.join(projectRoot, '.metro-cache'),
  }),
];

// 4. Disable hierarchical lookup for more predictable module resolution
config.resolver.disableHierarchicalLookup = true;

// 5. Ensure source extensions include TypeScript
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'ts', 'tsx'];

// 6. Configure resolver to handle monorepo packages
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @inkverse/* packages from the monorepo
  if (moduleName.startsWith('@inkverse/')) {
    const packageName = moduleName.split('/')[1];
    const packagePath = path.resolve(monorepoRoot, 'packages', packageName);
    
    try {
      // Try to resolve from the package's dist directory
      const distPath = path.join(packagePath, 'dist', 'index.js');
      if (require('fs').existsSync(distPath)) {
        return {
          filePath: distPath,
          type: 'sourceFile',
        };
      }
    } catch (error) {
      // Fall through to default resolution
    }
  }
  
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config; 