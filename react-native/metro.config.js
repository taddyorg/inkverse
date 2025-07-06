const { getDefaultConfig } = require('expo/metro-config');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');
const { FileStore } = require('metro-cache');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

// Start with Expo's default config
const config = getDefaultConfig(projectRoot);

// Apply Sentry configuration
const sentryConfig = getSentryExpoConfig(projectRoot);
config.transformer = {
  ...config.transformer,
  ...sentryConfig.transformer,
};

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
    const parts = moduleName.split('/');
    const packageName = parts[1];
    const packagePath = path.resolve(monorepoRoot, 'packages', packageName);
    
    try {
      let distPath;
      
      if (parts.length > 2) {
        // Handle subpath imports like @inkverse/shared-client/dispatch/authentication
        const subPath = parts.slice(2).join('/');
        distPath = path.join(packagePath, 'dist', `${subPath}.js`);
      } else {
        // Handle bare imports like @inkverse/shared-client
        distPath = path.join(packagePath, 'dist', 'index.js');
      }
      
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